const request = require('request-promise-native');
const schedule = require('node-schedule');

const config = require("./config.json");

const database_type = config.database.type.toUpperCase();
const root_path = String(config.database.csv.path);


/**
 * @param {String} type
 * @param {Number} id
 * @param {Number} day
 * @returns {Promise<JSON|Array<JSON>>}
 */
async function getInfo(type, id, day = 3) {
    console.log(type, id);
    switch (type.toUpperCase()) {
        default:
        case "VIDEO":
            return request.get(`https://api.bilibili.com/x/web-interface/view?aid=${String(id)}`)
                .then(res => {
                    let data = JSON.parse(res).data;
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
                        updata_date: Date.now()
                    };
                }).catch(err => {
                    throw err;
                });
            break;
        case "RANK":
            return request.get(`https://api.bilibili.com/x/web-interface/ranking/region?rid=${id}&day=${day}&original=1`)
                .then(res => {
                    //console.log(res);
                    let data = JSON.parse(res).data;
                    let date = Date.now();
                    let db_data = [];
                    data.forEach((video, index) => {
                        db_data.push({
                            aid: video.aid,
                            title: video.title,
                            tid: id,
                            tname: video.typename,
                            author_name: video.author,
                            author_mid: video.mid,
                            rank: index,
                            point: video.pts,
                            date: (new Date(video.create)).getTime(),
                            updata_date: date
                        });
                    });
                    return db_data;
                }).catch(err => {
                    throw err;
                });
            break;
    }
}
/**
 * 
 * @param {String} type 
 * @param {Number|String} id 
 * @param {String} time 
 * @param {Number} day 
 * @returns {Void} 
 */
function trace(type, id, time, day = 3) {
    type = String(type).toUpperCase();
    if (type == "VIDEO") {
        schedule.scheduleJob(String(id), time, () => {
            getInfo(type, id).then(res => {
                writeData(type, res);
            }).catch(err => {
                console.log(err);
                consile.log("\nCancle Next Trace");
                schedule.scheduledJobs[id].cancelNext();
            });
        });
    } else {
        schedule.scheduleJob(String(id), time, () => {
            getInfo(type, id, day).then(res => {
                writeData(type, res);
            }).catch(err => {
                console.log(err);
                consile.log("\nCancle Next Trace");
                schedule.scheduledJobs[id].cancelNext();
            });
        });
    }
    return null;
}

/**
 * @param {String} type
 * @param {JSON[]} data - it should be a JSON object
 * @returns {Void}
 */
function writeData(type, data) {
    type = type.toUpperCase();
    /*
    Load modules when their really need for tiny the memory,
    because the time for do a switch...case.. is less then load module.
    If type is mysql, regist the mysql module and connect;
    If type is csv, regist the json2csv module;
    If type either mysql nor csv, throw an error;
    */
    console.log(data);
    switch (database_type) {
        case "CSV":
            const fs = require('fs');
            let path = type == "RANK" ? require("path").normalize(`${root_path}rank_${data.tid}.csv`) : require("path").normalize(`${root_path}${data.aid}.csv`);

            let write = (data, header = 0) => {
                let decode_data = `${data.aid},"${data.title}",${data.coin},${data.view},${data.danma},${data.favorite},${data.heart_like},${data.reply},${data.share},${data.pubdate},${data.updata_date}`;
                fs.writeFile(path,
                    header ? "aid,title,coin,view,danma,favorite,heart_like,reply,share,pubdate,updata_date\n" + decode_data : decode_data, {
                        flag: "a+"
                    },
                    function(err) {
                        console.log(err)
                    });
            }

            fs.stat(path, function(err, stat) {
                if (err) {
                    write(data, 1)
                } else {
                    write(data, 0);
                }
            });
            break;
        case "MYSQL":
            const mysql = require('node-mysql-promise');
            const conn = mysql.createConnection(config.database.mysql);
            let table = type == "RANK" ? `rank_${data.tid}` : data.aid;
            let table_value = type == "RANK" ?
                "(aid bigint primary key,title text,view bigint,coin bigint,danma bigint,favorite bigint,reply bigint,share bigint,heart_like bigint,pubdate text,updata_date text)" :
                "(aid int primary key, title text, tid int, tname text, rank int,date text,updata_date text)";
            conn.query(`CREATE TABLE ${table} VALUE ${table_value}`);
            conn.table(table)
                .addAll(data)
                .catch(err => {
                    throw err
                }).finally(() => conn.close());
        default:
            throw new Error("Type not suppot \n Suppot type: Mysql, CSV")
            break;
    }
    return null;
}

/**
 * 
 * @param {String} type csv OR mysql
 * @param {String|Number} id 
 * @param {Number} limit 
 * @returns {Promise<Array<JSON>>}
 */
async function readData(type, id, limit) {
    type = type.toUpperCase();
    let start = Number(limit.split('-')[0]);
    let end = Number(limit.split('-')[1]);
    console.log(start, end);
    switch (database_type) {
        case "CSV":
            const readCSV = require('csvtojson');
            let path = type == "RANK" ? require("path").normalize(`${root_path}rank_${id}.csv`) : require("path").normalize(`${root_path}${id}.csv`);
            let data = [];
            return readCSV({
                    noheader: 0,
                    output: "json"
                }).fromFile(path)
                .then(json => {
                    for (let i = start; i < end + 1; i++) {
                        //console.log(i);
                        if (json[i]) {
                            data.push(json[i])
                        } else {
                            break;
                        }
                    };
                    return data;
                });
            break;
        case "MYSQL":
            const mysql = require('node-mysql-promise');
            const conn = mysql.createConnection(config.database.mysql);
            let table = type == "RANK" ? `rank_${id}` : Number(id);
            let select_options = type == "RANK" ? {} : {
                aid: id
            };
            return conn.table(table)
                .limit(end - start + 1)
                .select(select_options)
                .then(res => {
                    return res
                })
                .catch(err => {
                    throw err
                }).finally(() => conn.close());
        default:
            throw new Error("Type not suppot \n Suppot type: Mysql, CSV")
            break;
    }

}


module.exports = {
    get: getInfo,
    write: writeData,
    read: readData,
    trace: trace
}

/*
test data:
{aid:123,title:"123",views:123,coin:123,danma:123,favorite:123,reply:123,share:123,heart_like:123,pubdate:1566764551469,updata_date:1566764551469}
*/