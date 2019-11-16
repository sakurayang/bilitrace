const add = require("./add");
const remove = require("./remove");

async function update(ctx, id, time) {
    try {
        await remove(ctx, id);
        await add(ctx, id, time);
        ctx.body = "successed";
    } catch (error) {
        ctx.body = error;
    }
}

module.exports = {
    update: update
}