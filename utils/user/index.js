const globals = require("node-global-storage");
const control = require("../controller");
const { User } = require("../Data");

//TODO:添加read
/**
 * @param {Number} id
 * @param {String} time cron job format
 * @returns {{code:Number,msg:String}}
 */
async function add(id, time = "*/5 * * * *") {
	if (isNaN(id)) {
		return {
			code: -1,
			msg: `id: ${id} ot a number`
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

	let data = await control.File2Json("user.json");
	for (const user of data) {
		if (globals.isSet("user_" + user.id)) {
			return {
				code: -1,
				msg: `id: ${id} has been add${
					user.enable ? "" : " but not enable"
				}`
			};
		}
	}
	// push id in list
	let id_array = data.map(el => el.id);
	if (id_array.indexOf(id) === -1) {
		data.push({
			id: Number(id),
			enable: 1
		});
	}
	control.Json2File("user.json", data);
	let user = new User(id, time);
	globals.set("user_" + id, user);
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
	let data = await control.File2Json("user.json");
	for (const key in data) {
		const video = data[key];
		if (id === video.id) {
			if (globals.isSet("user_" + video.id)) {
				globals.get("user_" + id).cancel();
				globals.unset("user_" + id);
			}
			data.splice(key, 1);
			delete data[key];
			control.Json2File("user.json", data);
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
 * @param {Boolean} init
 * @returns {{
 * "code":Number,
 * "msg":String,
 * "result":{
	fan: Number,
	video: Number,
	post: Number,
	view_video: Number,
	view_post: Number,
	like: Number,
	update_time: Number
 * }[]}}
 */
async function read(id, init = false) {
	let db = require("../db");
	try {
		let result;
		if (init) {
			count = (await db.getCount("user.db", "user_" + id)).result;
			result = (await db.select("user.db", "user_" + id, [], count, 0))
				.result;
		} else {
			result = (await db.select("user.db", "user_" + id)).result;
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
