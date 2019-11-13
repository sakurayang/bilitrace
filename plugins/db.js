const DB = require('better-sqlite3')(__dirname.replace("plugins", "") + 'schedule.db');

/**
 * 
 * @param {String} table 
 * @param {Number|String} id 
 */
async function SELECT(table, id) {
    if (!table || !id ||
        !(/[0-9]/.test(id)) ||
        typeof (table) != "string")
        throw new Error("Error Paramas");
    let result = await DB.prepare(`SELECT * FROM ${table} WHERE id=${id}`).get();

    return result;
}

/**
 * 
 * @param {String} table 
 * @param {JSON} value
 * @param {Number} value.id
 * @param {String} value.time 
 */
function INSERT(table, value) {
    if (!table || !value ||
        !(/[0-9]/ig.test(value.id)) ||
        !(/\*\/*[0-9]* \* \*\/*[0-9]* \* \*/ig).test(value.time) ||
        typeof (table) != "string")
        throw new Error("Error Paramas");
    DB.prepare(`INSERT INTO ${table} VALUES ("${value.id}","${value.time}")`).run();
}

/**
 * 
 * @param {String} table 
 * @param {Number|String} id 
 */
function DELETE(table, id) {
    if (!table || !id ||
        !(/[0-9]/.test(id)) ||
        typeof (table) != "string")
        throw new Error("Error Paramas");
    DB.prepare(`DELETE FROM ${table} WHERE id=${id}`).run();
}

/**
 * 
 * @param {String} table 
 * @param {Number|String} id 
 * @param {JSON} value
 * @param {Number} value.id
 * @param {String} value.time 
 */
function UPDATE(table, id, value) {
    if (!table || !value || !id ||
        !(/[0-9]/ig.test(id)) ||
        !(/\*\/*[0-9]* \* \*\/*[0-9]* \* \*/ig).test(value.time) ||
        typeof (table) != "string")
        throw new Error("Error Paramas");
    DB.prepare(`UPDATE ${table} SET time="${value.time}" WHERE id=${id}`).run();
}


module.exports = {
    SELECT: SELECT,
    INSERT: INSERT,
    DELETE: DELETE,
    UPDATE: UPDATE
}