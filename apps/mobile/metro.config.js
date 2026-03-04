const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Adicionar o root do monorepo ao watchFolders para o Metro resolver pacotes do pnpm workspace
config.watchFolders = [workspaceRoot];

// Adicionar os caminhos de node_modules corretos para resolução
config.resolver.nodeModulesPaths = [
    path.resolve(projectRoot, 'node_modules'),
    path.resolve(workspaceRoot, 'node_modules'),
];

module.exports = config;
