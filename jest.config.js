module.exports = {
  setupFilesAfterEnv: ['<rootDir>/setupTests.js'],
  testEnvironment: 'jsdom',
  transformIgnorePatterns: ['node_modules/(?!(@hexlet/react-todo-app-with-backend)/)'],
};
