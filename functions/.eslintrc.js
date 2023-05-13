module.exports = {
  root: true,
  env: {
    "es6": true,
    "node": true,
    "jest/globals": true,
  },
  extends: [
    "eslint:recommended",
    "plugin:import/errors",
    "plugin:import/warnings",
    "plugin:import/typescript",
    "google",
    "plugin:@typescript-eslint/recommended",
    "plugin:jest/recommended",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: ["tsconfig.eslint.json", "tsconfig.dev.json"],
    sourceType: "module",
  },
  ignorePatterns: [
    "/lib/**/*", // Ignore built files.
    "jest.config.js", // Ignore jest
  ],
  plugins: [
    "@typescript-eslint",
    "import",
    "jest",
  ],
  rules: {
    "quotes": ["error", "double"],
    "import/no-unresolved": 0,
    "linebreak-style": 0,
    "require-jsdoc": 0,
    "max-len": ["error", { "code": 120 }],
    "object-curly-spacing": ["error", "always"],
  },
};
