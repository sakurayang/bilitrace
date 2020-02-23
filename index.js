const path = require("path");

const server = require("./server").app;
const live = require("./utils/live");
const video = require("./utils/video");

const config = require("./config");

const g_data_path = config.data_path;

if (config.web.enable) server.listen(config.web.port, () => console.log("web start at " + config.web.port));

if (live_enable) {
    for (const live_id of require(path.join(g_data_path, "list.json")).list) {
        if (!live_id.enable) continue;
        console.log(`Room ${live_id.id} add`);
        live.add(live_id.id);
    }
}

if (video_enable) {
    for (const video_id of require(path.join(g_data_path, "video.json")).list) {
        if (!video_id.enable) continue;
        console.log(`Video ${video_id.id} add`);
        video.add(video_id.id, video_id.time);
    }
}