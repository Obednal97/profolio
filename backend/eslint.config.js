const js = require('@eslint/js');
const tseslint = require('typescript-eslint');
const prettierConfig = require('eslint-config-prettier');
const globals = require('globals');

module.exports = tseslint.config(
  // Ignore patterns
  {
    ignores: ['dist/**', 'node_modules/**', 'coverage/**', '*.js', '!eslint.config.js'],
  },
  
  // Base JavaScript config
  js.configs.recommended,
  
  // TypeScript configs
  ...tseslint.configs.recommended,
  
  // Prettier config to disable conflicting rules
  prettierConfig,
  
  // Main configuration for TypeScript files
  {
    files: ['src/**/*.ts'],
    
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      parser: tseslint.parser,
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: __dirname,
      },
    },
    
    plugins: {
      '@typescript-eslint': tseslint.plugin,
    },
    
    rules: {
      // Critical errors - ZERO any types allowed!
      '@typescript-eslint/no-explicit-any': 'error', // We achieved zero any types!
      
      // Unused variables - warn but don't error
      '@typescript-eslint/no-unused-vars': ['warn', { 
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        ignoreRestSiblings: true 
      }],
      
      // Style preferences (off or warn only)
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-empty-function': 'warn',
      '@typescript-eslint/no-inferrable-types': 'warn',
      
      // Allow TypeScript comments with description
      '@typescript-eslint/ban-ts-comment': ['warn', {
        'ts-expect-error': 'allow-with-description',
        'ts-ignore': 'allow-with-description',
        'ts-nocheck': 'allow-with-description',
      }],
      
      // Turn off base rule in favor of TypeScript version
      'no-unused-vars': 'off',
    },
  },
  
  // Special rules for test files
  {
    files: ['**/*.spec.ts', '**/*.test.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off', // Allow any in tests
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
    },
  },
  
  // Config files can use CommonJS
  {
    files: ['*.js'],
    languageOptions: {
      sourceType: 'commonjs',
    },
  },
);