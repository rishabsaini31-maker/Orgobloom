const path = require('path');

const projectRoot = __dirname;
const tsConfigPath = path.join(projectRoot, 'tsconfig.json');

console.log('[Loader] Loading tsconfig-paths with explicit config');
console.log('[Loader] Project root:', projectRoot);
console.log('[Loader] TsConfig path:', tsConfigPath);

// Load and parse tsconfig.json directly
let tsConfig;
try {
  tsConfig = require(tsConfigPath);
  console.log('[Loader] Loaded tsconfig.json successfully');
} catch (e) {
  console.log('[Loader] Error loading tsconfig.json:', e.message);
  tsConfig = { compilerOptions: { baseUrl: projectRoot, paths: {} } };
}

// Explicitly register with tsconfig-paths
const { register } = require('tsconfig-paths');

const result = register({
  baseUrl: projectRoot,
  paths: tsConfig.compilerOptions?.paths || {
    '@/*': ['src/*'],
    '@/db/*': ['src/db/*'],
    '@/middleware/*': ['src/middleware/*'],
    '@/routes/*': ['src/routes/*'],
    '@/utils/*': ['src/utils/*'],
    '@/services/*': ['src/services/*'],
    '@/types/*': ['src/types/*']
  }
});

console.log('[Loader] tsconfig-paths registered');
