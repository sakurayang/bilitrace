var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', {
        title_en: 'Bilibili Trace',
        title_cn: 'Bilibili数据追踪'
    });
});

module.exports = router;