/**
 * Host App — Webpack config.
 *
 * ROLE: Module Federation HOST (the shell / container).
 *
 * The host owns:
 *   - AppShell (Header + Sidebar + layout)
 *   - Redux store (Provider wraps everything — remotes inherit it)
 *   - WebSocket service (connects once, all remotes see live updates)
 *   - Routing (React Router — remotes don't need their own router)
 *
 * HOW remotes are declared:
 *   remotes: {
 *     dashboardApp: 'dashboardApp@http://localhost:3001/remoteEntry.js',
 *   }
 *   The string format is: '<name>@<remoteEntry URL>'
 *   - '<name>' must match the remote's `name` in its ModuleFederationPlugin.
 *   - The URL is where the remote's dev server (or CDN) serves remoteEntry.js.
 *
 * GRACEFUL DEGRADATION:
 *   If a remote is not running, the dynamic import in routes/index.tsx
 *   catches the error and falls back to the local copy of the page.
 *   Users see no error — they just get the bundled fallback version.
 *
 * SHARED SINGLETONS:
 *   `eager: true` on the host ensures React, ReactDOM, etc. are bundled
 *   into the HOST's main chunk (not deferred). When a remote loads, it
 *   finds these already in the global module registry and reuses them.
 *   Without `eager: true` on the host, you can get "Shared module is not
 *   available for eager consumption" errors.
 */
import path                 from 'path';
import webpack              from 'webpack';
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
      'axios': path.resolve(__dirname, '../../node_modules/axios'),
    },
  },

  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: {
          loader:  'ts-loader',
          options: { transpileOnly: true },
        },
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: [
          isDev ? 'style-loader' : MiniCssExtractPlugin.loader,
          'css-loader',
        ],
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif|ico)$/i,
        type: 'asset/resource',
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: 'asset/resource',
      },
    ],
  },

  plugins: [
    new ModuleFederationPlugin({
      name: 'host',

      /**
       * Remotes — where to find each remote's entry manifest.
       *
       * Format: '<federationName>@<url>'
       *   - 'dashboardApp' must match the `name` in dashboard's MF config
       *   - 'analyticsApp' must match the `name` in analytics' MF config
       *
       * In production CI, these URLs come from environment variables:
       *   `dashboardApp@${process.env.DASHBOARD_REMOTE_URL}/remoteEntry.js`
       *
       * For local development, use localhost port numbers.
       * For production, use CDN URLs (e.g. https://dashboard.cdn.example.com).
       */
      remotes: {
        dashboardApp: 'dashboardApp@http://localhost:3001/remoteEntry.js',
        analyticsApp: 'analyticsApp@http://localhost:3002/remoteEntry.js',
      },

      /**
       * Shared — libraries loaded ONCE and reused by all remotes.
       *
       * `eager: true` on host side ONLY:
       *   Bundles these into the host's initial chunk so they are available
       *   synchronously before any remote tries to consume them.
       *   If you set eager on the remote too, you can get duplicate bundles.
       *
       * `singleton: true`:
       *   If version ranges are incompatible, MF uses the higher version
       *   rather than loading two copies. React MUST be singleton.
       */
      shared: {
        react: {
          singleton:       true,
          requiredVersion: '^18.0.0',
          eager:           true,
        },
        'react-dom': {
          singleton:       true,
          requiredVersion: '^18.0.0',
          eager:           true,
        },
        'react-redux': {
          singleton:       true,
          requiredVersion: '^9.0.0',
          eager:           true,
        },
        '@reduxjs/toolkit': {
          singleton:       true,
          requiredVersion: '^2.0.0',
          eager:           true,
        },
        'react-router-dom': {
          singleton:       true,
          requiredVersion: '^7.0.0',
          eager:           true,
        },
      },
    }),

    new HtmlWebpackPlugin({
      template: './public/index.html',
    }),
    ...(isDev ? [] : [new MiniCssExtractPlugin({ filename: '[name].[contenthash].css' })]),
  ],

  devServer: {
    port:               3000,
    historyApiFallback: true,
    hot:                true,
    open:               true,
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
  },

  optimization: {
    splitChunks: {
      chunks: 'all',
    },
  },
};

export default config;
