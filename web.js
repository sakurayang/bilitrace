const trace = require('./Data');
const fs = require('fs');

const express = require('express');
const app = express();
const router = express.Router();

const config = require("./config.json");
const path = config.database.csv.path;
const port = config.web.port;
const host = config.web.host;

function parseData(data) {
    let parsed_data = {
        view: [],
        coin: [],
        danma: [],
        favourite: [],
        reply: [],
        share: [],
        heart_like: [],
        updata_date: []
    }
    data.forEach(value => {
        parsed_data.view.push(value.view);
        parsed_data.coin.push(value.coin);
        parsed_data.danma.push(value.danma);
        parsed_data.favourite.push(value.favourite);
        parsed_data.reply.push(value.reply);
        parsed_data.share.push(value.share);
        parsed_data.heart_like.push(value.heart_like);
        parsed_data.updata_date.push((new Date(Number(value['updata_date']))).toLocaleTimeString("en-US", {
            hour12: 0
        }));
    });
    return parsed_data;
}

router.param('aid', (req, res, next, aid) => {
    fs.stat(path + `${aid}.csv`, (err, stat) => {
        err ? res.status(404).send("File Not Found").end() : !stat.isFile ? res.status(404).end() : next();
    });
});
router.param('limit', (req, res, next) => {
    next()
});

//

app.get(['/video/:aid/', '/video/:aid/:limit'], (req, res) => {
    let aid = req.params.aid;
    let limit = req.params.limit ? req.params.limit : '0-50';

    //let limit = 50;
    console.log(path + `${aid}.csv`);
    trace.read('video', aid, limit)
        .then(data => {
            let parsed_data = parseData(data);
            let options = {
                xLable: "time",
                data: {
                    labels: parsed_data.updata_date,
                    datasets: [{
                        label: 'view',
                        data: parsed_data.view
                    }, {
                        label: 'coin',
                        data: parsed_data.coin
                    }, {
                        label: 'danma',
                        data: parsed_data.danma
                    }, {
                        label: 'favourite',
                        data: parsed_data.favourite
                    }, {
                        label: 'reply',
                        data: parsed_data.reply
                    }, {
                        label: 'share',
                        data: parsed_data.share
                    }, {
                        label: 'heart_like',
                        data: parsed_data.heart_like
                    }]
                },
                options: {
                    yTickCount: 15
                }
            }
            let html = `
            <style>body{margin:0;padding:0}</style>
            <svg width="100%" height="100%" style="padding:0;margin:0"></svg>
            <script src="https://cdn.jsdelivr.net/npm/chart.xkcd@1/dist/chart.xkcd.min.js"></script>
            <script type="text/javascript">
                const char = document.querySelector("svg");
                const line =  new chartXkcd.Line(char,${JSON.stringify(options)});
            </script>
            `;

            res.send(html);
        }).catch(err => {
            throw err
        });
});

module.exports = {
    start: () => {
        console.log(`web strat on ${host}:${port}`);
        app.listen(port, host)
    }
}