//TODO 整理输出
const request = require('request-promise-native');
const schedule = require('node-schedule');
const fs = require("fs");
const path = require("path");
const ws = require('ws');
const parser = require("./live/parser");
const db = require("./db");

var prev_job_time = Date.now();

class CreateScheduleJob {
    /**
     * 
     * @param {String} type 
     * @param {Number} id 
     * @param {String} time 
     * @param {Number} day 
     * @returns {this}
     */
    constructor(type, id, time = "*/5 * * * *", day = 3) {
        this.job_type = String(type) || "rank";
        this.job_id = String(id);
        this.job_time = String(time) || "*/5 * * * *";
        this.job_day = day || 3;
        return this;
    }
    cancel() {
        this.job.cancel();
    }
}
class RankScheduleJob extends CreateScheduleJob {
    /**
     * 
     * @param {Number} id 
     * @param {String} time 
     * @param {Number} day 
     */
    constructor(id, time = "* * */3 * *", day = 3) {
        super("rank", id, time, day);
        this.job_type = "rank";
        this.job_id = id;
        this.spider = new RankSpider(this.job_id);
        this.data = new RankData(this.job_id);
        this.job = schedule.scheduleJob(String(id), this.job_time, async () => {
            let l_prev_job_time = prev_job_time;
            while (Date.now() - l_prev_job_time < 1000) {
                ;
            }
            prev_job_time = Date.now();
            let info = await this.spider.getInfo();
            //console.log(info);
            for (const item of info.result) {
                this.data.write(item);
            };
        });
        return this;
    }
}
class VideoScheduleJob extends CreateScheduleJob {
    /**
     * 
     * @param {Number} id 
     * @param {String} time 
     */
    constructor(id, time) {
        super("video", id, time);
        this.job_id = id;
        this.job_type = "video";
        this.spider = new VideoSpider(this.job_id);
        this.data = new VideoData(this.job_id);
        this.job = schedule.scheduleJob(String(id), this.job_time, async () => {
            while (Date.now() - prev_job_time < 100) {
                ;
            }
            prev_job_time = Date.now();
            let info = await this.spider.getInfo();
            //console.log(info);
            this.data.write(info.result);
        });
        return this;
    }
}


class Data {
    get name() {
        return this.data_path;
    }

    /**
     * @param {String} datatype 
     * @param {Number|String} id
     * @return {Object}
     */
    constructor(datatype, id) {
        this.data_type = datatype;
        this.data_id = Number(id);
        this.data_path = require("../config").data_path;
        return this;
    }

    /**
     * @param {JSON} write_data
     * @returns {Null}
     */
    write(write_data) {
        db.insert(this.data_type, this.data_id, write_data);
    }


    /** 
     * @returns {{code:Number,msg:String,result:Array<JSON>}}
     */
    async read(init = false) {
        try {
            let data;
            if (init) {
                data = await db.selectAll(this.data_type, this.data_id);
            } else {
                data = await db.select(this.data_type, this.data_id);
            }
            return {
                code: 0,
                msg: "",
                result: data
            }
        } catch (error) {
            return {
                code: -1,
                msg: error
            }
        }
    }

}

class RankData extends Data {
    /**
     * 
     * @param {Number} id 
     */
    constructor(id) {
        super("rank", id);
        this.data_id = Number(id);
        this.data_type = "rank";
        this.init();
        return this;
    }

    async init() {
        await require('better-sqlite3')(path.join(data_path, "live.db"))
            .prepare(`CREATE TABLE IF NOT EXISTS "${this.id}_gift" ` +
                "(id          integer  primary key  AUTOINCREMENT not null," +
                " aid         interger not null," +
                " rank        interger not null" +
                " point       interger not null" +
                " title       text not null" +
                " tid         integer  not null," +
                " tname       text     not null" +
                " author_mid  integer  not null" +
                " author_name integer  not null" +
                " update_time integer  not null," +
                " time        integer  not null)"
            ).run();
    }
}

class VideoData extends Data {
    constructor(id) {
        super("video", id);
        this.data_id = Number(id);
        this.data_type = "video";
        this.init();
        return this;
    }
    async init() {
        await require('better-sqlite3')(path.join(data_path, "live.db"))
            .prepare(`CREATE TABLE IF NOT EXISTS "${this.id}_gift" ` +
                "(id          integer  primary key  AUTOINCREMENT not null," +
                " aid         interger not null," +
                " rank        interger not null" +
                " point       interger not null" +
                " title       text not null" +
                " tid         integer  not null," +
                " tname       text     not null" +
                " author_mid  integer  not null" +
                " author_name integer  not null" +
                " update_time integer  not null," +
                " time        integer  not null)"
            ).run();
    }
}

class Spider {
    constructor(type, id, day = 3) {
        this.spider_type = type.toLowerCase();
        this.spider_id = id;
        this.spider_day = day;
        return this;
    }
}

class VideoSpider extends Spider {
    constructor(id) {
        super("video", id);
        this.spider_url = `https://api.bilibili.com/x/web-interface/view?aid=${this.spider_id}`;
        return this;
    }
    /**
     * @returns {{
        code:Number,
        msg:String,
        result:?{
            aid: Number,
            title: String,
            view: Number,
            coin: Numbern,
            danma: Number,
            favorite: Number,
            reply: Number,
            share: Number,
            heart_like: Number,
            pubdate: Number,
            update_date: Number
        }
    }}
     */
    async getInfo() {
        let raw_data;
        try {
            raw_data = JSON.parse(await request.get(this.spider_url));
            typeof (raw_data) != "object" ? console.log(raw_data) : raw_data = raw_data.data;
        } catch (error) {
            return {
                code: -1,
                msg: error
            }
        }
        let stat = raw_data.stat;
        return {
            code: 0,
            msg: "",
            result: {
                aid: raw_data.aid,
                title: raw_data.title,
                view: stat.view,
                coin: stat.coin,
                danma: stat.danmaku,
                favorite: stat.favorite,
                reply: stat.reply,
                share: stat.share,
                heart_like: stat.like,
                pubdate: raw_data.pubdate,
                update_date: Date.now()
            }
        }
    }
}

class RankSpider extends Spider {
    constructor(id, ...time) {
        time = time.length == 0 ? [Date.now()] : time;
        let from = time ?
            new Date(time[0]).toISOString().substr(0, 10) :
            new Date(Date.now()).toISOString().substr(0, 10);
        let to = time && time.length > 1 ?
            new Date(time[1]).toISOString().substr(0, 10) :
            from.substr(0, 8) + String(Number(new Date(from).getDate()) + 3).padStart(2, 0);
        let day = Number(to.substr(8, 2)) - Number(from.substr(8, 2));
        super("rank", id, day);
        this.spider_url = `https://api.bilibili.com/x/web-interface/ranking/region?rid=${this.spider_id}&day=${this.spider_day}`
        this.spider_time = {
            from: from,
            to: to,
            day: day
        };
        return this;
    }
    /**
     * @returns {{
        code:Number,
        msg:String,
        result:?Array<{
            aid: Number,
            title: String,
            view: Number,
            coin: Numbern,
            danma: Number,
            favorite: Number,
            reply: Number,
            share: Number,
            heart_like: Number,
            pubdate: Number,
            update_date: Number
        }>
    }}
     */
    async getInfo() {
        let raw_data = await request.get(this.spider_url);
        raw_data = JSON.parse(raw_data).data;
        let db_data = [];
        //console.log(data);
        for (let rank = 0, len = raw_data.length; rank < len; rank++) {
            let video = raw_data[rank];
            db_data.push({
                aid: video.aid,
                title: video.title,
                tid: this.spider_id,
                tname: video.typename,
                author_name: video.author,
                author_mid: video.mid,
                rank: rank + 1,
                point: video.pts,
                time: video.create,
                update_date: Date.now()
            });
        }
        return {
            code: 0,
            msg: "",
            result: db_data
        };
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
        this.init();
        this.database = path = path.join(data_path, "live.db");
        return this;
    }
    async init() {
        await require('better-sqlite3')(path.join(data_path, "live.db"))
            .prepare(`CREATE TABLE IF NOT EXISTS "${this.id}" ` +
                "(count        integer  not null," +
                " update_time  integer  not null," +
                " time         integer  not null," +
                " views        integer  not null)"
            ).run();
        await require('better-sqlite3')(path.join(data_path, "live.db"))
            .prepare(`CREATE TABLE IF NOT EXISTS "${this.id}_gift" ` +
                "(id           integer  primary key  AUTOINCREMENT not null," +
                " count        integer  not null," +
                " update_time  integer  not null," +
                " time         integer  not null," +
                " gift_name    text     not null," +
                " gift_id      integer  not null," +
                " gift_count   integer  not null," +
                " silver       integer," +
                " gold         integer)"
            ).run();
        await this.updateInfo();
        this.gift_conf = await this.getgiftConf();
        this.last_status = 0;
        this.danmu_conf = await this.getDanmuURL();
        await this.setTimer();
    }
    async isLiving() {
        let info = await request.get(`https://api.live.bilibili.com/room/v1/Room/room_init?id=${this.id}`);
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
            auchor: {
                anchor_name: String,
                level: Number
            }
        }
    }*/
    async getRoomInfo() {
        let info = await request.get(`https://api.live.bilibili.com/xlive/web-room/v1/index/getInfoByRoom?room_id=${this.id}`);
        info = JSON.parse(info);
        if (info.code != 0) return { code: 1, error: info.message };
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
        let anchor_name = anchor_info.base_info.uname;
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
            anchor: {
                anchor_name,
                level
            }
        };
        return output;
    }

    async getGiftList() {
        let list = await request.get(`https://api.live.bilibili.com/gift/v3/live/room_gift_list?roomid=${this.id}`);
        list = JSON.parse(list);
        if (list.code != 0) return { ok: false, error: list.message };
        return { list: list.data.list, sliver_list: list.data.sliver_list };
    }

    async getgiftConf() {
        let conf = await request.get(`https://api.live.bilibili.com/gift/v4/Live/giftConfig?roomid=${this.id}`);
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
        let info = await request.get(`https://api.live.bilibili.com/room/v1/Danmu/getConf?room_id=${this.id}`);
        info = JSON.parse(info);
        if (info.code != 0 && info.msg != "ok") return { ok: false, error: info.message };
        return {
            port: info.data.port,
            host: info.data.host,
            token: info.data.token
        }
    }

    /**
     * @param {"hello"|"heart"} type
     */
    getPacket(type) {
        /* 
         * 0000 00[body length + head length(16)] 00[head lenght(16)] 00[protocol type] 00[operation type] 01
         * 
         * protocol type refer: [value/body format/content]
         * 00 JSON   message
         * 01 Int32  body is views
         * 02 Buffer compossed buffer, after decompossed need to parse again as a new packet
         * 
         * operation type refer: [value/sender/body format/type/content]
         * 02 client null  heart_beat              once per 30s
         * 03 server Int32 heart_beat_response     body is views
         * 05 server JSON  boardcasting            danmu and boardcast
         * 07 client JSON  enter (first_handshark) first pack when connect, need id
         * 08 server Int32 enter_response          null
         */
        type = type.toLowerCase();
        let head, body;
        switch (type) {
            case 'hello':
                let data = JSON.stringify({
                    "uid": this.getRandUid(),
                    "roomid": this.id,
                    "protover": 1,
                    "platform": "web",
                    "clientver": "1.9.3",
                    "type": 2,
                    "key": this.danmu.token
                });
                console.log(data);
                body = Buffer.from(data);
                let length = body.length + 16
                head = Buffer.from([0, 0, 0, length, 0, 16, 0, 1, 0, 0, 0, 7, 0, 0, 0, 1]);
                //console.log(Buffer.concat([head, body]))
                return Buffer.concat([head, body]);
                break;
            case 'heart':
                head = Buffer.from([0, 0, 0, 31, 0, 16, 0, 1, 0, 0, 0, 2, 0, 0, 0, 1]);
                body = Buffer.from("[object Object]");
                return Buffer.concat([head, body]);
                break;
            default:
                return new Error("error type");
                break;
        }
    }
    getRandUid() {
        return 1E15 + Math.floor(2E15 * Math.random())
    }
    onMessage(data) {
        fs.writeFile('./ws.log', JSON.stringify(Buffer.from(data)) + '\n', { flag: 'a+' }, err => { });
        let parsed = parser.packet(data);
        fs.writeFile('./pasred.log', JSON.stringify(parsed) + '\n', { flag: 'a+' }, err => { });

        if (parsed.code !== 0) console.log(parsed);

        if (parsed.type == "view") {
            db.insert(
                this.database,
                this.id,
                {
                    count: this.live_counter,
                    time: this.room_info.room.start_time,
                    update_time: parsed.data.time,
                    views: parsed.data.view
                });
        } else if (parsed.type == "gift") {
            db.insert(
                this.database,
                this.id + "_gift",
                {
                    count: this.live_counter,
                    time: this.room_info.room.start_time,
                    update_time: parsed.data.timestamp,
                    gift_name: `"${parsed.data.name}"`,
                    gift_id: parsed.data.giftId,
                    gift_count: parsed.data.num,
                    silver: parsed.data.coin_type == "silver" ? parsed.data.total_coin : 0,
                    gold: parsed.data.coin_type == "gold" ? parsed.data.total_coin : 0
                });
        } else if (parsed.type == "guard_buy") {
            db.insert(
                this.database,
                this.id + "_gift",
                {
                    count: this.live_counter,
                    time: this.room_info.room.start_time,
                    update_time: parsed.data.time,
                    gift_name: `"${parsed.data.giftname}"`,
                    gift_id: 0,
                    gift_count: parsed.data.num,
                    silver: 0,
                    gold: parsed.data.total_coin
                });
        } else if (parsed.type == "super_chat") {
            db.insert(
                this.database,
                this.id + "_gift",
                {
                    count: this.live_counter,
                    time: this.room_info.room.start_time,
                    update_time: parsed.data.time,
                    gift_name: `"${parsed.data.gift.name}"`,
                    gift_id: isNaN(parsed.data.gift.id) ? 114514820 : parsed.data.gift.id,
                    gift_count: parsed.data.gift.num,
                    silver: 0,
                    gold: parsed.data.price * parsed.data.rate
                });
        }
    }
    async connectSocket() {
        this.socket = new ws(`wss://${this.danmu_conf.host}/sub`);
        this.socket.on('open', () => {
            this.socket.send(this.getPacket('hello'));
            this.socket.send(this.getPacket('heart'));
        });
        this.socketInterval = setInterval(() => { this.socket.send(this.getPacket('heart')) }, 5000);
        this.socket.on('ping', () => {
            this.socket.send(this.getPacket('heart'));
        });
        this.socket.on('pong', data => {
            fs.writeFile('./log', JSON.stringify(Buffer.from(data)) + '\n', { flag: 'a+' }, err => { });
        });
        this.socket.on('message', data => this.onMessage(data));
    }
    async closeSocket() {
        clearInterval(this.socketInterval);
        this.socket.close();
    }
    async setTimer() {
        this.monitorInterval = setInterval(async () => {
            let l_prev_job_time = prev_job_time;
            while (Date.now() - l_prev_job_time < 1000) {
                ;
            }
            prev_job_time = Date.now();
            this.updateInfo();
            if (this.last_status === 0 && this.live_status === 1) {
                console.log('开播');
                await this.updateInfo();
                this.last_status = 1;
                this.connectSocket();
            } else if (this.last_status === 1 && this.live_status === 0) {
                console.log("下播");
                this.last_status = 0;
                this.closeSocket();
            };
        }, 1500);
    }
    async updateInfo() {
        this.danmu = await this.getDanmuURL();
        this.room_info = await this.getRoomInfo();
        this.last_status = this.live_status || 0;
        this.live_status = await this.isLiving();
        let database_count = await db.getCount(this.database, this.id) || 1;
        let last_data = await db.selectAll(this.database, this.id, ['count >= 0'], 1, database_count - 1);
        let db_live_count = last_data.result.length === 0 ? 0 : last_data.result[0].count;
        let last_live_time = last_data.result.length === 0 ? this.room_info.room.start_time : last_data.result[0].time;
        this.live_counter = this.live_status
            ? this.room_info.room.start_time == last_live_time
                ? db_live_count
                : db_live_count + 1
            : db_live_count;
    }
}

module.exports = {
    RankScheduleJob,
    VideoScheduleJob,
    RankData,
    VideoData,
    VideoSpider,
    RankSpider,
    Room
}