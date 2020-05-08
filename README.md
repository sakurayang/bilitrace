# Bilibili Video Track

> 用于持续追踪视频/排行榜/用户/直播间的情况

## 系统需求

- Node.JS &gt;= 10.13.0
- sqlite3

## 安装

```sh
user@user:/bilitrace$ mv config.json.example config.json
#修改配置项
user@user:/bilitrace$ yarn
user@user:/bilitrace$ screen node index.js
```

推荐用`screen`或`forever`来保持运行

---

## 配置项说明

配置应以`JS`格式书写并以`UTF-8`编码保存

```js
module.export = {
  video_enable: 1,
  rank_enable: 0,
  user_enable: 0,
  live_enable: 1,
  debug: false,                    // 是否开启调试模式
  data_path: path.resolve("./"),   // 存放数据库，日志等的位置
  web: {
    "enable": true,                // 是否开启
    "host": "0.0.0.0",             // 监听地址
    "port": "8083"                 // 监听端口
  }
}
```

### 追踪列表说明

所有的追踪列表以`JSON`储存在`data_path`所在的目录

当文件为`video.json`时，id为视频id（av与bv皆可）。依此类推。

```json
[
  {id:123456, enable:1},
  {id:234567, enable:1}
]
```

---

## http api
### 视频
#### 添加
`/video/add?id=<id>`

调用方式: `GET`

参数说明：
| 名称 | 是否必须 | 说明       |
| :--- | :------: | :--------- |
| id   |   true   | av与bv皆可 |

返回类型：`JSON`
```json
{
  code: 0
  msg: ""
}
```
若id不合法或发生其他错误，则 id 为 -1，msg 为详细错误信息

---

#### 删除
`/video/remove?id=<id>`

调用方式：`GET`

参数说明：同上

返回类型：同上

---

#### 查询
`/video/get?id=<id>`

调用方式：`GET`

参数说明：
| 名称 | 是否必须 | 说明                                                     |
| :--- | :------: | :------------------------------------------------------- |
| id   |   true   | av与bv皆可                                               |
| init |  false   | 是否初始化，true或false，true则包含历史记录，默认为false |
返回类型：`JSON`
```js
{
"code": 0 | -1,
"msg":"init" | "",
"result": [{}]   //见下表
}
```
若init为`true`，则数组包含至少一个json，若为`false`，则包含至多一个json

result 内数据说明
| 名称        | 数据类型 | 说明                 |
| :---------- | :------: | :------------------- |
| id          |  Number  | 唯一标识符           |
| aid         |  Number  | 视频av号             |
| title       |  String  | 视频标题             |
| view        |  Number  | 播放次数             |
| coin        |  number  | 硬币数               |
| danma       |  number  | 弹幕数               |
| favorite    |  number  | 收藏数               |
| reply       |  number  | 评论数（包含楼中楼） |
| share       |  number  | 分享数               |
| heart_like  |  number  | 点赞数               |
| public_time |  number  | 视频发布时间         |
| update_time |  number  | 数据更新时间         |

---

#### 更新
`/video/update?id=<id>&time=<time>`

!!!⚠该接口已弃用!!!

调用方式：`GET`

参数说明：
| 名称 | 是否必须 | 说明                   |
| :--- | :------: | :--------------------- |
| id   |   true   | av与bv皆可             |
| time |   true   | 时间格式为cron job格式 |

返回类型：`JSON`
```json
{
  code: 0
  msg: ""
}
```
若id不合法或发生其他错误，则 id 为 -1，msg 为详细错误信息

---

### 直播
#### 添加
`/live/add?id=<id>`

调用方式: `GET`

参数说明：
| 名称 | 是否必须 | 说明   |
| :--- | :------: | :----- |
| id   |   true   | 房间号 |

返回类型：`JSON`
```json
{
  code: 0
  msg: ""
}
```
若id不合法或发生其他错误，则 id 为 -1，msg 为详细错误信息

---

#### 删除
`/live/remove?id=<id>`

调用方式：`GET`

参数说明：同上

返回类型：同上

---

#### 查询
`/live/get?id=<id>&init=<init>`

调用方式：`GET`

参数说明：
| 名称 | 是否必须 | 说明                                                     |
| :--- | :------: | :------------------------------------------------------- |
| id   |   true   | 房间号                                                   |
| init |  false   | 是否初始化，true或false，true则包含历史记录，默认为false |
返回类型：`JSON`
```js
{
"code": 0 | -1,
"msg":"init" | "",
"result": {
  "view":[],
  "gift":[]
}   //见下表
```
若init为`true`，则数组包含至少一个json，若为`false`，则包含至多一个json

result 内数据说明

view:
| 名称        | 数据类型 | 说明         |
| :---------- | :------: | :----------- |
| count       |  number  | 直播次数标识 |
| update_time |  number  | 数据更新时间 |
| time        |  number  | 开播时间     |
| views       |  number  | 人气值       |
gift:
| 名称        | 数据类型 | 说明                                           |
| :---------- | :------: | :--------------------------------------------- |
| id          |  number  | 唯一标识id                                     |
| count       |  number  | 直播次数标识                                   |
| update_time |  number  | 数据更新时间                                   |
| time        |  number  | 开播时间                                       |
| gift_name   |  string  | 礼物名字                                       |
| gift_id     |  number  | 礼物id                                         |
| gift_count  |  number  | 礼物数量                                       |
| silver      |  number  | 银瓜子数量，可能为null，与金瓜子数量不同时存在 |
| gold        |  number  | 金瓜子数量，可能为null，与银瓜子数量不同时存在 |
---

#### 更新
`/live/update?id=<id>`

!!!⚠该接口已弃用!!!

调用方式：`GET`

参数说明：
| 名称 | 是否必须 | 说明   |
| :--- | :------: | :----- |
| id   |   true   | 房间号 |

返回类型：`JSON`
```json
{
  code: 0
  msg: ""
}
```
若id不合法或发生其他错误，则 id 为 -1，msg 为详细错误信息

#### 查询直播状态
`/live/living?id=<id>`

调用方式：`GET`

参数说明：同上

返回：`0` 或 `1`