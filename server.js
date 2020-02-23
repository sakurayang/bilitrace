const koa = require('koa');
const _ = require('koa-route');

const video = require("./utils/video");
const live = require("./utils/live");
const request = require("request-promise-native");

const app = new koa();

const accept = ctx => {
    ctx.status = 200;
    ctx.set({
        "Content-Type": "application/json"
    });
};
const refuse = ctx => ctx.status = 403;;

app.use(_.get('/', ctx => ctx.body = "please visit api diretly"));

// video route
app.use(_.get('/video/:id', async (ctx, id) => {
    console.log("decate:get")
    accept(ctx);
    id = Number(id);
    let result = await video.read(id, false);
    ctx.body = result;
}));
app.use(_.get('/video/:id/init', async (ctx, id) => {
    console.log("decate:init")
    accept(ctx);
    id = Number(id);
    let result = await video.read(id, true);
    ctx.body = result;
}));

app.use(_.get('/video/:id/add', async (ctx, id) => {
    console.log("decate:add1")
    accept(ctx);
    id = Number(id);
    let query = ctx.query;
    let time = "time" in query ?
        String(query.time).endsWith(" ") ?
        String(query.time).substring(0, String(query.time).length - 1) :
        String(query.time) :
        "*/5 * * * *";
    let result = await video.add(id, time);
    ctx.body = result;
}));

app.use(_.get('/video/:id/remove', async (ctx, id) => {
    console.log("decate:remove")
    accept(ctx);
    id = Number(id);
    let result = await video.remove(id);
    ctx.body = result;
}));

app.use(_.get('/video/:id/update/:time', async (ctx, id, time) => {
    console.log("decate:update")
    accept(ctx);
    id = Number(id);
    time = String(time).endsWith(" ") ?
        String(time).substring(0, String(time).length - 1) :
        String(time);
    let result = await video.update(id, time);
    ctx.body = result;
}));
// ============ end Video route ===========

// live route
app.use(_.get('/live/:id', async (ctx, id) => {
    console.log("decate:live get")
    accept(ctx);
    ctx.body = await live.getRoomData(id, 0);
}));

app.use(_.get('/live/:id/init', async (ctx, id) => {
    console.log("decate:live init ")
    accept(ctx);
    ctx.body = await live.getRoomData(id, 1);
}));

app.use(_.get('/live/:id/living', async (ctx, id) => {
    console.log("decate:live status")
    ctx.status = 200;
    ctx.set({
        "Content-Type": "text/plain"
    });
    let info = await request.get(`https://api.live.bilibili.com/room/v1/Room/room_init?id=${id}`);
    info = JSON.parse(info);
    ctx.body = info.data.live_status;
}));

app.use(_.get('/live/:id/add/', async (ctx, id) => {
    console.log("decate:live add")
    accept(ctx);
    ctx.body = await live.add(id);
}));

app.use(_.get('/live/:id/remove', async (ctx, id) => {
    console.log("decate:live remove")
    accept(ctx);
    ctx.body = await live.cancel(id);
}));

// ============end live route=============
module.exports = {
    app
};