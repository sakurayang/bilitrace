const request = require('request-promise-native');
const schedule = require('node-schedule');
const fs = require("fs");

const config = require("../config.js");

const DATABASE_TYPE = config.database.type.toLowerCase();
//const DATABASE_TYPE = "csv";
const DATABASE_PATH = DATABASE_TYPE == "csv" ? config.database.csv.path : config.database.mysql;
//const DATABASE_PATH = "./data/";

const TID = {
    28: "原创音乐",
    29: "音乐现场",
    30: "VOCALOID·UTAU",
    31: "翻唱",
    59: "演奏",
    130: "音乐综合",
    193: "MV",
    194: "电音"
}

var prev_job_time = Date.now();

async function sleep(time) {
    //debugger;
    var stop = new Date().getTime();
    //console.log(time);
    while (new Date().getTime() < stop + time) {
        ;
    }
    return Promise.resolve(null);
}

class CreateScheduleJob {
    /**
     * 
     * @param {String} type 
     * @param {Number} id 
     * @param {String} time 
     * @param {Number} day 
     * @returns {Object}
     */
    constructor(type, id, time = "*/5 * * * *", day = 3) {
        this.job_type = String(type) || "rank";
        this.job_id = String(id);
        this.job_time = String(time) || "*/5 * * * *";
        this.job_day = day || 3;
        return this;
    }
    cancel() {
        this.job.cancel();
    }
}

class RankScheduleJob extends CreateScheduleJob {
    /**
     * 
     * @param {Number} id 
     * @param {String} time 
     * @param {Number} day 
     */
    constructor(id, time = "* * */3 * *", day = 3) {
        super("rank", id, time, day);
        this.job_type = "rank";
        this.job_id = id;
        this.spider = new RankSpider(this.job_id);
        this.rank_data = new RankData(this.job_id);
        this.job = schedule.scheduleJob(String(id), this.job_time, async () => {
            let l_prev_job_time = prev_job_time;
            while (Date.now() - l_prev_job_time < 1000) {
                ;
            }
            prev_job_time = Date.now();
            let info = await this.spider.getInfo();
            //console.log(info);
            this.rank_data.write(info);
        });
        return this;
    }
}
class VideoScheduleJob extends CreateScheduleJob {
    /**
     * 
     * @param {Number} id 
     * @param {String} time 
     */
    constructor(id, time) {
        super("video", id, time);
        this.job_id = id;
        this.job_type = "video";
        this.spider = new VideoSpider(this.job_id);
        this.video_data = new VideoData(this.job_id);
        this.job = schedule.scheduleJob(String(id), this.job_time, async () => {
            while (Date.now() - prev_job_time < 100) {
                ;
            }
            prev_job_time = Date.now();
            let info = await this.spider.getInfo();
            //console.log(info);
            this.video_data.write(info);
        });
        return this;
    }
}


class Data {
    get name() {
        return this.data_path;
    }

    /**
     * @param {String} datatype 
     * @param {Number|String} id
     * @param {String} path
     * @return {Object}
     */
    constructor(datatype, id, path) {
        this.data_type = datatype;
        this.data_id = Number(id);
        this.data_path = path;
        return this;
    }

    /**
     * 
     * @returns {Void}
     */
    write(write_data) {
        if (DATABASE_TYPE == "csv") {
            let db_data = JSON.stringify(write_data).replace(/[\[|\]|\{|\}]/ig, "");
            console.log(db_data);
            fs.writeFile(this.data_path, db_data + "\n", {
                flag: "a+",
                encoding: "utf8"
            }, err => {});
        } else if (DATABASE_TYPE == "mysql") {
            const mysql = require('node-mysql-promise');
            const conn = mysql.createConnection(this.data_path);
            let table = this.data_type == "rank" ?
                `rank_${this.data_id}` :
                `video_${this.data_id}`;
            let table_value = this.data_type == "rank" ?
                "(aid bigint primary key, \
                title text, tid int, \
                tname text, author_name text, \
                author_mid bigint, pank int, \
                point bigint,pubdate bigint)" :
                "(aid int primary key, \
                title text, view bigint, \
                coin bigint, danma bigint, \
                favorite bigint, reply bigint, \
                share bigint, heart_like bigint, \
                pubdate text, update_date text)"
            conn.query(`CREATE TABLE ${table} VALUE ${table_value}`);
            conn.table(table)
                .addAll(write_data)
                .catch(err => {
                    throw err
                }).finally(() => conn.close());
        } else {
            throw new Error("type not support");
        }
    }


    /** 
     * @returns {Promise<Array<JSON>>}
     */
    async read() {
        if (DATABASE_TYPE == "csv") {
            const readCSV = require('csvtojson');
            let l_path = this.data_path;
            let read_data = await readCSV({
                noheader: 0,
                output: "json"
            }).fromFile(l_path);
            return read_data;
        } else if (DATABASE_TYPE == "mysql") {
            const mysql = require('node-mysql-promise');
            const conn = mysql.createConnection(this.data_path);
            let table = this.data_type == "rank" ?
                `rank_${this.data_id}` :
                `video_${this.data_id}`;
            let select_options = this.data_type == "rank" ? {} : {
                aid: this.data_id
            };
            let read_data = await conn.table(table)
                .limit(end - start + 1)
                .select(select_options);
            return read_data;
        } else {
            throw new Error("This type haven't been suppot");
        }
    }

}

class RankData extends Data {
    /**
     * 
     * @param {Number} id 
     */
    constructor(id) {
        let Path = require("path");
        let l_path = DATABASE_TYPE == "csv" ?
            Path.normalize(`${DATABASE_PATH}/rank_${TID[id]}.csv`) :
            DATABASE_PATH;
        super("rank", id, l_path);
        this.data_id = Number(id);
        this.data_type = "rank";
        this.data_path = l_path;

        return this;
    }
    write(data) {
        //console.log(data);
        let write_data = typeof(data) == "object" && data != null ? data : {};
        if (DATABASE_TYPE == "csv") {
            let head = "aid,title,tid,tname,author_name,author_mid,point,pubdate\n";
            fs.stat(this.data_path, err => {
                if (err) fs.writeFile(this.data_path, head, {
                    encoding: "utf8"
                }, err => {});
            });
            for (let rank_info of write_data) {
                super.write([
                    rank_info.id,
                    `"${rank_info.title}"`,
                    rank_info.tid,
                    rank_info.tname,
                    rank_info.author_name,
                    rank_info.author_mid,
                    rank_info.rank,
                    rank_info.point,
                    rank_info.pubdate
                ]);
            }
        } else if (DATABASE_TYPE == "mysql") {
            super.write(write_data);
        } else {
            throw new Error("Type not support");
        }
        return;
    }
}

class VideoData extends Data {
    constructor(id) {
        let Path = require("path");
        let l_path = DATABASE_TYPE == "csv" ?
            Path.normalize(`${DATABASE_PATH}/video_${id}.csv`) :
            DATABASE_PATH;
        super("video", id, l_path);
        this.data_id = Number(id);
        this.data_type = "video";
        this.data_path = l_path;
        return this;
    }
    async write(data) {
        // console.log(data);
        let write_data = typeof(data) == "object" && data != null ? data : [];
        if (DATABASE_TYPE == "csv") {
            let head = "aid,title,view,coin,danma,favorite,reply,share,heart_like,pubdate,update_date\n";
            try {
                await fs.statSync(this.data_path)
            } catch (error) {
                fs.writeFile(this.data_path, head, {
                    encoding: "utf8"
                }, err => {
                    console.log(err);
                });
            }

            super.write([
                write_data.aid,
                write_data.title,
                write_data.view,
                write_data.coin,
                write_data.danma,
                write_data.favorite,
                write_data.reply,
                write_data.share,
                write_data.heart_like,
                write_data.pubdate,
                write_data.update_date
            ]);
        } else if (DATABASE_TYPE == "mysql") {
            super.write(write_data);
        } else {
            throw new Error("Type not support");
        }
        return;
    }
}

class Spider {
    //    static video_baseurl = `https://api.bilibili.com/x/web-interface/view?aid=${this.id}`;
    //    static rank_baseurl = `https://api.bilibili.com/x/web-interface/ranking/region?rid=${this.id}&day=${this.time.day}`;

    constructor(type, id, day = 3) {
        this.spider_type = type.toLowerCase();
        this.spider_id = id;
        this.spider_day = day;
        this.spider_url = this.spider_type == "rank" ?
            `https://api.bilibili.com/x/web-interface/ranking/region?rid=${this.spider_id}&day=${this.spider_day}` :
            this.spider_type == "video" ?
            `https://api.bilibili.com/x/web-interface/view?aid=${this.spider_id}` :
            false;
        return this;
    }
}

class VideoSpider extends Spider {
    constructor(id) {
        super("video", id);
        this.spider_url = `https://api.bilibili.com/x/web-interface/view?aid=${this.spider_id}`;
        return this;
    }
    /**
     * @returns {JSON}
     */
    async getInfo() {
        let raw_data = JSON.parse(await request.get(this.spider_url));
        typeof(raw_data) != "object" ? console.log(raw_data): raw_data = raw_data.data
        let stat = raw_data.stat;
        return {
            aid: raw_data.aid,
            title: raw_data.title,
            view: stat.view,
            coin: stat.coin,
            danma: stat.danmaku,
            favorite: stat.favorite,
            reply: stat.reply,
            share: stat.share,
            heart_like: stat.like,
            pubdate: raw_data.pubdate,
            update_date: Date.now()
        }
    }
}

class RankSpider extends Spider {
    constructor(id, ...time) {
        time = time.length == 0 ? [Date.now()] : time;
        let from = time ?
            new Date(time[0]).toISOString().substr(0, 10) :
            new Date(Date.now()).toISOString().substr(0, 10);
        let to = time && time.length > 1 ?
            new Date(time[1]).toISOString().substr(0, 10) :
            from.substr(0, 8) + String(Number(new Date(from).getDate()) + 3).padStart(2, 0);
        let day = Number(to.substr(8, 2)) - Number(from.substr(8, 2));
        super("rank", id, day);
        this.spider_time = {
            from: from,
            to: to,
            day: day
        };
        return this;
    }
    async getInfo() {
        let raw_data = await request.get(this.spider_url);
        raw_data = JSON.parse(raw_data).data;
        let db_data = [];
        //console.log(data);
        for (let rank = 0, len = raw_data.length; rank < len; rank++) {
            let video = raw_data[rank];
            db_data.push({
                aid: video.aid,
                title: video.title,
                tid: this.spider_id,
                tname: video.typename,
                author_name: video.author,
                author_mid: video.mid,
                rank: rank + 1,
                point: video.pts,
                pubdate: video.create,
            });
        }
        return db_data;
    }
}

module.exports = {
    RankScheduleJob,
    VideoScheduleJob,
    RankData,
    VideoData,
    VideoSpider,
    RankSpider
}