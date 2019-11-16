const {
    VideoScheduleJob
} = require('../plugins/Data');
const Jobs = require("node-schedule").scheduledJobs;
const DB = require("../plugins/db");

async function add(ctx, id, time = "*/5 * * * *") {
    if (!id || !(/[0-9]/.test(id)) || id in Jobs) {
        ctx.throw(500, "Error ID");
        throw Promise.reject(new Error("Error ID"));
    }
    new VideoScheduleJob(id, time);
    DB.INSERT("video", {
        id: id,
        time: time
    });
    ctx.body = `<h3>Sueecssed Create Job ${id} with ${time} </h3>`;
}

module.exports = {
    'add': add
}