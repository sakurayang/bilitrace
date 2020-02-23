const server = require("./server").app;
const live = require("./utils/live");
const video = require("./utils/video");
const control = require("./utils/controller");
const config = require("./config");

config.web.enable ?
    server.listen(config.web.port, () => console.log("web start at " + config.web.port)) :
    console.log("web not enable");

if (config.live_enable) {
    let data = control.File2Json("list.json");
    if (list in data)
        for (const live_id of data.list) {
            if (!live_id.enable) continue;
            console.log(`Room ${live_id.id} add`);
            live.add(live_id.id);
        }
}

if (config.video_enable) {
    let data = control.File2Json("cideo.json")
    if (list in data)
        for (const video_id of data.list) {
            if (!video_id.enable) continue;
            console.log(`Video ${video_id.aid} add`);
            video.add(video_id.aid, video_id.time);
        }
}