import js from '@eslint/js'
import globals from 'globals'
import tsPlugin from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import vuePlugin from 'eslint-plugin-vue'
import vueParser from 'vue-eslint-parser'

const sharedRules = {
  ...js.configs.recommended.rules,
  '@typescript-eslint/no-unused-vars': ['error', {
    argsIgnorePattern: '^_',
    destructuredArrayIgnorePattern: '^_',
    caughtErrorsIgnorePattern: '^_',
  }],
  '@typescript-eslint/no-explicit-any': 'warn',
  'prefer-const': 'error',
  'no-var': 'error',
  'no-console': 'off',
  'no-duplicate-imports': 'error',
  'no-undef': 'off',
  'no-empty': ['error', { allowEmptyCatch: true }],
  'no-unused-vars': 'off',
  'vue/multi-word-component-names': 'off',
  'vue/no-v-html': 'off',
  'vue/require-default-prop': 'off',
  'vue/no-unused-components': 'warn',
  'vue/no-unused-vars': 'warn',
}

export default [
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      '*.js',
      '*.cjs',
      '*.mjs',
    ],
  },
  {
    files: ['src/**/*.{ts,tsx,vue}'],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: tsParser,
        ecmaVersion: 2022,
        sourceType: 'module',
        extraFileExtensions: ['.vue'],
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      vue: vuePlugin,
    },
    rules: sharedRules,
  },
  {
    files: ['src/**/*.vue'],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: tsParser,
        ecmaVersion: 2022,
        sourceType: 'module',
        extraFileExtensions: ['.vue'],
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      vue: vuePlugin,
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^(props|emit|context|slots|attrs)$',
        destructuredArrayIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
      }],
      'no-unused-vars': 'off',
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },
]
