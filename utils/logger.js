const config = require("../config");
const log4js = require("log4js");
log4js.configure({
	appenders: {
		all: {
			type: "file",
			filename: require("path").join(
				config.data_path,
				`${new Date().toISOString().substring(0, 10)}.log`
			),
			compress: true,
		},
		ws: {
			type: "file",
			filename: require("path").join(
				config.data_path,
				`${new Date().toISOString().substring(0, 10)}.websocket.log`
			),
			compress: true,
		},
		...(config.debug
			? {
					out: {
						type: "stdout",
						layout: {
							type: "coloured",
						},
					},
					err: {
						type: "stderr",
						layout: {
							type: "coloured",
						},
					},
			  }
			: {}),
	},
	categories: {
		default: {
			appenders: ["all", ...(config.debug ? ["out"] : [])],
			level: "info",
		},
		core: {
			appenders: ["all", ...(config.debug ? ["out"] : [])],
			level: "info",
		},
		database: {
			appenders: ["all", ...(config.debug ? ["out"] : [])],
			level: "debug",
		},
		ws: {
			appenders: ["ws", ...(config.debug ? ["out"] : [])],
			level: "info",
		},
		live: {
			appenders: ["all", ...(config.debug ? ["out"] : [])],
			level: "info",
		},
		video: {
			appenders: ["all", ...(config.debug ? ["out"] : [])],
			level: "info",
		},
		...(config.debug
			? {
					err: {
						appenders: ["err"],
						level: "error",
					},
			  }
			: {}),
	},
});

module.exports = log4js;
