const DB = require("better-sqlite3")("./schedule.db");
const config = require("./config.json");

const koa = require('koa');
const serve = require('koa-static');
const _ = require('koa-route');

const db = require("./plugins/db");

const show = require('./router/show').show;
const add = require('./router/add').add;
const remove = require('./router/remove').remove;
const update = require('./router/update').update;

const app = new koa();

try {
    DB.prepare("CREATE TABLE video (aid text NOT NULL, time text NOT NULL)").run();
    console.log("table 'video' haven't been defined, created");
} catch (error) {
    console.log("table 'video' has been defined");
}
try {
    DB.prepare("CREATE TABLE rank (id integer NOT NULL, time text NOT NULL )").run();
    console.log("table 'rank' haven't been defined, created");
} catch (error) {
    console.log("table 'rank' has been defined")
}

async function init() {
    let video = await db.SELECTALL("video");
    let rank = await db.SELECTALL("rank");
    for (const video_item of video) {
        await setTimeout(() => {}, 100);
        add({
            body: ""
        }, video_item.id, "video", video_item.time);
    }
    for (const rank_item of rank) {
        await setTimeout(() => {}, 100);
        add({
            body: ""
        }, rank_item.id, "rank", rank_item.time);
    }
    console.log("success");
}

app.use(serve('./static'));

app.use(_.get('/', ctx => ctx.body = "please visit api diretly"));

//<-------------[START show route]------------->
app.use(_.get('/show', async ctx => {
    let query = ctx.query;
    let id = query.id;
    let type = query.type || "video";
    await show(ctx, id, type)
}));
//<-------------[END show route]------------->

//<-------------[START add route]------------->
app.use(_.get('/add', async ctx => {
    let query = ctx.query;
    let id = query.id;
    let type = query.type || "video";
    let time = query.time || "*/5 * * * *";
    await add(ctx, id, type, time)
}));
//<-------------[END add route]------------->

//<-------------[START add route]------------->
app.use(_.get('/remove', async ctx => {
    let query = ctx.query;
    let id = query.id;
    let type = query.type || "video";
    await remove(ctx, id, type)
}));
//<-------------[END add route]------------->

app.use(_.get('/update', async ctx => {
    let query = ctx.query;
    let id = query.id;
    let type = query.type || "video";
    let time = query.time || "*/5 * * * *";
    await update(ctx, id, type, time)
}))

//app.listen(8699, init());
config.web.enable ? app.listen(config.web.port, config.web.host, init()) : false;