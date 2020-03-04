const koa = require('koa');
const _ = require('koa-route');

const video = require("./utils/video");
const live = require("./utils/live");
const request = require("request-promise-native");

let globals = require("node-global-storage");

const app = new koa();

const accept = ctx => {
    ctx.status = 200;
    ctx.set({
        "Content-Type": "application/json"
    });
};
const refuse = ctx => ctx.status = 403;

app.use(_.get('/', ctx => refuse(ctx)));
app.use(_.get('/video', ctx => {
    accept(ctx);
    ctx.body = {
        code: 0,
        msg: "",
        list: [
            "/get",
            "/add",
            "/remove",
            "/update"
        ]
    }
}));
app.use(_.get('/live', ctx => {
    accept(ctx);
    ctx.body = {
        code: 0,
        msg: "",
        list: [
            "/get",
            "/add",
            "/remove",
            "/living"
        ]
    }
}));

// video route
app.use(_.get('/video/get', async ctx => {
    accept(ctx);
    let query = ctx.query;
    if ("id" in query) {
        let id = Number(query.id);
        let init = "init" in query ? query.init : false;
        let result = await video.read(id, init);
        ctx.body = result;
        return;
    }
    ctx.body = {
        code: -1,
        msg: "id error"
    }
}));

app.use(_.get('/video/add', async ctx => {
    accept(ctx);
    let query = ctx.query;
    if ("id" in query) {
        let id = Number(query.id);
        let time = "time" in query ? (
            String(query.time).endsWith(" ") ?
            String(query.time).substring(0, String(query.time).length - 1) :
            String(query.time)
        ) : "*/5 * * * *";
        let result = await video.add(id, time);
        ctx.body = result;
        return;
    }
    ctx.body = {
        code: -1,
        msg: "id error"
    }
}));

app.use(_.get('/video/remove', async ctx => {
    accept(ctx);
    let query = ctx.query;
    if ("id" in query) {
        let id = Number(query.id);
        let result = await video.remove(id);
        ctx.body = result;
        return;
    }
    ctx.body = {
        code: -1,
        msg: "id error"
    }
}));

app.use(_.get('/video/update', async ctx => {
    accept(ctx);
    let query = ctx.query;
    if ("id" in query) {
        let id = Number(query.id);
        let time = "time" in query ?
            String(query.time).endsWith(" ") ?
            String(query.time).substring(0, String(query.time).length - 1) :
            String(query.time) :
            "*/5 * * * *";
        let result = await video.update(id, time);
        ctx.body = result;
        return;
    }
    ctx.body = {
        code: -1,
        msg: "id error"
    }
}));
// ============ end Video route ===========

// live route
app.use(_.get('/live/get', async ctx => {
    accept(ctx);
    let query = ctx.query;
    if ("id" in query) {
        let id = Number(query.id);
        let init = "init" in query ? query.init : false;
        let result = await live.read(id, init);
        ctx.body = result;
        return;
    }
    ctx.body = {
        code: -1,
        msg: "id error"
    }
}));

app.use(_.get('/live/living', async ctx => {
    ctx.status = 200;
    ctx.set({
        "Content-Type": "text/plain"
    });
    let query = ctx.query;
    if ("id" in query) {
        let id = Number(query.id);
        let info = await request.get(`https://api.live.bilibili.com/room/v1/Room/room_init?id=${id}`);
        info = JSON.parse(info);
        ctx.body = info.data.live_status;
        return;
    }
    ctx.body = {
        code: -1,
        msg: "id error"
    }
}));

app.use(_.get('/live/add/', async ctx => {
    accept(ctx);
    let query = ctx.query;
    if ("id" in query) {
        let id = Number(query.id);
        let result = await live.add(id);
        ctx.body = result;
        return;
    }
    ctx.body = {
        code: -1,
        msg: "id error"
    }
}));

app.use(_.get('/live/remove', ctx => {
    accept(ctx);
    let query = ctx.query;
    if ("id" in query) {
        let id = Number(query.id);
        live.cancel(id);
        ctx.body = {
            code: 0,
            msg: ""
        };
        return;
    }
    ctx.body = {
        code: -1,
        msg: "id error"
    }
}));

app.use(_.get('/live/status', async ctx => {
    accept(ctx);
    let query = ctx.query;
    if (globals.isSet("live_" + query.id)) {
        console.log("cache exist");
        ctx.body = globals.get("live_" + query.id).last_status;
        return;
    }
    console.log("cache unset")
    ctx.body = (JSON.parse(await request(`https://api.live.bilibili.com/room/v1/Room/room_init?id=${query.id}`))).data.live_status;
}));

// ============end live route=============
module.exports = {
    app
};