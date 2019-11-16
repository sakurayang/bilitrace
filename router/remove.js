const Jobs = require("node-schedule").scheduledJobs;
const DB = require("../plugins/db");

async function remove(ctx, id) {
    if (id && (/[0-9]/.test(id)) && id in Jobs && await DB.SELECT("video", id)) {
        Jobs[String(id)].cancel();
        DB.DELETE("video", id);
        ctx.body = "succsed";
    } else {
        ctx.throw(500, "Error ID");
        throw Promise.reject(new Error("Error ID"));
    }
}

module.exports = {
    remove: remove
}