'use strict';
const Path = require('path');
const Webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const ExtractSASS = new MiniCssExtractPlugin({filename:'./[name].css'});
const CopyWebpackPlugin = require('copy-webpack-plugin');
const BrowserSyncPlugin = require('browser-sync-webpack-plugin');
//const webpack = require('webpack');

const pages = require('./src/pages');
let renderedPages = [];
for (let i = 0; i < pages.length; i++) {
    let page = Object.assign({}, pages[i]);
    renderedPages.push(
        new HtmlWebpackPlugin({
            template: page.template,
            filename: page.output,
            title: page.content.title,
            heading_icon: page.content.heading_icon,
            description: page.content.description
        })
    );
}

module.exports = (options) => {
    const dest = Path.join(__dirname, 'html-boilerplate');

    let webpackConfig = {
        mode: 'none',
        devtool: options.devtool,
        entry: {
            main: './src/app.js',
            toastr: './src/scripts-init/toastr.js',
            scrollbar: './src/scripts-init/scrollbar.js',
            oidcbinding: './src/scripts-init/oidcbinding.js',
        },
        output: {
            path: dest,
            filename: './static/assets/scripts/[name].js',
            assetModuleFilename: 'static/assets/[hash][ext][query]'
        },
        plugins: [
            new Webpack.ProvidePlugin({
                $: 'jquery',
                jQuery: 'jquery',
                'window.jQuery': 'jquery',
                Tether: 'tether',
                'window.Tether': 'tether',
                Popper: ['popper.js', 'default'],
            }),
            new CopyWebpackPlugin({
              patterns: [
                { from: './src/assets/images', to: './static/assets/images' }
              ]
            }),
            new Webpack.DefinePlugin({
                'process.env': {
                    NODE_ENV: JSON.stringify(options.isProduction ? 'production' : 'development')
                }
            })
        ],
        module: {
            rules: [
                {
                    test: /\.js$/,
                    exclude: /node_modules/,
                    loader: 'babel-loader'
                },
                {
                    test: /\.hbs$/,
                    loader: 'handlebars-loader',
                    options: {
                        helperDirs: [
                            Path.join(__dirname, 'src', 'helpers')
                        ],
                        partialDirs: [
                            Path.join(__dirname, 'src', 'layout'),
                            Path.join(__dirname, 'src', 'DemoPages'),
                        ]
                    }
                },
                {
                    test: /\.(woff|woff2|eot|ttf|otf)$/i,
                    type: 'asset/resource',
                },
                {
                    test: /\.(png|svg|jpg|jpeg|gif)$/i,
                    type: 'asset/resource',
                }
            ]
        }
    };

    if (options.isProduction) {
        webpackConfig.entry = [
            './src/app.js',
            './src/scripts-init/toastr.js',
            './src/scripts-init/scrollbar.js',
            './src/scripts-init/oidcbinding.js',

        ];

        webpackConfig.plugins.push(
            ExtractSASS,
            new CleanWebpackPlugin()
        );

        webpackConfig.module.rules.push({
            test: /\.scss$/i,
            use: [ExtractSASS.loader, 'css-loader', 'sass-loader']
        }, {
            test: /\.css$/i,
            use: [ExtractSASS.loader, 'css-loader']
        });

    } else {
        webpackConfig.plugins.push(
            new Webpack.HotModuleReplacementPlugin()
        );

        webpackConfig.module.rules.push({
            test: /\.scss$/i,
            use: ['style-loader', 'css-loader', 'sass-loader']
        }, {
            test: /\.css$/i,
            use: ['style-loader', 'css-loader']
        },
        );

        webpackConfig.devServer = {
            port: options.port,
            historyApiFallback: true,
            hot: !options.isProduction,
        };

        webpackConfig.plugins.push(
            new BrowserSyncPlugin({
                host: 'localhost',
                port: 3002,
                files: ["public/**/*.*"],
                browser: "google chrome",
                reloadDelay: 1000,
            }, {
                reload: false
            })
        );

    }

    webpackConfig.plugins = webpackConfig.plugins.concat(renderedPages);

    return webpackConfig;

};