const Jobs = require("node-schedule").scheduledJobs;
const DB = require("../plugins/db");
const check = require("../plugins/checkParams");

async function remove(ctx, id, type = "video") {
    type = type.toLowerCase();
    for (const checkitem of [await check.id(DB, id, type, "remove"), check.type(type)]) {
        if (typeof(checkitem) != "boolean") {
            return checkitem;
            break;
        }
    }
    switch (type) {
        default:
        case "video":
            await Jobs[`video_${String(id)}`].cancel();
            await DB.DELETE("video", id);
            ctx.body = "succsed";
            break;
        case "rank":
            await Jobs[`rank_${String(id)}`].cancel();
            await DB.DELETE("rank", id);
            ctx.body = "succsed";
            break;
    }

}


module.exports = {
    remove: remove
}