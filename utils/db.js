//[x]TODO 适配video与rank
const config = require("../config");
const path = require("path");
const PATH = config.data_path;
function parseObject(obj) {
    let keys = Object.keys(obj);
    let values = Object.values(obj);
    let transfrom = [];
    let isArray = Array.isArray(obj);

    for (const key in obj) {
        isArray ? transfrom[key] = obj[key] : transfrom.push(`${key}=${obj[key]}`);
    }
    return {
        keys,
        values,
        length: keys.length,
        transfrom,
        string: transfrom.toString().replace(",", " ")
    };
}

/**
 * 
 * @param {String} filename
 * @param {String} table 
 * @param {String} params
 * @return {JSON}
 */
async function select(filename, table, params = []) {
    let DB = require('better-sqlite3')(path.normalize(`${PATH}/${filename}`));
    try {
        let last_num = await getCount(filename, table, params);
        let result = await DB.prepare(`SELECT * FROM "${table}"` +
            `${Object.keys(params).length == 0 ? ' ' : 'WHERE ' + parseObject(params).string}` +
            `LIMIT 1 OFFSET ${last_num - 1}`).get();
        return {
            code: 0,
            msg: "",
            result
        };
    } catch (error) {
        return {
            code: -1,
            msg: error
        };
    }
}
async function getCount(filename, table, params = []) {
    let DB = require('better-sqlite3')(path.normalize(`${PATH}/${filename}`));
    try {
        let count = await DB.prepare(`SELECT count(*) FROM "${table}"` +
            `${Object.keys(params).length == 0 ? ' ' : 'WHERE ' + parseObject(params).string}`).get()['count(*)'];
        return count;
    } catch (error) {
        return {
            code: -1,
            msg: error
        };
    }
}
/**
 * 
 * @param {String} filename
 * @param {String} table 
 * @param {Number} limit
 * @param {Number} offset
 * @returns {{count: Number, 
    result: Array<JSON>}}
 */
async function selectAll(filename, table, params = [], limit = 0, offset = 0) {
    let DB = require('better-sqlite3')(path.normalize(`${PATH}/${filename}`));
    try {
        let result = [];
        let count = await getCount(filename, table);
        let limit = limit ? limit : count;
        //console.log(count);
        //console.log(limit);
        for (let i = 0; i < Math.abs(limit - offset); i++) {
            if (i > count - offset - 1) break;
            //console.log(i, parseObject(where).string);
            let db_data = await DB.prepare(`SELECT * FROM "${table}"` +
                `${Object.keys(params).length == 0 ? ' ' : 'WHERE ' + parseObject(params).string}` +
                ` LIMIT 1 OFFSET ${offset + i}`).get();
            result.push(db_data);
        }
        return { code: 0, msg: "", count, result };
    } catch (error) {
        return {
            code: -1,
            msg: error
        };
    }
}
/**
 * 
 * @param {String} filename
 * @param {String} table 
 * @param {JSON} values
 */
async function insert(filename, table, values) {
    let DB = require('better-sqlite3')(path.normalize(`${PATH}/${filename}`));
    //console.log(parseObject(values).keys.toString())
    //console.log(parseObject(values).values.toString())
    //console.log(values);
    try {
        await DB.prepare(`INSERT INTO "${table}" (${parseObject(values).keys.toString()}) VALUES (${parseObject(values).values.toString()})`).run();
        return {
            code: 0,
            msg: ""
        }
    } catch (error) {
        return {
            code: -1,
            msg: error
        }
    }

}

/**
 * 
 * @param {String} filename
 * @param {String} table 
 * @param {{
    time: Date,
    views: Number,
    gift: Number,
    silver: Number,
    gold: Number
    }} params
 */
function delect(filename, table, params) {
    let DB = require('better-sqlite3')(path.normalize(`${PATH}/${filename}`));
    try {
        DB.prepare(`DELETE FROM "${table}" WHERE ${parseObject(params).string}`).run();
        return {
            code: 0,
            msg: ""
        }
    } catch (error) {
        return {
            code: -1,
            msg: error
        }
    }

}

/**
 * 
 * @param {String} filename
 * @param {String} table
 * @param {JSON} params where
 * @param {JSON} values new value
 */
function update(filename, table, params, values) {
    let DB = require('better-sqlite3')(path.normalize(`${PATH}/${filename}`));
    try {
        DB.prepare(`UPDATE ${table} SET ${parseObject(values).string} WHERE ${parseObject(params).string}`).run();
        return {
            code: 0,
            msg: ""
        }
    } catch (error) {
        return {
            code: -1,
            msg: error
        }
    }
}

module.exports = {
    select,
    insert,
    delect,
    update,
    selectAll,
    getCount
}