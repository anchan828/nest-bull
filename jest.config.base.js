module.exports = {
  preset: "ts-jest",
  rootDir: "src",
  coverageDirectory: "../coverage",
  coverageReporters: ["text-summary", "json-summary", "lcov", "text", "clover"],
  testEnvironment: "node",
  setupFilesAfterEnv: ["../../../jest.setup.js"],
  verbose: true,
};
