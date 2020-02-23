const {
    Video
} = require('../Data');
const fs = require("fs");
const path = require("path");
const data_path = require("../../config").data_path;
const PATH = path.join(data_path, "video.json");

let task_list = {};

/**
 * @param {Number} id
 * @param {String} time cron job format 
 * @returns {{code:Number,msg:String}}
 */
function add(id, time = "*/5 * * * *") {
    if (isNaN(id)) {
        return {
            code: -1,
            msg: `id: ${id} not a number`
        };
    } else if (typeof (time) !== "string" || /^((\*((\/[0-9]{1,2})?))[\s]){4,5}\2/ig.test() !== true) {
        return {
            code: -1,
            msg: `time: ${time} is not suit format`
        };
    }
    let video_list = require(PATH);
    for (const video of video_list.list) {
        if (id === video.aid)
            return {
                code: -1,
                msg: `id: ${id} has been add${video.enable ? "" : " but not enable"}`
            };
    }
    task_list[id] = new Video(id, time);
    video_list.list.push({
        aid: id,
        enable: 1,
        time
    });
    fs.writeFile(PATH, JSON.stringify(video_list), err => {});
    return {
        code: 0,
        msg: ""
    };
}

/**
 * @param {Number} id
 * @returns {{code:Number,msg:String}}
 */
function remove(id) {
    let Jobs = require("node-schedule").scheduledJobs;
    if (isNaN(id)) return {
        code: -1,
        msg: `id: ${id} not a number`
    };
    Jobs[`video_${String(id)}`].cancel();
    let video_list = require(PATH);
    for (const index in video_list.list) {
        let video = video_list[index];
        if (id === video.aid) {
            video_list.splice(index, 1);
            task_list[id].cancel();
            delete task_list[id];
            fs.writeFile(PATH, JSON.stringify(video_list), err => {});
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
 */
async function read(id, init = false) {
    let db = require("../db");
    try {
        let result;
        if (init) {
            result = (await db.selectAll(path.join(data_path, "video.db"), id)).result;
        } else {
            result = (await db.select(path.join(data_path, "video.db"), id)).result;
        }
        return {
            code: 0,
            msg: "",
            result
        }
    } catch (error) {
        return {
            code: -1,
            msg: error
        }
    }
}

module.exports = {
    add,
    remove,
    update,
    read
}