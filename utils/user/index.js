const request = require("request-promise-native");
const control = require("../controller");
const {
    User
} = require("../Data");

async function getuserCount(mid) {
    if (isNaN(mid)) return "id is not a number";
    let l_prev_job_time = prev_job_time;
    while (Date.now() - l_prev_job_time < 1000) {
        ;
    }
    prev_job_time = Date.now();
    const api = "https://api.bilibili.com/x/space/arc/search?&pn=1&ps=1&mid=" + mid;
    let count = await request.get(api);
    //console.log(JSON.parse(count));
    return (JSON.parse(count)).data.page.count;
}

/**
 * @param {Number} id
 * @param {String} time cron job format 
 * @returns {{code:Number,msg:String}}
 */
async function add(id, time = "*/5 * * * *") {
    if (isNaN(id)) {
        return {
            code: -1,
            msg: `id: ${id} not a number`
        };
    } else if (
        typeof (time) !== "string" ||
        /^((\*((\/[0-9]{1,2})?))[\s]){4,5}\2/ig.test(time) !== true
    ) {
        return {
            code: -1,
            msg: `time: ${time} is not suit format`
        };
    }

    let data = await control.File2Json("user.json");
    for (const user of data.list) {
        if (id === user.aid && globals.isSet("user_" + user.id))
            return {
                code: -1,
                msg: `id: ${id} has been add${user.enable ? "" : " but not enable"}`
            };
    }
    data.list.push({
        id,
        enable: 1,
        time
    });
    control.Json2File("user.json", data);
    let user = new User(id, time);
    globals.set("user_" + id, user);
    return {
        code: 0,
        msg: ""
    };
}
module.exports = {
    add
};