module.exports = {
  env: {
    node: true,
    es2021: true,
    jest: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:node/recommended',
    'prettier'
  ],
  plugins: ['node'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    'no-console': 'warn',
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'node/no-unpublished-require': 'off',
    'node/no-missing-require': 'off',
    'node/no-unsupported-features/es-syntax': 'off'
  },
  ignorePatterns: [
    'node_modules/',
    'dist/',
    'coverage/'
  ]
};