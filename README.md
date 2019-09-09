# Bilibili Video Track

&gt; 用于持续追踪视频或排行榜的情况

## 系统需求

- Node.JS &gt;= 10.13.0
- MySQL 或 MariaDB (选择数据储存方式为Mysql时)

## 安装

首先将`config.json.example`复制并重命名为`config.json`，然后修改其中的配置项，关于配置项的细节请参考[配置项说明](#配置项说明)

然后`npm install`

随后请用`screen`或`forever`来运行

若你选择的数据储存类型为CSV，则视频为`aid.csv`，排行榜为`分区名称.csv`

## 配置项说明

配置应以`JSON`格式书写并以`UTF-8`编码保存

```json
{
    "aid_list": [{
        "aid": 123,
        "time": "*/1 * * * *"
    }],
    "tid_list": [{
        "tid": 24,
        "time": "* * */3 * *"
    }],
    "database": {
        "type": "csv",
        "csv": {
            "path": "./data/"
        },
        "mysql": {
            "host": "0.0.0.0",
            "user": "root",
            "password": "password",
            "port": "3306",
            "database": "database",
            "charset": "utf8mb4_unicode_ci"
        }
    },
    "web": {
        "enable":true,
        "host":"0.0.0.0",
        "port":8083
    }
}
```

- `aid_list` &lt;Array&gt;: 需要追踪的视频av号数组
  - `aid` &lt;Number|String&gt;: 需要追踪的视频av号，建议以`Number`类型储存
  - `time` &lt;Cron Job String&gt;: 追踪的时间间隔，是一个Cron Job格式的字符串。`*/1 * * * *`表示每隔一分钟记录一次追踪数据。总请求数不建议超过一分钟一次
- `tid_list` &lt;Array&gt;: 同上
- `database` &lt;JSON Object&gt;: 数据库类型与信息
- `type` &lt;String&gt;: 数据记录类型，CSV或MySQL
- `csv: path` &lt;String&gt;: CSV的储存目录
- `mysql` &lt;JSON Object&gt;: mysql数据库连接信息，请注意数据库的charset**一定**要是`utf8mb4_unicode_ci`，否则由于历史遗留问题导致数据库乱码
- `web` &lt;JSON Object&gt;: 控制基于网页的可视化是否开启。
  - `enbale` &lt;Boolean&gt;: true OR false
  - `host` &lt;String&gt;: 监听地址
  - `port` &lt;Number&gt;: 监听端口

## api

**粗体**为必填项 *斜体*为可选项

```js
let track = require('bilitrack');
track.get(type, id, day?)
```

获取数据

**type** &lt;String&gt;: 获取类型 video 或 rank

**id** &lt;Number|String&gt;: 当类型为video时，此项为aid。当类型为rank时，此项为分区id

*day* &lt;Number|String&gt;: 为rank指定范围，默认为3。当类型为rank时，此项才有效。

```js
trace.write(type, data)
```

写入数据

**type** &lt;String&gt;: 数据类型 video 或 rank

**data** &lt;JSON&gt;: 数据

数据格式：

```js
//视频数据
{
    aid: 1700001,          //视频AV号
    title: "Hop",          //视频标题
    view: 1265423215,      //再生
    coin: 1515664465,      //硬币
    danma: 2523,           //弹幕
    favorite: 125562152,   //收藏
    reply: 5626,           //回复
    share: 525632,         //分享
    heart_like: 65426556,  //点赞
    pubdate: 454562515,    //视频发布日期(UNIX)
    update_date: 415214514 //数据更新日期(UNIX)
}

//排行榜单体数据
{
    aid: 1700001,             //视频AV号
    title: "Hop",             //视频标题
    tid: 21,                  //分区id
    tname: "MV",              //分区名称
    author_name: "冰封的虾子", //作者名
    author_mid: 1234124,      //作者mid
    rank: 1,                  //排名
    point: 1231244,           //分数
    date: 1231234124,         //排行榜日期
    update_date: 123412512    //数据更新日期
}
```

```js
trace.read(type, id, limit)
```
读取数据，返回为一个由JSON组成的limit长度的数组。JSON格式同写入格式。

**type** &lt;String&gt;: 类型 video 或 rank

**id** &lt;Number|String&gt;: 当类型为video时，此项为aid。当类型为rank时，此项为分区id

*limit* &lt;Number&gt;: 获取数量限制，默认为10

```js
trace.trace(type, id, time, day)
```

开始追踪

**type** &lt;String&gt;: 类型 video 或 rank

**id** &lt;Number|String&gt;: 当类型为video时，此项为aid。当类型为rank时，此项为分区id

**time** &lt;Cron Job String&gt;: 追踪的时间间隔，是一个Cron Job格式的字符串。`*/1 * * * *`表示每隔一分钟记录一次追踪数据。总请求数不建议超过一分钟一次

*day* &lt;Number|String&gt;: 为rank指定范围，默认为3。当类型为rank时，此项才有效。

## 
