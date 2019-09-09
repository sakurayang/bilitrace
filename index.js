const readCSV = require('csvtojson');
const fs = require('fs');

const express = require('express');
const app = express();
const router = express.Router();
app.use(express.static("node_modules"));
const port = 8084;

const config = require("./config.json");
const path = config.database.csv.path;

function sleep(time, callback) {
    var stop = new Date().getTime();
    while (new Date().getTime() < stop + time) {
        ;
    }
    callback();
}


router.param('aid', (req, res, next, aid) => {
    fs.stat(path + `${aid}.csv`, (err, stat) => {
        err ? res.status(404).send("File Not Found").end() : !stat.isFile ? res.status(404).end() : next();
    });
});

app.get('/:aid', (req, res) => {
    let aid = req.params.aid;
    let data = {
        view: [],
        coin: [],
        danma: [],
        favourite: [],
        reply: [],
        share: [],
        heart_like: [],
        update_date: []
    }
    console.log(path + `${aid}.csv`);
    readCSV({
            noheader: 0,
            output: "json"
        }).fromFile(path + `${aid}.csv`)
        .then(json => {
            json.forEach(_data => {
                //console.log(_data);
                data.view.push(_data['view']);
                data.coin.push(_data['coin']);
                data.danma.push(_data['danma']);
                data.favourite.push(_data['favourite']);
                data.reply.push(_data['reply']);
                data.share.push(_data['share']);
                data.heart_like.push(_data['heart_like']);
                data.update_date.push((new Date(Number(_data['update_date']))).toLocaleTimeString("en-US", {
                    hour12: 0
                }));
            });
            return Promise.resolve(data, json[0].title);
        }).then((data, title) => {
            let options = {
                xLable: "time",
                data: {
                    labels: data.update_date,
                    datasets: [{
                        label: 'view',
                        data: data.view
                    }, {
                        label: 'coin',
                        data: data.coin
                    }, {
                        label: 'danma',
                        data: data.danma
                    }, {
                        label: 'favourite',
                        data: data.favourite
                    }, {
                        label: 'reply',
                        data: data.reply
                    }, {
                        label: 'share',
                        data: data.share
                    }, {
                        label: 'heart_like',
                        data: data.heart_like
                    }]
                },
                options: {
                    yTickCount: 15
                }
            }
            let html = `
            <svg width="100%" height="100%"></svg>
            <script src="https://cdn.jsdelivr.net/npm/chart.xkcd@1/dist/chart.xkcd.min.js"></script>
            <script type="text/javascript">
                const char = document.querySelector("svg");
                const line =  new chartXkcd.Line(char,${JSON.stringify(options)});
            </script>
            `;

            res.send(html);

        });

});

app.listen(port);