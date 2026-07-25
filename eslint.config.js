// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
  },
  {
    rules: {
      // These SDK 54 native modules resolve correctly at runtime and in TypeScript,
      // but the Expo flat-config resolver does not discover their package entry points.
      'import/no-unresolved': ['error', { ignore: ['^expo-location$', '^react-native-maps$'] }],
    },
  },
]);
