module.exports = {
    'GET /': async ctx => {
        ctx.status = 200;
        ctx.type = "text/html";
        ctx.body = `Please access the api directly`;
    }
}