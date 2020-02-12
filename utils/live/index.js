// TODO: 整合进全局bus，防止请求过快被gank
//TODO 调整DB调用
const db = require("../utils/db");
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
    let offset;
    try {
        offset = await db.getCount(id) - 1;
    } catch (error) {
        return {
            code: 1,
            msg: String(error)
        };
    }
    let live_time_count = (await db.SELECTALL(id, [`count >= 0`], 1, offset - 1)).result[0].count;
    //console.log(count, counter);
    let view_data = await db.SELECTALL(id, { count: live_time_count });
    //console.log(view_data);
    let gift_data = await db.SELECTALL(id + "_gift", { count: live_time_count });
    return {
        code: 0,
        msg: init ? "init" : "ok",
        result: {
            view: init ? view_data.result : [view_data.result[view_data.count - 1]],
            gift: init ? gift_data.result : [gift_data.result[gift_data.count - 1]]
        }
    }
}

module.exports = {
    getRoomData
}