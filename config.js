const path = require("path");
module.exports = {
    "video_enable": 1,
    "rank_enable": 0,
    "data_path": path.resolve(__dirname + "/./"),
    "web": {
        "enable": true,
        "host": "0.0.0.0",
        "port": "8083"
    },
    "database": {
        type: "csv",
        csv: {
            path: "./data/"
        }
    }
}