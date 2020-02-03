const request = require('request-promise-native');
const fs = require('fs');
const querystring = require('querystring')

/**
 * 
 * @param {-1|1|2|3} season_version 番剧类型 -1:全部[default]/1:正片/2:电影/3:其他
 * @param {-1|2|3|Number[]} area 地区 -1:全部[default]/2:日本/3:美国/{1,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53}:其他
 * @param {-1|0|1} is_finish 完结 -1:全部[default]/0:连载/1:完结
 * @param {Number} season_status 
 * @param {Number} season_month 季度 -1:全部[default]/1:1月/4:4月/7:7月/10:10月
 * @param {-1|String} year 时间: -1:全部[default]/[start-end):数学上的区间……
 * @param {Number} order 
 * @param {Number} st 
 * @param {Number} sort 
 * @param {Number} season_type 
 * @param {Number} pagesize 
 * @param {Number} type 
 * @param {-1|3|[1,2,4]} copyright 版权 -1:全部[default]/3:独家/1,2,4:其他
 */
const base = (season_version = -1, area = -1, is_finish = -1,
    season_status = -1, season_month = -1, year = -1,
    order = 3, st = 1, sort = 0, season_type = 1,
    pagesize = 1, type = 1, copyright = -1) => "https://api.bilibili.com/pgc/season/index/result?" +
    querystring.stringify({
        season_version, area, is_finish,
        season_status, season_month, year,
        order, st, sort,
        season_type, pagesize, type,
        copyright
    });

async function sleep(time) {
    var stop = new Date().getTime();
    while (new Date().getTime() < stop + time) {
        ;
    }
}
function writeData(type, cate, data) {
    console.log(type);
    console.log(data);
    path = `./rank_${cate}.csv`
    console.log(path);
    fs.writeFile(path, data.toString() + "\n", {
        flag: "a+"
    }, err => console.log(err));

}
