module.exports = {
  preset: "ts-jest",
  rootDir: ".",
  coverageDirectory: "../coverage",
  coverageReporters: ["text-summary", "json-summary", "lcov", "text", "clover"],
  testEnvironment: "node",
  setupFilesAfterEnv: ["../../jest.setup.js"],
  verbose: true,
};
