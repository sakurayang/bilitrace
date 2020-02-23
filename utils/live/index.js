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
    // get video list
    let data = await control.File2Json("list.json");
    // loop find id in list
    for (const item of data.list) {
        if (item.id == id || globals.isSet("live_" + item.id)) {
            return {
                code: -1,
                msg: "has been added"
            };
        } else continue;
    }
    // push id in list
    data.list.push({
        id: Number(id),
        enable: 1
    });
    // then write to file
    control.Json2File("list.json", data);
    // put in global variables
    globals.set("live_" + id, new Room(id), {
        silent: true
    });

    return {
        code: 0,
        msg: "sucssed"
    }
}

/**
 * @param {Number} id
 * @return {Void}
 */
async function cancel(id) {
    // get video list
    let data = await control.File2Json("list.json");
    // loop find id in list
    for (const key in data.list) {
        const item = data.list[key];
        if (item.id == id && globals.isSet("live_" + item.id)) {
            // delete it
            await globals.get("live_" + id).cancel();
            globals.unset("live_" + id);
            delete key;
            // then write to file
            control.Json2File("list.json", data);
            return;
        } else continue;
    }
}

module.exports = {
    read,
    add,
    cancel
}