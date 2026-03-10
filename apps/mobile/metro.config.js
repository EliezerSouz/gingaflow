const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// 1. Watch all files within the monorepo
config.watchFolders = [workspaceRoot];

// 2. Resolve modules from both local and workspace node_modules
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// 3. Essential for pnpm symlinks: explicitly map problem modules
config.resolver.extraNodeModules = new Proxy({}, {
  get: (target, name) => {
    if (target[name]) return target[name];
    return path.join(projectRoot, `node_modules/${name}`);
  }
});

module.exports = config;
