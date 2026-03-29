/**
 * Dashboard Remote — Webpack config.
 *
 * ROLE: Module Federation REMOTE.
 *
 * This app serves two purposes simultaneously:
 *   1. Standalone dev server (localhost:3001) — run it alone to develop
 *      the Dashboard page in isolation without the host shell.
 *   2. Remote module — when the host loads at localhost:3000, it fetches
 *      remoteEntry.js from here and mounts the Dashboard page inside
 *      the host's AppShell + Provider.
 *
 * HOW ModuleFederationPlugin works here:
 *   - `name: 'dashboardApp'` — this string is what the HOST uses in its
 *     `remotes` config to reference this app.
 *   - `filename: 'remoteEntry.js'` — the manifest file the host fetches
 *     first. It lists all exposed modules and their chunk hashes.
 *   - `exposes` — what this app makes available to consumers.
 *     './Page' maps to the Dashboard page component.
 *   - `shared` — libraries NOT bundled into this remote's chunks.
 *     Instead, the host's already-loaded copy is reused (singleton).
 *     WHY singleton: React uses module-level state for hooks. Two copies
 *     = two contexts = "Invalid hook call" errors.
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
    /**
     * publicPath: 'auto' — Webpack infers the base URL from the script tag
     * that loaded the bundle. This means chunk requests go to the same origin
     * as remoteEntry.js, which is exactly what we want.
     *
     * In production CI, override with the CDN URL:
     *   publicPath: 'https://dashboard.cdn.example.com/'
     */
    publicPath: 'auto',
    clean:      true,
  },

  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.jsx'],
    alias: {
      '@':    path.resolve(__dirname, 'src'),
      'axios': path.resolve(__dirname, '../../node_modules/axios'),
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
      name:     'dashboardApp',
      filename: 'remoteEntry.js',

      /**
       * Exposes the Dashboard page as './Page'.
       * The host imports it as: import('dashboardApp/Page')
       * Webpack resolves 'dashboardApp' via the host's `remotes` config,
       * then fetches remoteEntry.js to find the './Page' chunk hash.
       */
      exposes: {
        './Page': './src/pages/Dashboard/index',
      },

      /**
       * Shared dependencies — NOT bundled into this remote's chunks.
       * When the host loads this remote, MF checks its shared scope.
       * If the host already loaded react@18.3.1, this remote reuses it.
       * No second download, no second copy in memory.
       *
       * ── No eager: true here ───────────────────────────────────────────
       * The host sets eager. Remotes must NOT — they sit behind an async
       * boundary (index.ts → import('./bootstrap')). The async gap is what
       * gives MF time to negotiate the shared scope before any module code
       * runs. If a remote sets eager too, it bundles a second copy into its
       * own initial chunk, defeating the whole point of sharing.
       *
       * ── strictVersion: true ───────────────────────────────────────────
       * Same setting as host — if the negotiated version falls outside this
       * range, throw immediately rather than running with a mismatched copy.
       * Matches the version declared in this package's package.json exactly.
       */
      shared: {
        react: {
          singleton:       true,
          strictVersion:   true,
          requiredVersion: '^18.3.1',
        },
        'react-dom': {
          singleton:       true,
          strictVersion:   true,
          requiredVersion: '^18.3.1',
        },
        'react-redux': {
          singleton:       true,
          strictVersion:   true,
          requiredVersion: '^9.1.2',
        },
        '@reduxjs/toolkit': {
          singleton:       true,
          strictVersion:   true,
          requiredVersion: '^2.3.0',
        },
        'react-router-dom': {
          singleton:       true,
          strictVersion:   true,
          requiredVersion: '^7.1.5',
        },
      },
    }),

    new HtmlWebpackPlugin({ template: './public/index.html' }),
    ...(isDev ? [] : [new MiniCssExtractPlugin({ filename: '[name].[contenthash].css' })]),
  ],

  devServer: {
    port:               3001,
    historyApiFallback: true,
    hot:                true,
    headers: {
      /**
       * CORS header required for cross-origin Module Federation.
       * The host at localhost:3000 fetches remoteEntry.js from localhost:3001.
       * Without this header the browser blocks the request.
       */
      'Access-Control-Allow-Origin': '*',
    },
  },
};

export default config;
