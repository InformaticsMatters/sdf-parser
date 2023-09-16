// This is a patch so that eslint will load the plugins as dependencies.
// Otherwise we can to install EVERYTHING in th root project
require("@rushstack/eslint-patch/modern-module-resolution");

/**
 * @type {import("eslint").Linter.Config}
 */
module.exports = {
  parserOptions: {
    project: "tsconfig.json",
    tsconfigRootDir: __dirname,
  },
  extends: ["@squonk/eslint-config"],
};
