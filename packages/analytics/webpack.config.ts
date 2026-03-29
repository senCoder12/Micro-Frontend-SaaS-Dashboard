/**
 * Analytics Remote — Webpack config.
 *
 * ROLE: Module Federation REMOTE.
 *
 * This app is intentionally self-contained: no Redux, no react-router.
 * The Analytics page manages its own data (1,000 mock sessions) locally.
 *
 * Two purposes:
 *   1. Standalone dev at localhost:3002 — develop DataGrid in isolation
 *   2. Remote module — host mounts the Analytics page via remoteEntry.js
 *
 * WHY only share react + react-dom (not react-redux):
 *   Analytics doesn't use Redux at all. Including react-redux in shared
 *   would list it as a peer dependency without a real use — misleading.
 *   Only declare what you actually share.
 */
import path           from 'path';
import webpack        from 'webpack';
import HtmlWebpackPlugin    from 'html-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import type { Configuration }           from 'webpack';
import type { Configuration as DevServerConfiguration } from 'webpack-dev-server';

const { ModuleFederationPlugin } = webpack.container;

const isDev = process.env.NODE_ENV !== 'production';

const config: Configuration & { devServer?: DevServerConfiguration } = {
  entry: './src/index.ts',

  output: {
    path:       path.resolve(__dirname, 'dist'),
    filename:   isDev ? '[name].js' : '[name].[contenthash].js',
    publicPath: 'auto',
    clean:      true,
  },

  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.jsx'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },

  module: {
    rules: [
      {
        test:    /\.tsx?$/,
        use:     { loader: 'ts-loader', options: { transpileOnly: true } },
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: [
          isDev ? 'style-loader' : MiniCssExtractPlugin.loader,
          'css-loader',
        ],
      },
    ],
  },

  plugins: [
    new ModuleFederationPlugin({
      name:     'analyticsApp',
      filename: 'remoteEntry.js',

      exposes: {
        './Page': './src/pages/Analytics/index',
      },

      shared: {
        react: {
          singleton:       true,
          requiredVersion: '^18.0.0',
        },
        'react-dom': {
          singleton:       true,
          requiredVersion: '^18.0.0',
        },
      },
    }),

    new HtmlWebpackPlugin({ template: './public/index.html' }),
    ...(isDev ? [] : [new MiniCssExtractPlugin({ filename: '[name].[contenthash].css' })]),
  ],

  devServer: {
    port:               3002,
    historyApiFallback: true,
    hot:                true,
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
  },
};

export default config;
