const config = require("./config.json");
const web = require("./web");
const trace = require("./Data");

config.web.enable ? web.start() : false;

let aid_list = config.aid_list;
let tid_list = config.tid_list;

function sleep(time, callback) {
    var stop = new Date().getTime();
    while (new Date().getTime() < stop + time) {
        ;
    }
    callback;
}

config.video_enable ? aid_list.forEach(video => {
    //为了不在同一分钟内执行大量请求导致被ban
    trace.trace("video", video.aid, video.time);
    console.log(`Schedule Job ${video.aid} has created`);
    sleep(800, () => {
        return null;
    });
}) : false;

config.rank_enable ? tid_list.forEach(rank => {
    let day = rank.day ? rank.day : 3;
    trace.trace("rank", rank.tid, rank.time, day);
    console.log(`Schedule Job ${rank.aid} has created`);
    sleep(800, () => {
        return null;
    });
}) : false;