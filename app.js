const fs = require("fs");
const DB = require("better-sqlite3")("./schedule.db");
const config = require("./config.json");

const koa = require('koa');
const serve = require('koa-static');
const _ = require('koa-route');

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


app.use(serve('./static'));

app.use(_.get('/', ctx => ctx.body = "Please Visit api diretly"));

app.use(_.get('/show/:aid', async (ctx, aid) => {
    await show(ctx, Number(aid));
}));

app.use(_.get('/add/:aid/', async (ctx, aid) => {
    await add(ctx, Number(aid));
}));

app.use(_.get('/add/:aid/:time', async (ctx, aid, time) => {
    await add(ctx, Number(aid), time);
}));

app.use(_.get('/remove/:aid'), async (ctx, aid) => {
    await removeEventListener()
})

app.listen(8699, console.log("success"));
//config.web.enable ? app.listen(config.web.port, config.web.host) : false;