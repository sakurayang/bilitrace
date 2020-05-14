const request = require("request-promise-native");
const logger = require("./utils/logger").getLogger("watcher");
const video = require('./utils/video');
const control = require("./utils/controller");
const schedule = require("node-schedule");

let globals = require("node-global-storage");
var prev_job_time = Date.now();

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
    const api = pn => `https://api.bilibili.com/x/space/arc/search?&pn=${pn}&ps=1&mid=${mid}`;
    let count = await getVideoCount(mid);
    let prev_count = globals.isSet("user_" + mid + "_count") ? globals.get("user_" + mid + "_count") : 0;
    globals.set("user_" + mid + "_count", count);
    logger.info(``);
    if (count > prev_count) {
        for (let pn = prev_count; pn <= count; pn++) {
            let data_base_list = await control.File2Json("video.json");
            let l_prev_job_time = prev_job_time;
            while (Date.now() - l_prev_job_time < 1000) {
                ;
            }
            prev_job_time = Date.now();
            let req_api = api(pn);
            let aid = JSON.parse(await request.get(req_api)).data.list.vlist[0].aid;
            if (data_base_list.indexOf(aid) !== -1) continue;
            await video.add(aid);
        }
    }
}

module.exports = {
    watch: (mid) => {
        logger.info("[create]" + mid);
        schedule.scheduleJob("*/30 * * * *", () => watchVideo(mid));
    }
}