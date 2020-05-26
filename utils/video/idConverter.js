const table = "fZodR9XQDSUm21yCkr6zBqiveYah8bt4xsWpHnJE7jL5VG3guMTKNPAwcF";
let tr = {};

for (let i = 0; i < 58; ++i) {
	tr[table[i]] = i;
}

let s = [11, 10, 3, 8, 4, 6, 2, 9, 5, 7];
let xor = 177451812;
let add = 8728348608;

module.exports = {
	/**
	 *
	 * @param {String} x
	 */
	bv2av: x => {
		if (!x.startsWith(/bv/i)) return x;
		let r = 0;
		for (let i = 0; i < 6; ++i) {
			r += tr[x[s[i]]] * 58 ** i;
		}
		return String((r - add) ^ xor);
	},
	/**
	 *
	 * @param {String|Number} x
	 */

	av2bv: x => {
		if (x.startsWith(/av/i)) x = x.replace(/av/i, "");
		let x_ = (x ^ xor) + add;
		let r = ["B", "V", "1", , , "4", , "1", , "7"];

		for (let i = 0; i < 6; ++i) {
			r[s[i]] = table[Math.floor(x_ / 58 ** i) % 58];
		}
		return r.join("");
	}
};
