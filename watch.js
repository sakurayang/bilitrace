const request = require("request-promise-native");
const fs = require("fs");

const {
    VideoScheduleJob
} = require('./plugins/Data');
const DB = require("./plugins/db");
var prev_job_time = Date.now();

async function add(id, time = "*/5 * * * *") {
    await new VideoScheduleJob(id, time);
    await DB.INSERT("video", {
        id,
        time
    });
}

async function getVideoCount(mid) {
    if (isNaN(mid)) return "id is not a number";
    let l_prev_job_time = prev_job_time;
    while (Date.now() - l_prev_job_time < 1000) {
        ;
    }
    prev_job_time = Date.now();
    const api = "https://api.bilibili.com/x/space/arc/search?&pn=1&ps=1&mid=" + mid;
    let count = await request.get(api);
    //console.log(JSON.parse(count));
    return (JSON.parse(count)).data.page.count;
}

async function watchVideo(mid) {
    if (isNaN(mid)) return "id is not a number";

    let Jobs = require("node-schedule").scheduledJobs;
    const api = pn => `https://api.bilibili.com/x/space/arc/search?&pn=${pn}&ps=1&mid=${mid}`;
    let count = await getVideoCount(mid);

    for (let pn = 1; pn <= count; pn++) {
        let database_json = require("./video.json");
        let data_base_list = database_json.list;
        let l_prev_job_time = prev_job_time;
        while (Date.now() - l_prev_job_time < 1000) {
            ;
        }
        prev_job_time = Date.now();
        let req_api = api(pn);
        let aid = JSON.parse(await request.get(req_api)).data.list.vlist[0].aid;
        if (data_base_list.indexOf(aid) !== -1 || aid in Jobs) continue;

        await add(aid);
        data_base_list.push(aid);
        fs.writeFileSync("./video.json", JSON.stringify(database_json));
    }
}

module.exports = {
    video: watchVideo
};