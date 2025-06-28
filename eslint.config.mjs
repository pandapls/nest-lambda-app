// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [      // ESLint 和配置文件
      'eslint.config.mjs',

      // 构建输出目录
      'dist/**/*',
      'coverage/**/*',

      // AWS SAM 相关
      'sam.yaml',
      '.aws-sam/**/*',

      // 构建工具配置
      'webpack.config.js',
      'webpack.config.ts',

      // 依赖目录
      'node_modules/**/*',

      // Prisma 生成文件
      'prisma/generated/**/*',

      // 类型声明文件
      '**/*.d.ts',

      // 日志和临时文件
      '*.log',
      '.env*',

      // 部署包
      '*.zip',
      'lambda-package.zip',
      '**/empty-module.js'
    ],

  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  eslintPluginPrettierRecommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: 'commonjs',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      '@typescript-eslint/no-misused-promises': 'warn', // 降级为警告
      '@typescript-eslint/no-unsafe-assignment': 'warn', // 降级为警告
    },
  },
);