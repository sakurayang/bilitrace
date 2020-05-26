const path = require("path");
const fs = require("fs");
const config = require("../config");
const g_data_path = config.data_path;

/**
 * @param {String} file
 * @return {JSON}
 */
async function File2Json(file) {
	let data = await fs.readFileSync(path.join(g_data_path, file), {
		encoding: "utf-8",
		flag: "r"
	});
	data = JSON.parse(data);
	return data;
}

/**
 * @param {String} file
 * @param {JSON} data
 * @return {JSON}
 */
function Json2File(file, data) {
	fs.writeFile(
		path.join(g_data_path, file),
		JSON.stringify(data),
		{
			encoding: "utf-8",
			flag: "w"
		},
		err => console.log(err)
	);
}

module.exports = {
	File2Json,
	Json2File
};
