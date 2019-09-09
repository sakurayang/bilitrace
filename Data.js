const request = require('request-promise-native');
const schedule = require('node-schedule');

const config = require("./config.json");

const database_type = config.database.type.toUpperCase();
const root_path = String(config.database.csv.path);

function sleep(time, callback) {
    var stop = new Date().getTime();
    while (new Date().getTime() < stop + time) {
        ;
    }
    callback();
}

/**
 * @param {String} type
 * @param {Number} id
 */

function getInfo(type, id, day = 3) {
    console.log(type, id);
    switch (type.toUpperCase()) {
        default:
        case "VIDEO":
            return request.get(`https://api.bilibili.com/x/web-interface/view?aid=${String(id)}`);
            break;
        case "RANK":
            return request.get(`https://api.bilibili.com/x/web-interface/ranking/region?rid=${rid}&day=${day}&original=1`);
            break;
    }
}

function traceVideo(type, id, time, day = 3) {
    let type = type.toUpperCase;
    type == "VIDEO" ?
        schedule.scheduleJob(String(id), `*/${time} * * * *`, () => {
            getInfo("video", id).then(res => {
                let data = JSON.parse(res).data;
                let stat = data.stat;
                let db_data = {
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
                    update_date: Date.now()
                };
                writeData(db_data);
            }).catch(err => console.log(err))
        }) :
        schedule.scheduleJob(String(id), `* * */${time} * *`, () => {
            getInfo("rank", id, day).then(res => {
                let data = JSON.parse(res).data;
                let date = Date.now();
                data.forEach((video, index) => {
                    let db_data = {
                        aid: video.aid,
                        title: video.title,
                        tid: id,
                        tname: video.typename,
                        author_name: author,
                        author_mid: mid,
                        rank: index,
                        point: video.pts,
                        date: date,
                        update_date: Date.now()
                    }
                });
            })
        })
}

/**
 * @param {String} type
 * @param {JSON[]} data - it should be a JSON object
 */
function writeData(type, data) {
    let type = type.toUpperCase();
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
            const createCsvWriter = require('csv-writer').createObjectCsvWriter;
            const fs = require('fs');
            let path = type == "RANK" ? `${root_path}${data.tname}.csv` : `${root_path}${data.aid}.csv`;

            let write = (createCsvWriter, options) => {
                const csvWriter = createCsvWriter(options);
                csvWriter.writeRecords([data]).then(() => console.log("Done"));
            }

            const options = {
                path: path
            };
            fs.stat(path, function (err, stat) {
                if (err) {
                    options.append = false;
                    write(createCsvWriter, options)
                } else {
                    options.append = true;
                    write(createCsvWriter, options);
                }
            });
            break;
        case "MYSQL":
            const mysql = require('node-mysql-promise');
            const conn = mysql.createConnection(config.database.mysql);
            let table = type == "RANK" ? `rank_${data.tid}` : video;
            let table_value = type == "RANK" ?
                "(aid bigint primary key,title text,view bigint,coin bigint,danma bigint,favorite bigint,reply bigint,share bigint,heart_like bigint,pubdate text,update_date text)" :
                "(aid int primary key, title text, tid int, tname text, rank int,date text,update_date text)";
            conn.query(`CREATE TABLE ${table} VALUE ${table_value}`);
            conn.table(table)
                .thenAdd(data, {
                    update_date: data.update_date
                }, false)
                .then(() => false)
                .catch(err => {
                    throw err
                });
            conn.close();
        default:
            throw new Error("Type not suppot \n Suppot type: Mysql, CSV")
            break;
    }
}

function readData(type, id) {

}


module.exports = {
    get: getInfo,
    write: writeData,
    read: readData,
    traceVideo: traceVideo,
    traceRank: traceRank
}

/*
test data:
{aid:123,title:"123",views:123,coin:123,danma:123,favorite:123,reply:123,share:123,heart_like:123,pubdate:1566764551469,update_date:1566764551469}
*/