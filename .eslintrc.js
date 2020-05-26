module.exports = {
	root: true,
	parserOptions: {
		ecmaVersion: 6
	},
	env: {
		node: true
	},
	extends: ["plugin:prettier/recommended", "prettier"],

	rules: {
		"prettier/prettier": "warn",
		"no-console": "off",
		"no-debugger": "off",
		"no-unused-vars": "warn",
		indent: [0, "tab"],
		"no-tabs": 0,
		"array-element-newline": ["warn", "consistent"]
	},
	parser: "babel-eslint"
};
