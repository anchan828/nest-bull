// eslint-disable-next-line @typescript-eslint/no-var-requires
const prettierRc = require("./.prettierrc");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require("path");
module.exports = {
  env: {
    node: true,
    jest: true,
  },
  extends: ["plugin:@typescript-eslint/recommended", "plugin:prettier/recommended", "prettier/@typescript-eslint"],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    sourceType: "module",
    project: path.resolve(__dirname, "tsconfig.eslint.json"),
  },
  plugins: ["@typescript-eslint"],
  rules: {
    "@typescript-eslint/ban-types": "off",
    "prettier/prettier": ["error", prettierRc],
    "no-unused-vars": "off",
    "@typescript-eslint/no-unused-vars": "error",
    "no-useless-constructor": "off",
    "@typescript-eslint/no-useless-constructor": "error",
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-non-null-assertion": "off",
    "lines-between-class-members": ["error", "always"],
  },
};
