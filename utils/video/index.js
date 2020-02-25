const {
    Video
} = require('../Data');
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
        typeof (time) !== "string" ||
        /^((\*((\/[0-9]{1,2})?))[\s]){4,5}\2/ig.test(time) !== true
    ) {
        return {
            code: -1,
            msg: `time: ${time} is not suit format`
        };
    }

    let data = await control.File2Json("video.json");
    for (const video of data.list) {
        if (id === video.aid && globals.isSet("video_" + video.aid))
            return {
                code: -1,
                msg: `id: ${id} has been add${video.enable ? "" : " but not enable"}`
            };
    }
    data.list.push({
        aid: id,
        enable: 1,
        time
    });
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
    if (isNaN(id)) return {
        code: -1,
        msg: `id: ${id} not a number`
    };
    let data = await control.File2Json("video.json");
    for (const key in data.list) {
        const video = data.list[key];
        if (id === video.aid && globals.isSet("video_" + video.aid)) {
            globals.get("video_" + id).cancel();
            globals.unset("video_" + id);
            data.list.splice(key, 1);
            delete data.list[key];
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
 */
async function read(id, init = false) {
    let db = require("../db");
    try {
        let result;
        if (init) {
            result = (await db.selectAll("video.db", id)).result;
        } else {
            result = (await db.select("video.db", id)).result;
        }
        //console.log(result);
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