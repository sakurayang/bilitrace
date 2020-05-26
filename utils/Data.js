const request = require("request-promise-native");
const schedule = require("node-schedule");
const ws = require("ws");
const parser = require("./live/parser");
const db = require("./db");
const path = require("path");
const config = require("../config");
const logger = require("./logger").getLogger("core");
const wslogger = require("./logger").getLogger("ws");
const g_data_path = config.data_path;
var prev_job_time = Date.now();

class Video {
	constructor(id, time = "*/5 * * * *") {
		this.id = Number(id);
		this.schedule_time = time;
		this.data_path = "video.db";
		(async () => await this.init())();
		this.job = schedule.scheduleJob(
			String(this.id),
			this.schedule_time,
			async () => {
				while (Date.now() - prev_job_time < 100) {}
				prev_job_time = Date.now();
				let info = await this.getInfo();
				if (info.code !== 0) return;
				this.write(info.result);
			}
		);
		logger.info(`Video ${this.id} add`);
		return this;
	}

	async init() {
		const knex = require("./db").getCore(this.data_path);
		let tableExist = await knex.schema.hasTable(`video_${this.id}`);
		if (!tableExist) {
			await knex.schema.createTable(`video_${this.id}`, table => {
				table.increments("id").primary();
				table.integer("aid").notNullable();
				table.string("title").notNullable();
				table.integer("view").notNullable();
				table.integer("coin").notNullable();
				table.integer("danma").notNullable();
				table.integer("favorite").notNullable();
				table.integer("reply").notNullable();
				table.integer("share").notNullable();
				table.integer("heart_like").notNullable();
				table.integer("public_time").notNullable();
				table.integer("update_time").notNullable();
				table.index("id");
				table.index("update_time");
			});
		}
	}

	/**
     * @returns {{
        code:Number,
        msg:String,
        result:?{
            aid: Number,
            title: String,
            view: Number,
            coin: Number,
            danma: Number,
            favorite: Number,
            reply: Number,
            share: Number,
            heart_like: Number,
            public_time: Number,
            update_time: Number
        }
    }}
     */
	async getInfo() {
		try {
			let raw_data;
			raw_data = JSON.parse(
				await request.get(
					"https://api.bilibili.com/x/web-interface/view?aid=" +
						this.id
				)
			).data;
			let stat = raw_data.stat;
			// 10d * 24hr * 60m * 60s * 1000ms = 864000000
			if (Date.now() - raw_data.pubdate * 1000 > 864000000) {
				this.cancel();
			}
			let result = {
				code: 0,
				msg: "",
				result: {
					aid: raw_data.aid,
					title: `"${raw_data.title}"`,
					view: stat.view,
					coin: stat.coin,
					danma: stat.danmaku,
					favorite: stat.favorite,
					reply: stat.reply,
					share: stat.share,
					heart_like: stat.like,
					public_time: raw_data.pubdate,
					update_time: Date.now()
				}
			};
			if (debug) logger.info(JSON.stringify(result));
			return result;
		} catch (error) {
			logger.info(error);
			return {
				code: -1,
				msg: error
			};
		}
	}

	/**
	 * @param {JSON} write_data
	 * @returns {Null}
	 */
	write(write_data) {
		db.insert(this.data_path, `video_${this.id}`, write_data);
	}

	cancel() {
		if (this.job instanceof schedule.Job) this.job.cancel();
	}
}

//TODO: 测试
//暂时没用
class Rank {
	constructor(id, interval = 3, time = "* * */3 * *") {
		this.id = Number(id);
		this.schedule_time = time;
		this.data_path = "rank.db";
		this.interval = interval;
		(async () => await this.init())();
		this.job = createSchedule(
			String(this.id),
			this.schedule_time,
			async () => {
				while (Date.now() - prev_job_time < 100) {}
				prev_job_time = Date.now();
				let info = await this.getInfo();
				if (info.code !== 0) return;
				for (const item of info.result) {
					this.write(item);
				}
			}
		);

		return this;
	}

	async init() {
		//FIXME:db
		await require("better-sqlite3")(path.join(g_data_path, this.data_path))
			.prepare(
				`CREATE TABLE IF NOT EXISTS "${this.id}" ` +
					"(count        integer   not null," +
					" aid          integer   not null," +
					" rank         integer   not null," +
					" point        integer   not null," +
					" title        text      not null," +
					" tid          integer   not null," +
					" tname        text      not null," +
					" author_mid   integer   not null," +
					" author_name  integer   not null," +
					" update_time  integer   not null," +
					" public_time  integer   not null)"
			)
			.run();
		let last_data = (await db.select(this.data_path, this.id)).result;
		this.count = last_data === undefined ? 0 : last_data.count + 1;
	}

	/**
     * @returns {{
        code:Number,
        msg:String,
        result:Array<{
            count: Number,
            aid: Number
            rank: Number
            point: Number
            title: String
            tid: Number
            tname: String
            author_mid: Number
            author_name: String
            update_time: Number
            public_time: Number
        }>
    }}
     */
	async getInfo() {
		try {
			let raw_data = JSON.parse(
				await request.get(
					`https://api.bilibili.com/x/web-interface/ranking/region?rid=${this.id}&day=${this.interval}`
				)
			);
			let db_data = [];
			for (let rank = 0, len = raw_data.length; rank < len; rank++) {
				let video = raw_data[rank];
				db_data.push({
					count: this.count,
					aid: video.aid,
					rank: rank + 1,
					point: video.pts,
					title: `"${video.title}"`,
					tid: this.spider_id,
					tname: `"${video.typename}"`,
					author_mid: video.mid,
					author_name: `"${video.author}"`,
					update_time: Date.now(),
					public_time: video.create
				});
			}
			return {
				code: 0,
				msg: "",
				result: db_data
			};
		} catch (error) {
			logger.info(error);
			return {
				code: -1,
				msg: error
			};
		}
	}

	/**
	 * @param {JSON} write_data
	 * @returns {Null}
	 */
	write(write_data) {
		//FIXME:db
		db.insert(this.data_path, this.id, write_data);
	}

	/**
	 * @returns {{code:Number,msg:String,result:Array<JSON>}}
	 */
	async read(init = false) {
		try {
			//FIXME:db
			let data;
			if (init) {
				data = await db.selectAll(this.data_path, this.data_id);
			} else {
				data = await db.select(this.data_path, this.data_id);
			}
			return {
				code: 0,
				msg: "",
				result: data
			};
		} catch (error) {
			return {
				code: -1,
				msg: error
			};
		}
	}

	cancel() {
		if (this.job instanceof schedule.Job) this.job.cancel();
	}
}

class Room {
	/**
	 * @param {Number} id
	 * @returns {this}
	 */
	constructor(id) {
		if (isNaN(id)) return new Error("error ID");
		this.id = id;
		this.data_path = "live.db";
		(async () => await this.init())();
		this.danmu_list = [];
		return this;
	}
	async init() {
		let knex = db.getCore(this.data_path);
		let tableExist = await knex.schema.hasTable(`room_${this.id}`);
		let giftTableExist = await knex.schema.hasTable(`room_${this.id}_gift`);

		if (!tableExist) {
			await knex.schema.createTable(`room_${this.id}`, table => {
				table.integer("count").notNullable;
				table.timestamp("update_time").notNullable;
				table.timestamp("time").notNullable;
				table.bigInteger("views").notNullable;
			});
		}
		if (!giftTableExist) {
			await knex.schema.createTable(`room_${this.id}_gift`, table => {
				table.bigIncrements("id");
				table.integer("count").notNullable;
				table.timestamp("update_time").notNullable;
				table.timestamp("time").notNullable;
				table.string("gift_name").notNullable;
				table.integer("gift_id").notNullable;
				table.bigInteger("gift_count").notNullable;
				table.integer("silver");
				table.integer("gold");
			});
		}
		await this.updateInfo();
		this.last_status = 0;
		this.danmu_conf = await this.getDanmuURL();
		await this.setTimer();
		logger.info(`Room ${this.id} add`);
	}
	async isLiving() {
		let info = await request.get(
			`https://api.live.bilibili.com/room/v1/Room/room_init?id=${this.id}`
		);
		info = JSON.parse(info);
		return info.data.live_status;
	}
	/**
     * @returns {
        {
            ok: false,
            error: Error
        }|{
            ok:true,
            room: {
                title: String,
                cover: String,
                start_time: Number,
                rank: String,
                area_rank: String
            },
            area:{
                id: Number,
                name: String,
                parent: {
                    id: Number,
                    name: String
                }
            },
            author: {
                anchor_name: String,
                level: Number
            }
        }
    }*/
	async getRoomInfo() {
		let info = await request.get(
			`https://api.live.bilibili.com/xlive/web-room/v1/index/getInfoByRoom?room_id=${this.id}`
		);
		info = JSON.parse(info);
		if (info.code != 0)
			return {
				code: 1,
				error: info.message
			};
		let data = info.data;
		let room_info = data.room_info;
		let live_status = room_info.live_status;
		let title = room_info.title;
		let cover = room_info.cover;
		let start_time = room_info.live_start_time;
		let area = {
			id: room_info.area_id,
			name: room_info.area_name,
			parent: {
				id: room_info.parent_area_id,
				name: room_info.parent_area_name
			}
		};

		let anchor_info = data.anchor_info;
		let author_name = anchor_info.base_info.uname;
		let level = anchor_info.live_info.level;

		let rankdb_info = data.rankdb_info;
		let rank = rankdb_info.rank_desc;

		let area_rank = data.area_rank_info.areaRank.rank;
		let output = {
			code: 0,
			room: {
				title,
				cover,
				start_time,
				rank,
				area_rank,
				live_status
			},
			area,
			author: {
				author_name,
				level
			}
		};
		return output;
	}

	async getGiftList() {
		let list = await request.get(
			`https://api.live.bilibili.com/gift/v3/live/room_gift_list?roomid=${this.id}`
		);
		list = JSON.parse(list);
		if (list.code != 0)
			return {
				ok: false,
				error: list.message
			};
		return {
			list: list.data.list,
			sliver_list: list.data.sliver_list
		};
	}

	async getGiftConf() {
		let conf = await request.get(
			`https://api.live.bilibili.com/gift/v4/Live/giftConfig?roomid=${this.id}`
		);
		conf = JSON.parse(conf);
		if (conf.code != 0) return require("./gift.json");
		return conf;
	}
	/**
     * @returns {{ok:false,error:String}|{
        port: Number,
        host: String,
        fastest: {
            port: Number,
            host: String,
            ws_port: Number
        },
        second: {
            port: Number,
            host: String,
            ws_port: Number
        },
        token: String
    }}
     */
	async getDanmuURL() {
		let info = await request.get(
			`https://api.live.bilibili.com/room/v1/Danmu/getConf?room_id=${this.id}`
		);
		info = JSON.parse(info);
		if (info.code != 0 && info.msg != "ok")
			return {
				ok: false,
				error: info.message
			};
		return {
			port: info.data.port,
			host: info.data.host,
			token: info.data.token
		};
	}

	/**
	 * @param {"hello"|"heart"} type
	 */
	getPacket(type) {
		/*
		 * 0000 00[body length + head length(16)] 00[head length(16)] 00[protocol type] 00[operation type] 01
		 *
		 * protocol type refer: [value/body format/content]
		 * 00 JSON   message
		 * 01 Int32  body is views
		 * 02 Buffer composed buffer, after decompose need to parse again as a new packet
		 *
		 * operation type refer: [value/sender/body format/type/content]
		 * 02 client null  heart_beat              once per 30s
		 * 03 server Int32 heart_beat_response     body is views
		 * 05 server JSON  broadcasting            danmu and broadcast
		 * 07 client JSON  enter (first_handshake) first pack when connect, need id
		 * 08 server Int32 enter_response          null
		 */
		type = type.toLowerCase();
		let head, body;
		switch (type) {
			case "hello": {
				let data = JSON.stringify({
					uid: this.getRandUid(),
					roomid: this.id,
					protover: 1,
					platform: "web",
					clientver: "1.9.3",
					type: 2,
					key: this.danmu.token
				});
				//logger.info(data);
				body = Buffer.from(data);
				let length = body.length + 16;
				head = Buffer.from([
					// eslint-disable-next-line prettier/prettier
					0,
					0,
					0,
					length,
					0,
					16,
					0,
					1,
					0,
					0,
					0,
					7,
					0,
					0,
					0,
					1
				]);
				//logger.info(Buffer.concat([head, body]))
				return Buffer.concat([head, body]);
				break;
			}
			case "heart": {
				head = Buffer.from([
					// eslint-disable-next-line prettier/prettier
					0,
					0,
					0,
					31,
					0,
					16,
					0,
					1,
					0,
					0,
					0,
					2,
					0,
					0,
					0,
					1
				]);
				body = Buffer.from("[object Object]");
				return Buffer.concat([head, body]);
				break;
			}
			default: {
				return new Error("error type");
				break;
			}
		}
	}
	getRandUid = (bit = 15) =>
		Math.pow(10, bit) + Math.floor(2 * Math.pow(10, bit) * Math.random());
	onMessage(data) {
		wslogger.info(`[${this.id}]` + JSON.stringify(data));
		let parsed_array = parser.packet(data);
		if (!Array.isArray(parsed_array)) {
			wslogger.error(`[${this.id}]${JSON.stringify(parsed_array)}`);
			return;
		}
		this.danmu_list.push(parsed_array);
		for (const msg of parsed_array) {
			if (msg.type == "view") {
				db.insert(this.data_path, `room_${this.id}`, {
					count: this.live_counter,
					time: this.room_info.room.start_time,
					update_time: msg.data.time,
					views: msg.data.view
				});
			} else if (msg.type == "gift") {
				db.insert(this.data_path, `room_${this.id}_gift`, {
					count: this.live_counter,
					time: this.room_info.room.start_time,
					update_time: msg.data.timestamp,
					gift_name: `"${msg.data.name}"`,
					gift_id: msg.data.giftId,
					gift_count: msg.data.num,
					silver:
						msg.data.coin_type == "silver"
							? msg.data.total_coin
							: 0,
					gold: msg.data.coin_type == "gold" ? msg.data.total_coin : 0
				});
			} else if (msg.type == "guard_buy") {
				db.insert(this.data_path, `room_${this.id}_gift`, {
					count: this.live_counter,
					time: this.room_info.room.start_time,
					update_time: msg.data.time,
					gift_name: `"${msg.data.giftname}"`,
					gift_id: 0,
					gift_count: msg.data.num,
					silver: 0,
					gold: msg.data.total_coin
				});
			} else if (msg.type == "super_chat") {
				db.insert(this.data_path, `room_${this.id}_gift`, {
					count: this.live_counter,
					time: this.room_info.room.start_time,
					update_time: msg.data.time,
					gift_name: `"${msg.data.gift.name}"`,
					gift_id: isNaN(msg.data.gift.id)
						? 114514820
						: msg.data.gift.id,
					gift_count: msg.data.gift.num,
					silver: 0,
					gold: msg.data.price * msg.data.rate
				});
			}
		}
	}
	async connectSocket() {
		this.socket = new ws(`wss://${this.danmu_conf.host}/sub`);
		this.socket.on("open", () => {
			this.socket.send(this.getPacket("hello"));
			//this.socket.send(this.getPacket('heart'));
		});
		this.socketInterval = setInterval(() => {
			this.socket.send(this.getPacket("heart"));
		}, 5000);
		this.socket.on("ping", () => {
			this.socket.send(this.getPacket("heart"));
		});
		this.socket.on("message", data => this.onMessage(data));
		this.socket.on("error", err => wslogger.error(`[${this.id}]${err}`));
	}
	closeSocket() {
		clearInterval(this.socketInterval);
		this.socket.close();
	}
	async setTimer() {
		this.monitorInterval = setInterval(async () => {
			let l_prev_job_time = prev_job_time;
			while (Date.now() - l_prev_job_time < 1000) {}
			prev_job_time = Date.now();
			this.updateInfo();
			if (this.last_status === 0 && this.live_status === 1) {
				logger.info(`[${this.id}]开播`);
				await this.updateInfo();
				this.last_status = 1;
				this.connectSocket();
			} else if (this.last_status === 1 && this.live_status === 0) {
				logger.info(`[${this.id}]开播`);
				this.last_status = 0;
				this.closeSocket();
			}
		}, 1500);
	}
	async updateInfo() {
		this.danmu = await this.getDanmuURL();
		this.room_info = await this.getRoomInfo();
		this.last_status = this.live_status || 0;
		this.live_status = await this.isLiving();
		let last_data = await db.select(this.data_path, `room_${this.id}`);
		let db_live_count =
			last_data.result.length === 0 ? 0 : last_data.result[0].count;
		let last_live_time =
			last_data.result.length === 0
				? this.room_info.room.start_time
				: last_data.result[0].time;
		this.live_counter = this.live_status
			? this.room_info.room.start_time == last_live_time
				? db_live_count
				: db_live_count + 1
			: db_live_count;
	}
	cancel() {
		try {
			this.closeSocket();
			clearInterval(this.monitorInterval);
		} catch (error) {
			wslogger.error(`[${this.id}]${error}`);
		}
	}
}

//TODO: 增加功能
class User {
	/**
	 * @param {Number} id
	 */
	constructor(id, trace_video = false, time = "*/59 * * * *") {
		this.id = Number(id);
		this.api = {
			base: "https://api.bilibili.com/x/relation/stat?vmid=" + this.id,
			up: "https://api.bilibili.com/x/space/upstat?mid=" + this.id,
			video:
				"https://api.bilibili.com/x/space/arc/search?pn=1&ps=1&order=pubdate&mid=" +
				this.id,
			post:
				"https://api.bilibili.com/x/space/article?ps=1&pn=1&mid=" +
				this.id
		};
		this.trace_video = trace_video;
		this.schedule_time = time;
		this.data_path = "user.db";
		(async () => await this.init())();
		this.job = schedule.scheduleJob(
			String(this.id),
			this.schedule_time,
			async () => {
				while (Date.now() - prev_job_time < 100) {}
				prev_job_time = Date.now();
				let info = await this.getInfo();
				if (info.code !== 0) {
					logger.error(JSON.stringify(info));
					return;
				}
				this.write(info.result);
				if (trace_video)
					require("./video").add(info.result.latest_video_aid);
				return;
			}
		);
		return this;
	}
	async init() {
		const knex = require("./db").getCore(this.data_path);
		let tableExist = await knex.schema.hasTable(`user_${this.id}`);
		if (!tableExist) {
			await knex.schema.createTable(`user_${this.id}`, table => {
				table.bigInteger("fan").notNullable();
				table.bigInteger("video").notNullable();
				table.bigInteger("post").notNullable();
				table.bigInteger("view_video").notNullable();
				table.bigInteger("view_post").notNullable();
				table.bigInteger("like").notNullable();
				table.timestamp("update_time").notNullable();
				table.index("update_time");
			});
		}
	}

	/**
     * @return {{
			code: Number,
			msg: String,
			result: {
				latest_video_aid: Number,
				fan: Number,
				video: Number,
				post: Number,
				view_video: Number,
				view_post: Number,
				like: Number,
				update_time: Number
		}}
     */
	async getInfo() {
		try {
			let base_info = await request.get(this.api.base);
			let up_info = await request.get(this.api.up);
			let video_info = await request.get(this.api.video);
			let post_info = await request.get(this.api.post);
			base_info = JSON.parse(base_info).data;
			up_info = JSON.parse(up_info).data;
			video_info = JSON.parse(video_info).data;
			post_info = JSON.parse(post_info).data;
			if (debug)
				logger.info(JSON.stringify({ base_info, up_info, video_info }));
			return {
				code: 0,
				msg: "",
				result: {
					latest_video_aid: video_info.list.vlist.aid,
					fan: base_info.follower,
					video: Object.keys(video_info.page).includes("count")
						? video_info.page.count
						: 0,
					post: Object.keys(post_info.page).includes("count")
						? post_info.page.count
						: 0,
					view_video: up_info.archive.view,
					view_post: up_info.article.view,
					like: up_info.likes,
					update_time: Date.now()
				}
			};
		} catch (error) {
			logger.info(error);
			return {
				code: -1,
				msg: error
			};
		}
	}

	/**
	 * @param {JSON} data
	 * @returns {Null}
	 */
	async write(data) {
		let write_data;
		Object.assign(write_data, data);
		delete write_data.latest_video_aid;
		db.insert(this.data_path, "user_" + this.id, write_data);
		return;
	}

	cancel() {
		if (this.job instanceof schedule.Job) this.job.cancel();
	}
}

module.exports = {
	Video,
	Rank,
	Room,
	User
};
