const request = require('request-promise-native');
const schedule = require('node-schedule');

const config = require("../config.json");

const database_type = config.database.type.toUpperCase();
const database_path = database_type == "CSV" ? config.database.csv.path : config.database.mysql;


const tid = {
    28: "原创音乐",
    29: "音乐现场",
    30: "VOCALOID·UTAU",
    31: "翻唱",
    59: "演奏",
    130: "音乐综合",
    193: "MV",
    194: "电音"
}

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
    get job() {
        return this.job;
    }
    constructor(type, id, time, day = 3) {
        this.type = String(type) || "rank";
        this.id = String(id);
        this.time = String(time) || "*/5 * * * *";
        this.day = day || 3;
        this.spider = new Spider(this.type, this.id);
        this.data = new Data(this.type, this.id);
        this.job = schedule.scheduleJob(this.time, async () => {
            let info = await this.spider.getInfo();
            this.data.write(info);
        });
        return this;
    }
    cancel() {
        this.job.cancel();
    }
}

class CreateRankScheduleJob extends CreateScheduleJob {
    constructor(id, time, day = 3) {
        this.type = "rank";
        this.id = String(id);
        this.day = day || 3;
        this.time = String(time) || `* */${this.day} * * *`;
        this.spider = new RankSpider(this.id);
        this.data = new RankData(this.id);
        this.job = schedule.scheduleJob(this.time, async () => {
            let info = await this.spider.getInfo();
            this.data.write(info);
        });
        return this;
    }
}

class CreateVideoScheduleJob extends CreateScheduleJob {
    constructor(id, time) {
        this.type = "video";
        this.id = String(id);
        this.time = String(time) || `*/5 * * * *`;
        this.spider = new VideoSpider(this.id);
        this.data = new VideoData(this.id);
        this.job = schedule.scheduleJob(this.time, async () => {
            let info = await this.spider.getInfo();
            this.data.write(info);
        });
        return this;
    }
}

module.exports = {
    CreateScheduleJob,
    CreateRankScheduleJob,
    CreateVideoScheduleJob
}

class Data {
    get name() {
        return this.path;
    }

    /**
     * @param {String} datatype 
     * @param {Number|String} id
     * @param {String} path
     * @return {Object}
     */
    constructor(datatype, id, path) {
        this.datatype = datatype;
        this.id = Number(id);
        this.path = path;
        return this;
    }

    /**
     * 
     * @returns {Void}
     */
    write(data) {
        if (database_type == "csv") {
            const fs = require('fs');
            fs.writeFile(this.path, data, {
                flag: "a+",
                encoding: "utf8"
            }, err => console.log(err));
        } else if (database_type == "mysql") {
            const mysql = require('node-mysql-promise');
            const conn = mysql.createConnection(this.path);
            let table = this.datatype == "rank" ?
                `rank_${this.id}` :
                `video_${this.id}`;
            let table_value = this.datatype == "rank" ?
                "(aid bigint primary key,title text,view bigint,coin bigint,danma bigint,favorite bigint,reply bigint,share bigint,heart_like bigint,pubdate text,update_date text)" :
                "(aid int primary key, title text, tid int, tname text, rank int,date text,update_date text)";
            conn.query(`CREATE TABLE ${table} VALUE ${table_value}`);
            conn.table(table)
                .addAll(data)
                .catch(err => {
                    throw err
                }).finally(() => conn.close());
        } else {
            throw new Error("type not support");
        }
    }


    /** 
     * @param {Number} limit 
     * @returns {Promise<Array<JSON>>}
     */
    async read(limit) {
        let start = Number(limit.split('-')[0]);
        let end = Number(limit.split('-')[1]);
        console.log(start, end);
        if (database_type == "csv") {
            const readCSV = require('csvtojson');
            let l_path = this.path;
            let l_data = [];
            let read_data = await readCSV({
                noheader: 0,
                output: "json"
            }).fromFile(l_path);
            for (let i = start; i < end + 1; i++) {
                //console.log(i);
                if (read_data[i]) {
                    l_data.push(read_data[i])
                } else {
                    if (read_data[i + 1]) continue;
                    break;
                }
            }
        } else if (database_type == "mysql") {
            const mysql = require('node-mysql-promise');
            const conn = mysql.createConnection(this.path);
            let table = this.datatype == "rank" ?
                `rank_${this.id}` :
                `video_${this.id}`;
            let select_options = this.datatype == "rank" ? {} : {
                aid: this.id
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
    constructor(id) {
        let Path = require("path");
        super("rank", id, this.path);
        this.id = Number(id);
        this.datatype = "rank";
        this.path = database_type == csv ?
            Path.normalize(`${database_path}${this.datatype}_${tid[id]}.csv`) :
            database_path;

        return this;
    }
    write(data) {
        let data = data in Object && data != null ? data : {};
        if (database_type == "csv") {
            let head = "aid,view,coin,danma,favorite,reply,share,heart_like,point\n";
            fs.stat(this.path, err => {
                if (err) fs.writeFile(this.path, head, {
                    encoding: "utf8"
                }, err => {
                    throw err
                });
            });
            super.write([from.substr(4, 2),
            rank_info.rank_offset,
            rank_info.id,
            `"${rank_info.title}"`,
            rank_info.pubdate,
            `"${rank_info.tag.toString()}`
            ]).bind(this);
        } else if (database_type == "mysql") {
            super.write(data).bind(this);
        } else {
            throw new Error("Type not support");
        }
        return;
    }
}

class VideoData extends Data {
    constructor(id) {
        let Path = require("path");
        super("video", id, this.path);
        this.id = Number(id);
        this.datatype = "video";
        this.path = database_type == csv ?
            Path.normalize(`${database_path}${this.datatype}_${tid[id]}.csv`) :
            database_path;
        return this;
    }
    write(data) {
        let data = data in Object && data != null ? data : [];
        if (database_type == "csv") {
            let head = "aid,view,coin,danma,favorite,reply,share,heart_like,point\n";
            fs.stat(this.path, err => {
                if (err) fs.writeFile(this.path, head, {
                    encoding: "utf8"
                }, err => {
                    throw err
                });
            });
            super.write(data.toString() + "\n");
        } else if (database_type == "mysql") {
            super.write(data);
        } else {
            throw new Error("Type not support");
        }
        return;
    }
}

module.exports = {
    Data,
    RankData,
    VideoData
}


class Spider {
    static video_baseurl = `https://api.bilibili.com/x/web-interface/view?aid=${this.id}`;
    static rank_baseurl = `https://api.bilibili.com/x/web-interface/ranking/region?rid=${this.id}&day=${this.time.day}`;

    set url() {
        let l_type = this.spider_type.toLowerCase();
        this.url = l_type == "rank" ?
            rank_baseurl :
            l_type == "video" ?
                video_baseurl :
                false;
        return this.url;
    }

    get url() {
        return this.url;
    }

    constructor(type, id) {
        this.spider_type = type.toLowerCase();
        this.id = id;
        return this;
    }
}

class VideoSpider extends Spider {
    constructor(id) {
        super("video", id);
        return this;
    }
    /**
     * @returns {JSON}
     */
    async getInfo() {
        let data = await request.get(this.url);
        data = JSON.parse(data).data;
        let stat = data.stat;
        return {
            aid: data.aid,
            title: data.title,
            view: stat.view,
            coin: stat.coin,
            danma: stat.danmaku,
            favorite: stat.favorite,
            reply: stat.reply,
            share: stat.share,
            heart_like: stat.like,
            pubdate: data.pubdate,
            update_date: Math.floor(Date.now() / 1000)
        }
    }
}

class RankSpider extends Spider {
    constructor(id, ...time) {
        super("rank", id);
        time = time.length == 0 ? [Date.now()] : time;
        let from = new Date(time[0]).toISOString().substr(0, 10);
        let to = time.length > 1 ?
            new Date(time[1]).toISOString().substr(0, 10) :
            from.substr(0, 8) + String(new Date(from).getDate + 3);
        this.time = {
            from: from,
            to: to,
            day = Number(to.substr(8, 2)) - Number(from.substr(8, 2))
        };
        return this;
    }
    async getInfo() {
        let data = await request.get(this.url);
        data = JSON.parse(data).data;
        let now_date = Date.now();
        let db_data = [];
        for (let rank = 0, len = data.length; rank < len; rank++) {
            let video = data[rank];
            db_data.push({
                aid: video.aid,
                title: video.title,
                tid: id,
                tname: video.typename,
                author_name: video.author,
                author_mid: video.mid,
                rank: index + 1,
                point: video.pts,
                date: (new Date(video.create)).getTime(),
                update_date: now_date
            });
        }
        return db_data;
    }
}

module.exports = {
    Spider,
    VideoSpider,
    RankSpider
}