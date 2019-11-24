const {
    VideoData
} = require("../plugins/Data");

const config = require("../config.json");

const PATH = config.database.type.toLowerCase() == "csv" ? config.database.csv.path : config.database.mysql;

let HTML = `<!doctype html>
<html>
<head>
    <meta charset="utf-8" />
    <script src="../echarts.min.js" type="text/javascript"></script>
</head>
<body>
<div>
<ul>
<span style="color:red">view&nbsp;&nbsp;</span>
<span style="color:green">coin&nbsp;&nbsp;</span>
<span style="color:blue">danma&nbsp;&nbsp;</span>
<span style="color:black">favourite&nbsp;&nbsp;</span>
<span style="color:yellow">reply&nbsp;&nbsp;</span>
<span style="color:pink">share&nbsp;&nbsp;</span>
<span style="color:gray">like&nbsp;&nbsp;</span>
</ul>
</div>
<div id="charts" style="width: 100vw;height: 80vh;"></div>
`;

function parseData(data) {
    let parsed_data = [];
    parsed_data.push(["date", "view", "coin", "danma", "favourite", "reply", "share", "heart_like"]);
    data.forEach(value => {
        parsed_data.push([
            Number(value['update_date']),
            Number(value.view),
            Number(value.coin),
            Number(value.danma),
            Number(value.favourite),
            Number(value.reply),
            Number(value.share),
            Number(value.heart_like)
        ]);
    });
    return parsed_data;
}

async function showVideo(ctx, id) {
    let data = new VideoData(id, PATH);
    let video_data = await data.read();
    let parsed_data = parseData(video_data);
    let options = {
        color: ['red', 'green', 'blue', 'black', 'yellow', 'pink', 'gray'],
        title: {
            text: `Video :【${id}】`
        },
        legend: {
            top: 10,
            left: 'center',
            data: ["view", "coin", "danma", "favourite", "reply", "share", "heart_like"]
        },
        tooltip: {
            tigger: 'axis',
            axisPointer: {
                type: 'cross'
            },
            snap: true
        },
        axisPointer: {
            link: [{
                xAxisIndex: 'all'
            }],
            snap: true
        },
        dataZoom: [{
            xAxisIndex: [0],
            type: 'slider',
            start: parsed_data.length > 51 ? (1 - (50 / (parsed_data.length - 1))) * 100 : 0,
            end: 100
        }, {
            xAxisIndex: [0],
            type: 'inside',
            start: parsed_data.length > 51 ? (1 - (50 / (parsed_data.length - 1))) * 100 : 0,
            end: 100
        }, {
            yAxisIndex: [0],
            type: 'slider',
            start: 0,
            end: 100
        }],
        xAxis: {
            type: 'time',
            interval: 60 * 5 * 1000 //60second * 5minute * 1000ms
        },
        yAxis: [{
            type: 'value'
        }],
        series: [{
                type: 'line',
                encode: {
                    x: 'date',
                    y: 'view'
                }
            },
            {
                type: 'line',
                encode: {
                    x: 'date',
                    y: 'coin'
                }
            },
            {
                type: 'line',
                encode: {
                    x: 'date',
                    y: 'danma'
                }
            },
            {
                type: 'line',
                encode: {
                    x: 'date',
                    y: 'favourite'
                }
            },
            {
                type: 'line',
                encode: {
                    x: 'date',
                    y: 'reply'
                }
            },
            {
                type: 'line',
                encode: {
                    x: 'date',
                    y: 'share'
                }
            },
            {
                type: 'line',
                encode: {
                    x: 'date',
                    y: 'heart_like'
                }
            }
        ],
        dataset: {
            source: parsed_data
        }
    };
    let html = HTML +
        `<script>
        var myChart = echarts.init(document.getElementById('charts'));
        myChart.setOption(${JSON.stringify(options)});
        </script>
        </body>
        </html>`;
    ctx.body = html;
}

async function showRank(ctx, id) {
    ctx.body("building");
}

async function show(ctx, id, type = "video") {
    type = type.toLowerCase();
    for (const checkitem of [await check.id(require("../plugins/db"), id, type, "show"), check.type(type)]) {
        if (typeof(checkitem) != "boolean") {
            ctx.body = checkitem;
            return checkitem;
            break;
        }
    }
    switch (type) {
        default:
        case "video":
            await showVideo(ctx, id);
            break;
        case "rank":
            await showRank(ctx, id);
            break;
    }

}

module.exports = {
    show: show
}