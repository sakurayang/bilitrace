//TODO 整合live
//TODO 调整DB调用
const DB = require("better-sqlite3")("./schedule.db");

const koa = require('koa');
const _ = require('koa-route');

const db = require("./plugins/db");

const show = require('./router/show').show;
const add = require('./router/add').add;
const remove = require('./router/remove').remove;
const update = require('./router/update').update;

const app = new koa();

app.use(_.get('/', ctx => ctx.body = "please visit api diretly"));

// video route
// show route
app.use(_.get('/video/:aid', async ctx => {
    ctx.status = 200;
    ctx.set = ({ "Content-Type": "application/json" });
    aid = Number(aid);
    await show(ctx, id, type);
}));
app.use(_.get('/video/:aid/init', async ctx => {
    ctx.status = 200;
    ctx.set = ({ "Content-Type": "application/json" });
    aid = Number(aid);
    await show(ctx, id, type);
}));

// add route
app.use(_.get('/video/:aid/add/:time', async ctx => {
    ctx.status = 200;
    ctx.set = ({ "Content-Type": "application/json" });
    aid = Number(aid);
    time = String(time);
    await add(ctx, id, type, time)
}));

// remove route
app.use(_.get('/video/:aid/remove', async ctx => {
    ctx.status = 200;
    ctx.set = ({ "Content-Type": "application/json" });
    aid = Number(aid);
    await remove(ctx, id, type)
}));

// update route
app.use(_.get('/video/:aid/update/:time', async ctx => {
    ctx.status = 200;
    ctx.set = ({ "Content-Type": "application/json" });
    aid = Number(aid);
    time = String(time);
    await update(ctx, id, type, time)
}));

// live route
app.use(_.get('/live/:id', async (ctx, id) => {
    ctx.status = 200;
    ctx.set = ({ "Content-Type": "application/json" });
    ctx.body = await getRoomData(id, 0);
}));
app.use(_.get('/live/:id/init', async (ctx, id) => {
    ctx.status = 200;
    ctx.set = ({ "Content-Type": "application/json" });
    ctx.body = await getRoomData(id, 1);
}));
app.use(_.get('/live/:id/living', async (ctx, id) => {
    ctx.status = 200;
    ctx.set = ({ "Content-Type": "text/plain" });
    let info = await request.get(`https://api.live.bilibili.com/room/v1/Room/room_init?id=${id}`);
    info = JSON.parse(info);
    ctx.body = info.data.live_status;
}));
app.use(_.get('/live/:id/add/', async (ctx, id) => {
    ctx.status = 200;
    ctx.set = ({ "Content-Type": "application/json" });
    let data = await fs.readFileSync('./list.json', { encoding: 'utf-8' });
    data = JSON.parse(data);
    for (const item of data.list) {
        if (item.id == id) {
            ctx.body = "has been added";
            return;
        }
        else continue;
    }
    //TODO 分离这个log进单独的文件
    data.list.push({ id: Number(id), enable: 1 });
    fs.writeFile('./list.json', JSON.stringify(data), { encoding: 'utf-8' }, err => console.log(err));
    service.add(id);
}));


module.exports = { app };