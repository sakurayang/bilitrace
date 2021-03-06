const { Video } = require("../Data");
const globals = require("node-global-storage");
const control = require("../controller");

/**
 * @param {Number} id
 * @param {String} time cron job format
 * @returns {{code:Number,msg:String}}
 */
async function add(id, time = "*/5 * * * *") {
	if (isNaN(id)) {
		return {
			code: -1,
			msg: `id: ${id} not a number`
		};
	} else if (
		typeof time !== "string" ||
		/^((\*((\/[0-9]{1,2})?))[\s]){4,5}\2/gi.test(time) !== true
	) {
		return {
			code: -1,
			msg: `time: ${time} is not suit format`
		};
	}

	let data = await control.File2Json("video.json");
	let id_array = data.map(el => el.id);
	if (id_array.indexOf(id) === -1) {
		data.push({
			id: Number(id),
			enable: 1
		});
	}
	if (globals.isSet("video_" + id)) {
		for (const video of data) {
			if (video.id === id) return { code: -1, msg: `${id} not enable` };
		}
		return {
			code: -1,
			msg: `id: ${id} has been add`
		};
	}
	// push id in list

	control.Json2File("video.json", data);
	let video = new Video(id, time);
	globals.set("video_" + id, video);
	return {
		code: 0,
		msg: ""
	};
}

/**
 * @param {Number} id
 * @returns {{code:Number,msg:String}}
 */
async function remove(id) {
	if (isNaN(id))
		return {
			code: -1,
			msg: `id: ${id} not a number`
		};
	let data = await control.File2Json("video.json");
	for (const key in data) {
		const video = data[key];
		if (id === video.id) {
			if (globals.isSet("video_" + video.id)) {
				globals.get("video_" + id).cancel();
				globals.unset("video_" + id);
			}
			data.splice(key, 1);
			delete data[key];
			control.Json2File("video.json", data);
			return {
				code: 0,
				msg: ""
			};
		}
	}
	return {
		code: -1,
		msg: `id: ${id} not found`
	};
}

/**
 *
 * @param {Number} id
 * @param {String} time
 */
async function update(id, time = "*/5 * * * *") {
	try {
		await remove(id);
		await add(id, time);
		return {
			code: 0,
			msg: ""
		};
	} catch (error) {
		return {
			code: -1,
			msg: error
		};
	}
}

/**
 *
 * @param {Number} id
 * @param {Boolean} init
 * @returns {{
 * "code":Number,
 * "msg":String,
 * "result":{
 *   "id":Number,
 *   "aid":Number,
 *   "title":String,
 *   "view":Number,
 *   "coin":Number,
 *   "danma":Number,
 *   "favorite":Number,
 *   "reply":Number,
 *   "share":Number,
 *   "heart_like":Number,
 *   "public_time":Number,
 *   "update_time":Number
 * }[]}}
 */
async function read(id, init = false) {
	let db = require("../db");
	try {
		let result;
		if (init) {
			count = (await db.getCount("video.db", "video_" + id)).result;
			result = (await db.select("video.db", "video_" + id, [], count, 0))
				.result;
		} else {
			result = (await db.select("video.db", "video_" + id)).result;
		}
		//console.log(result);
		return {
			code: 0,
			msg: "",
			result
		};
	} catch (error) {
		return {
			code: -1,
			msg: error
		};
	}
}

module.exports = {
	add,
	remove,
	update,
	read
};
