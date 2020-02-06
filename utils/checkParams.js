//TODO 整理输出
//TODO 调整DB调用
const Jobs = require("node-schedule").scheduledJobs;
const DB = require('./db');
/**
 * @param {Number} id 
 * @param {String} type 
 * @param {String} mode 
 * @return {String|true}
 */
async function checkID(id, type = "video", mode = "add") {
    try {
        checkType(type);
    } catch (error) {
        return new Error(error);
    }
    mode = mode.toLowerCase();
    if (!id || isNaN(id)) {
        //if id not defind or id is not number
        return `Error params with id=${id}`;
    } else if ((mode == "add" || mode == "show") && id in Jobs) {
        //if mode is add or show
        //then check job is in schedule or not
        //if in then return error
        if (!(await DB.SELECT(`video_${id}`))) {
            //check is job in database
            return `Job<${id}> is in schedule but not in database, please restart`;
        }
        return `Job<${id}> has been create`;
    } else if ((mode == "update" || mode == "remove") && !(id in Jobs)) {
        //if mode is update or remove
        //then check job is in schedule or not
        //if not then return error
        if (await DB.SELECT(type, id)) {
            //check job is not in database
            return `Job<${id}> is not in schedule but in database, please restart`;
        }
        return `Job<${id}> haven't been create`;
    }
    return true;
}

/**
 *  
 * @param {String} time 
 * @returns {String|true}
 */
function checkTime(time) {
    if (typeof (time) != "string" || !(/\*\/*[0-9]* \* \*\/*[0-9]* \* \*/ig).test(time)) {
        return `Error params with time=${time}`;
    }
    return true;
}

/**
 * 
 * @param {String} type 
 * @returns {String|true}
 */
function checkType(type) {
    type = type.toLowerCase();
    if (typeof (type) != "string" || !(/video|rank|live/.test(type))) {
        return `Error params with type=${type}`;
    }
    return true;
}

module.exports = {
    id: checkID,
    time: checkTime,
    type: checkType
}