const server = require("./server").app;
const live = require("./utils/live");
const video = require("./utils/video");
const user = require("./utils/user");
const control = require("./utils/controller");
const config = require("./config");

config.web.enable
	? server.listen(config.web.port, () =>
			console.log("web start at " + config.web.port)
	  )
	: console.log("web not enable");

(async () => {
	if (config.live_enable) {
		let data = await control.File2Json("live.json");
		for (const live_id of data) {
			if (!live_id.enable) continue;
			live.add(live_id.id);
		}
	}
	if (config.video_enable) {
		let data = await control.File2Json("video.json");
		for (const video_id of data) {
			if (!video_id.enable) continue;
			video.add(video_id.id, video_id.time);
		}
	}
	if (config.user_enable) {
		let data = await control.File2Json("user.json");
		for (const user_id of data) {
			if (!user_id.enable) continue;
			user.add(user_id.id, user_id.time);
		}
	}
})();
