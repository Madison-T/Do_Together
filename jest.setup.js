// Patch to prevent TypeError from jest-expo setup
if (typeof global.navigator !== 'object') {
  global.navigator = {};
}
