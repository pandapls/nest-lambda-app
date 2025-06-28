const path = require('path');
const webpack = require('webpack');

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
    ],
    ignoreWarnings: [
        /Critical dependency: the request of a dependency is an expression/,
        /Module not found: Error: Can't resolve/,
        /Can't resolve '@nestjs\/websockets'/,
        /Can't resolve '@nestjs\/microservices'/,
    ],
};