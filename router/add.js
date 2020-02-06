//TODO 调整DB调用
const {
    VideoScheduleJob,
    RankScheduleJob
} = require('../plugins/Data');
const DB = require("../plugins/db");
const check = require("../plugins/checkParams");

async function add(ctx, id, type = "video", time = "*/5 * * * *") {
    type = type.toLowerCase();
    for (const checkitem of [await check.id(DB, id, type, "add"), check.time(time), check.type(type)]) {
        if (typeof (checkitem) != "boolean") {
            //ctx.body = checkitem;
            return checkitem;
            break;
        }
    }
    switch (type) {
        default:
        case "video":
            await new VideoScheduleJob(id, time);
            (async () => {
                let isInDB = typeof (await DB.SELECT("video", id)) != "undefined";
                isInDB ? true : await DB.INSERT("video", {
                    id: id,
                    time: time
                });
            })();
            break;
        case "rank":
            await new RankScheduleJob(id, time);
            (async () => {
                let isInDB = typeof (await DB.SELECT("rank", id)) != "undefined";
                isInDB ? true : await DB.INSERT("rank", {
                    id: id,
                    time: time
                });
            })();
            break;
    }
    ctx.body = `<h3>Sueecssed Create ${type} Job ${id} with ${time} </h3>`;
}

module.exports = {
    add: add
}