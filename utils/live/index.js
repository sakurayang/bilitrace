const db = require("../db");
const control = require("../controller");
let globals = require("node-global-storage");
const { Room } = require("../Data");

/**
 * @param {Number|String} id
 * @param {Boolean} init
 * @returns {{
	code: 0|1,
	msg: "ok"|"init"|Error,
	result: {
		view:{
			count: Number,
			update_time: Number,
			time: Number,
			views: Number
		}[],
		gift:{
			id:Number,
			count: Number,
			update_time: Number,
			time: Number,
			gift_name: String,
			gift_id: Number,
			gift_count: Number,
			silver: Number,
			gold: Number
		}[]
	}
}}
*/
async function read(id, init = false) {
	let data_path = "live.db";
	let live_time_count = (await db.select(data_path, "room_"+id)).result[0].count;

	let query = {
		count: live_time_count,
	};
	let count = db.getCount(data_path, "room_" + id, query);
	//let gift_count = db.getCount(data_path, "room_" + id + "_gift", query);
	let view_data = init
		? await db.select(data_path, "room_" + id, query, count,0)
		: await db.select(data_path, "room_" + id, query, 1);
	let gift_data = init
		? await db.select(data_path, "room_" + id + "_gift", query, count,0)
		: await db.select(data_path, "room_" + id + "_gift", query, 1);
	if (view_data.code !== 0 || gift_data.code !== 0)
		return {
			code: -1,
			msg: view_data.msg + "&&&&&&&" + gift_data.msg,
		};
	return {
		code: 0,
		msg: init ? "init" : "ok",
		result: {
			view: view_data.result,
			gift: gift_data.result,
		},
	};
}

/**
 * @param {Number} id
 * @returns {{code:Number,msg:String}}
 */
async function add(id) {
	if (isNaN(id)) {
		return {
			code: -1,
			msg: `id: ${id} not a number`,
		};
	}
	// get video list
	let data = await control.File2Json("live.json");
	// loop find id in list
	if (globals.isSet("live_" + id)) {
		return {
			code: -1,
			msg: `id: ${id} has been add`,
		};
	}
	for (const live of data) {
		if(live.id ===id) return {code:-1,msg:`${id} not enable`}
	}
	// push id in list
	let id_array = data.map(el => el.id);
	if (id_array.indexOf(id) === -1) {
		data.push({
			id: Number(id),
			enable: 1,
		});
	}
	// then write to file
	control.Json2File("live.json", data);
	// put in global variables
	let room = new Room(id);
	globals.set("live_" + id, room);
	return {
		code: 0,
		msg: "",
	};
}

/**
 * @param {Number} id
 * @return {Void}
 */
async function cancel(id) {
	if (isNaN(id))
		return {
			code: -1,
			msg: `id: ${id} not a number`,
		};
	// get video list
	let data = await control.File2Json("live.json");
	// loop find id in list
	for (const key in data) {
		const live = data[key];
		if (live.id === id && globals.isSet("live_" + live.id)) {
			// delete it
			globals.get("live_" + id).cancel();
			globals.unset("live_" + id);
			data.splice(key, 1);
			// then write to file
			control.Json2File("live.json", data);
			return;
		}
	}
	return {
		code: -1,
		msg: `id: ${id} not found`,
	};
}

module.exports = {
	read,
	add,
	cancel,
};
