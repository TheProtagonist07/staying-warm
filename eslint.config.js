import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import prettier from 'eslint-config-prettier'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  // Files ESLint should never look at (build output, dependencies, bundled assets).
  globalIgnores(['node_modules', 'dist', 'build', 'third_party', 'public', 'marketing']),
  {
    files: ['**/*.{ts,js}'],
    extends: [js.configs.recommended, tseslint.configs.recommended],
    languageOptions: { globals: { ...globals.browser } },
    rules: {
      eqeqeq: ['error', 'always'],
      'prefer-const': 'error',
      'no-var': 'error',
      curly: ['error', 'multi-line'],
      'no-console': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
  // Config files run in Node, not the browser.
  { files: ['*.config.{js,ts}'], languageOptions: { globals: { ...globals.node } } },
  // Must be last: switches off any rule that would fight Prettier over formatting.
  prettier,
])
