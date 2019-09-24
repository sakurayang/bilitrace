//const data = require("./Data");
const request = require('request-promise-native').defaults({
    family: 4
});

const rank_base_url = 'https://s.search.bilibili.com/cate/search?main_ver=v3&pagesize=1&search_type=video&view_type=hot_rank';
//&cate_id=28&time_from=20190913&time_to=20190921
//原创音乐 28 翻唱 31 VOCALOID·UTAU 30 演奏59 电音 194 MV 193 音乐现场 29 音乐综合 130
let start_time = Date.now();
let cate_list = [{
    tid: 28,
    from: 20190913,
    to: 20190920
}];

async function sleep(time) {
    //debugger;
    var stop = new Date().getTime();
    //console.log(time);
    while (new Date().getTime() < stop + time) {
        ;
    }
    return Promise.resolve(null);
}

async function getPageCount(tid, from, to = from) {
    let url = encodeURI(rank_base_url + `&cate_id=${tid}&page=1&time_from=${from}&time_to=${to}`);
    console.log(url);
    let raw = await request.get(url);
    let num = JSON.parse(raw).numResults;
    console.log(`预计时间：${num*0.6/60}分钟`)
    //console.log(raw);
    //debugger;
    return num;
}

async function getVideoAid(tid, page, from, to = from) {
    console.log(`已用时间：${(Date.now()-start_time)/1000/60}`);
    let url = encodeURI(rank_base_url + `&cate_id=${tid}&page=${page}&time_from=${from}&time_to=${to}`);
    console.log(url);
    let raw = await request.get(url);
    let result = JSON.parse(raw).result[0];
    return result.id;
}

async function getAidList(tid, from, to = from) {
    let aid_list = [];
    let num = await getPageCount(tid, from, to);
    for (let page = 1; page <= num; page++) {
        await sleep(600);
        let aid = await getVideoAid(tid, page, from, to);
        aid_list.push(aid);
    }
    return aid_list;
}


async function getVideoInfo(aid) {
    console.log(`已用时间：${(Date.now()-start_time)/1000/60}`);
    //console.log(aid);
    let result = await request.get(encodeURI(`https://api.bilibili.com/x/web-interface/view?aid=${String(aid)}`));
    console.log(result);
    let stat = (JSON.parse(result).code == 0) ? JSON.parse(result).data.stat : {
        view: 0,
        coin: 0,
        danma: 0,
        favorite: 0,
        reply: 0,
        share: 0,
        share: 0,
        like: 0
    };

    debugger;
    return {
        view: stat.view,
        coin: stat.coin,
        danma: stat.danmaku,
        favorite: stat.favorite,
        reply: stat.reply,
        share: stat.share,
        heart_like: stat.like,
    };
}

async function getAllStat(list) {

    let all_stat = {
        view: 0,
        coin: 0,
        danma: 0,
        favorite: 0,
        reply: 0,
        share: 0,
        heart_like: 0,
    }
    for (type of list) {
        let aid_list = await getAidList(type.tid, type.from, type.to);
        debugger;
        for (let j = 0, jlen = aid_list.length; j < jlen; j++) {
            let aid = aid_list[j];
            console.log(`已用时间：${(Date.now()-start_time)/1000/60}`);
            console.log(`\n任务[${type.tid}：${j/jlen*100}%]`);
            let data = await getVideoInfo(aid);
            all_stat.view += data.view;
            all_stat.coin += data.coin;
            all_stat.danma += data.danma;
            all_stat.favorite += data.favorite;
            all_stat.reply += data.reply;
            all_stat.share += data.share;
            all_stat.heart_like += data.heart_like;
        }
        debugger;
    }
    return all_stat;
}

module.exports = {
    get: getAllStat
}

getAllStat(cate_list).then(res => console.log(res)).catch(err => console.log(err));
//getAidList(28, 20190913, 20190920).then(res => console.log(res));