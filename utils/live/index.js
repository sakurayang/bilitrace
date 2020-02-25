const db = require("../db");
const control = require("../controller");
let globals = require("node-global-storage");
const {
    Room
} = require("../Data");



/**
 * @param {Number|String} id
 * @param {Boolean} init
 * @returns {{
    code: 0|1,
    msg: "ok"|"init"|Error,
    result: {
        view:[{
            count: Number,
            update_time: Number,
            time: Number,
            views: Number
        }],
        gift:[{
            id:Number,
            count: Number,
            update_time: Number,
            time: Number,
            gift_name: String,
            gift_id: Number,
            gift_count: Number,
            silver: Number,
            gold: Number
        }]
    }
}}
*/
async function read(id, init = false) {
    let data_path = "live.db";
    let live_time_count = (await db.select(data_path, id)).result.count;

    let query = {
        count: live_time_count
    };
    let view_data = init ?
        await db.selectAll(data_path, id, query) :
        await db.select(data_path, id, query);
    let gift_data = init ?
        await db.selectAll(data_path, id + "_gift", query) :
        await db.select(data_path, id + "_gift", query);
    if (view_data.code !== 0 || gift_data.code !== 0) return {
        code: -1,
        msg: view_data.msg + "&&&&&&&" + gift_data.msg
    };
    return {
        code: 0,
        msg: init ? "init" : "ok",
        result: {
            view: view_data.result,
            gift: gift_data.result
        }
    }
}

/**
 * @param {Number} id
 * @returns {{code:Number,msg:String}}
 */
async function add(id) {
    if (isNaN(id)) {
        return {
            code: -1,
            msg: `id: ${id} not a number`
        };
    }
    // get video list
    let data = await control.File2Json("live.json");
    // loop find id in list
    for (const live of data.list) {
        if (live.id === id && globals.isSet("live_" + live.id)) {
            return {
                code: -1,
                msg: `id: ${id} has been add${live.enable ? "" : " but not enable"}`
            };
        };
    }
    // push id in list
    data.list.push({
        id: Number(id),
        enable: 1
    });
    // then write to file
    control.Json2File("live.json", data);
    // put in global variables
    let room = new Room(id);
    globals.set("live_" + id, room);
    return {
        code: 0,
        msg: ""
    }
}

/**
 * @param {Number} id
 * @return {Void}
 */
async function cancel(id) {
    if (isNaN(id)) return {
        code: -1,
        msg: `id: ${id} not a number`
    };
    // get video list
    let data = await control.File2Json("live.json");
    // loop find id in list
    for (const key in data.list) {
        const live = data.list[key];
        if (live.id === id && globals.isSet("live_" + live.id)) {
            // delete it
            globals.get("live_" + id).cancel();
            globals.unset("live_" + id);
            data.list.splice(key, 1);
            // then write to file
            control.Json2File("live.json", data);
            return;
        };
    }
    return {
        code: -1,
        msg: `id: ${id} not found`
    };
}

module.exports = {
    read,
    add,
    cancel
}