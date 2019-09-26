const express = require('express');
const router = express.Router();

const data = require("../plugins/Data");

router.param('id', (req, res, next, id, value) => {
    if (!id) {
        res.sendStatus(403);
        throw new Error("Error parmas");
    }
    app.set("id", value);
    next();
})

router.param('type', (req, res, next, type, value) => {
    let value = value || "video";
    app.set("type", value);
    next();
});


router.get('/add', function (req, res, next) {
    res.render('index', {
        title_en: 'Bilibili Trace',
        title_cn: 'Bilibili数据追踪'
    });
});

module.exports = router;