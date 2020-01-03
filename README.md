# Bilibili Video Track

> 用于持续追踪视频或排行榜的情况

## 系统需求

- Node.JS &gt;= 10.13.0
- MySQL 或 MariaDB (选择数据储存方式为Mysql时)
- sqlite3

## 安装

```sh
user@user:/bilitrace$ mv config.json.example config.json
#修改配置项
user@user:/bilitrace$ npm install
user@user:/bilitrace$ screen npm start
#或者
#user@user:/bilitrace$ node app.js
```

推荐用`screen`或`forever`来保持运行
若你选择的数据储存类型为CSV，则视频为`video_aid.csv`，排行榜为`rank_rid.csv`

## 配置项说明

配置应以`JSON`格式书写并以`UTF-8`编码保存

```json
{
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
- `tid_list` &lt;Array&gt;: 需要追踪的分区变好
  - `aid` &lt;Number|String&gt;: 需要追踪的视频av号，建议以`Number`类型储存
  - `time` &lt;Cron Job String&gt;: 追踪的时间间隔，是一个Cron Job格式的字符串。`*/1 * * * *`表示每隔一分钟记录一次追踪数据。总请求数不建议超过一天一次
  - `day` &lt;Number&gt;: 排行榜获取范围（B站那个3日7日什么的），默认与缺省为3
- `database` &lt;JSON Object&gt;: 数据库类型与信息
- `type` &lt;String&gt;: 数据记录类型，CSV或MySQL
- `csv: path` &lt;String&gt;: CSV的储存目录
- `mysql` &lt;JSON Object&gt;: mysql数据库连接信息，请注意数据库的charset**一定**要是`utf8mb4_unicode_ci`，否则由于历史遗留问题导致数据库乱码
- `web` &lt;JSON Object&gt;: 控制基于网页的可视化是否开启。
  - `enbale` &lt;Boolean&gt;: true OR false
  - `host` &lt;String&gt;: 监听地址
  - `port` &lt;Number&gt;: 监听端口

## api

**粗体**或`< >`内为必填项 *斜体*或`[ ]`内为可选项

- `/add/<aid>/[time]`: 增加一个trace，time的格式为cron job格式
- `/update/<aid>/[time]`: 更改已有trace，不存在时会报错
- `/remove/<aid>`: 删除一个已有trace，不存在时会报错
- `/show/<aid>`: 数据展示，不存在时会报错

目前只做了视频类型的数据增删改查

