const config = require("../config");
const path = require("path");
const g_data_path = config.data_path;
const debug = config.debug;
const logger = require("./logger").getLogger("database");
const getKnexOptions = filename => {
	return {
		client: "sqlite3",
		useNullAsDefault: true,
		connection: async () => ({
			filename: path.join(g_data_path, filename),
		}),
		log: {
			warn: message => logger.warn(message),
			error: message => logger.error(message),
			deprecate: message => logger.mark(message),
			debug: message => logger.debug(message),
		},
		debug,
	};
};

function parseObject(obj) {
	let keys = Object.keys(obj);
	let values = Object.values(obj);
	let transfrom = [];
	let isArray = Array.isArray(obj);

	for (const key in obj) {
		isArray
			? (transfrom[key] = obj[key])
			: transfrom.push(`${key}=${obj[key]}`);
	}
	return {
		keys,
		values,
		length: keys.length,
		transfrom,
		sql_string: transfrom.toString().replace(",", " and "),
	};
}

/**
 *
 * @param {String} filename
 * @param {String} table
 * @param {JSON[]} params
 * @return {JSON}
 */
async function select(filename, table, params = [], limit = 1, offset = -1) {
	if (debug)
		logger.info(
			`[select] [${filename} - ${table}] params: ${JSON.stringify(
				params
			)}, limit: ${limit}, offset: ${offset}`
		);
	const knex = require("knex")(getKnexOptions(filename));
	try {
		let last_num = (await getCount(filename, table, params)).result;
		let result = await knex(table)
			.where(params)
			.select("*")
			.limit(limit)
			.offset(offset === -1 ? last_num - 1 : offset);
		return {
			code: 0,
			msg: "",
			result,
		};
	} catch (error) {
		logger.error(`[select] ${error}`);
		return {
			code: -1,
			msg: error,
		};
	}
}

/**
 *
 * @param {String} filename
 * @param {String} table
 * @param {JSON[]} params
 * @return {JSON}
 */
async function getCount(filename, table, params = []) {
	if (debug)
		logger.info(
			`[count] [${filename} - ${table}] params: ${JSON.stringify(params)}`
		);
	const knex = require("knex")(getKnexOptions(filename));
	try {
		let count = await (await knex(table).where(params).select("*")).length;
		return {
			code: 0,
			result: count,
		};
	} catch (error) {
		logger.error(`[getCount] ${error}`);
		return {
			code: -1,
			msg: error,
		};
	}
}

/**
 *
 * @param {String} filename
 * @param {String} table
 * @param {JSON[]} values
 */
async function insert(filename, table, values) {
	if (debug)
		logger.log(
			`[insert] [${filename} - ${table}] values: ${JSON.stringify(
				values
			)}`
		);
	const knex = require("knex")(getKnexOptions(filename));
	try {
		await knex(table).insert(values);
		return {
			code: 0,
			msg: "",
		};
	} catch (error) {
		logger.error(`[insert] ${error}`);
		return {
			code: -1,
			msg: error,
		};
	}
}

/**
 *
 * @param {String} filename
 * @param {String} table
 * @param {JSON} params
 */
// add "_" before function name cause delete is a kept word in js
function _delete(filename, table, params) {
	if (debug)
		logger.log(
			`[delete] [${filename} - ${table}] params: ${JSON.stringify(
				params
			)}`
		);
	const knex = require("knex")(getKnexOptions(filename));
	try {
		knex(table).where(parseObject(params).sql_string).delete();
		return {
			code: 0,
			msg: "",
		};
	} catch (error) {
		logger.error(`[delect] ${error}`);
		return {
			code: -1,
			msg: error,
		};
	}
}

/**
 *
 * @param {String} filename
 * @param {String} table
 * @param {JSON[]|JSON|[]} params where
 * @param {JSON} values new value
 */
function update(filename, table, params, values) {
	if (debug)
		logger.info(
			`[update] [${filename} - ${table}] from: ${JSON.stringify(
				params
			)}, to: ${JSON.stringify(values)}`
		);
	const knex = require("knex")(getKnexOptions(filename));
	try {
		knex(table).where(parseObject(params).sql_string).update(values);
		return {
			code: 0,
			msg: "",
		};
	} catch (error) {
		logger.error(`[update] ${error}`);
		return {
			code: -1,
			msg: error,
		};
	}
}

module.exports = {
	getCore: filename => require("knex")(getKnexOptions(filename)),
	select,
	insert,
	delete: _delete,
	update,
	getCount,
};
