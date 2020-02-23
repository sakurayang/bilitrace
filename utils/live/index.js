const db = require("../db");
const path = require("path");
const fs = require("fs");
const config = require("../../config");
const g_data_path = config.data_path;

const {
    Room
} = require("../Data");

let live_list = {};

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
async function getRoomData(id, init = false) {
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
 */
async function add(id) {
    let data = await fs.readFileSync(path.join(g_data_path, 'list.json'), {
        encoding: 'utf-8'
    });
    data = JSON.parse(data);
    for (const item of data.list) {
        if (item.id == id) {
            return {
                code: -1,
                msg: "has been added"
            };
        } else continue;
    }
    data.list.push({
        id: Number(id),
        enable: 1
    });
    live_list[id] = new Room(id);
    fs.writeFile(path.join(g_data_path, 'list.json'), JSON.stringify(data), {
        encoding: 'utf-8'
    }, err => console.log(err));
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
    let data = await fs.readFileSync(path.join(g_data_path, 'list.json'), {
        encoding: 'utf-8'
    });
    data = JSON.parse(data);
    for (const item of data.list) {
        if (item.id == id) {
            delete item;
            return;
        } else continue;
    }
    for (const key in live_list) {
        if (live_list.hasOwnProperty(key) && String(key) == String(id)) {
            live_list[key].cancel();
        }
    }
    fs.writeFile(path.join(g_data_path, 'list.json'), JSON.stringify(data), {
        encoding: 'utf-8'
    }, err => console.log(err));
}

module.exports = {
    getRoomData,
    add,
    cancel
}