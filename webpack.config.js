const path = require('path');
const webpack = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');
module.exports = {
    entry: './src/lambda.ts',
    target: 'node',
    mode: 'production',
    resolve: {
        extensions: ['.ts', '.js'],
        alias: {
            // 用空模块替换缺失的可选依赖
            '@nestjs/websockets/socket-module': false,
            '@nestjs/microservices/microservices-module': false,
            '@nestjs/microservices': false,
            '@nestjs/websockets': false,
            'cache-manager': false,
        },
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
        ],
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'lambda.js',
        libraryTarget: 'commonjs2',
    },
    plugins: [
        new CopyWebpackPlugin({
            patterns: [
                // 复制整个 .prisma 目录
                {
                    from: path.resolve(__dirname, 'node_modules/.prisma'),
                    to: path.resolve(__dirname, 'dist/node_modules/.prisma'),
                    noErrorOnMissing: false, // 如果缺失就报错
                    info: { minimized: true }, // 显示复制信息
                },
                // 复制整个 @prisma/client 目录
                {
                    from: path.resolve(__dirname, 'node_modules/@prisma/client'),
                    to: path.resolve(__dirname, 'dist/node_modules/@prisma/client'),
                    noErrorOnMissing: false,
                    info: { minimized: true },
                },
                // 复制 package.json
                {
                    from: path.resolve(__dirname, 'package.json'),
                    to: path.resolve(__dirname, 'dist/package.json'),
                    noErrorOnMissing: false,
                },
                // 复制 schema.prisma （如果存在）
                {
                    from: path.resolve(__dirname, 'prisma/schema.prisma'),
                    to: path.resolve(__dirname, 'dist/prisma/schema.prisma'),
                    noErrorOnMissing: true, // schema 可以不存在
                },
            ],
        }),
        // 忽略可选依赖
        new webpack.IgnorePlugin({
            resourceRegExp: /@nestjs\/websockets/,
        }),
        new webpack.IgnorePlugin({
            resourceRegExp: /@nestjs\/microservices/,
        }),
        new webpack.IgnorePlugin({
            resourceRegExp: /cache-manager/,
        }),
        // 忽略其他不需要的依赖
        new webpack.IgnorePlugin({
            resourceRegExp: /^pg-native$/,
        }),
        new webpack.IgnorePlugin({
            resourceRegExp: /^@mapbox\/node-pre-gyp$/,
        }),
        // 定义环境变量
        new webpack.DefinePlugin({
            'process.env.NODE_ENV': JSON.stringify('production'),
        }),
    ],
    externals: [
        '@prisma/client',
    ],
    ignoreWarnings: [
        /Critical dependency: the request of a dependency is an expression/,
        /Module not found: Error: Can't resolve/,
        /Can't resolve '@nestjs\/websockets'/,
        /Can't resolve '@nestjs\/microservices'/,
    ],
};