const add = require("./add").add;
const remove = require("./remove").remove;
const check = require("../plugins/checkParams");

async function update(ctx, id, type = "video", time = "*/5 * * * *") {
    type = type.toLowerCase();
    for (const checkitem of [await check.id(DB, id, type, "update"), check.time(time), check.type(type)]) {
        if (typeof(checkitem) != "boolean") {
            return checkitem;
            break;
        }
    }
    try {
        await remove(ctx, id, type);
        await add(ctx, id, type, time);
        ctx.body = "success";
    } catch (error) {
        ctx.body = error;
    }

}

module.exports = {
    update: update
}