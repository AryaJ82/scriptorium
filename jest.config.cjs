module.exports = {
  clearMocks: true,
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  testEnvironment: "node",
  testMatch: ["<rootDir>/tests/**/*.test.cjs"],
  transform: {
    "^.+\\.tsx?$": "<rootDir>/tests/typescript-transformer.cjs",
  },
};
