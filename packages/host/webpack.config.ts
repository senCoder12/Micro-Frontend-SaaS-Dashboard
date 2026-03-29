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

/**
 * Remote origin URLs — configurable via environment variables.
 *
 * WHY environment variables (not hardcoded):
 *   The same webpack config runs in three environments:
 *     - Local dev:    DASHBOARD_REMOTE_URL not set → defaults to localhost:3001
 *     - Staging CI:   DASHBOARD_REMOTE_URL=https://staging-dashboard.cdn.example.com
 *     - Production:   DASHBOARD_REMOTE_URL=https://dashboard.cdn.example.com
 *
 *   One config file, zero conditional logic, zero manual edits per environment.
 *   The CI pipeline sets the env var before running `webpack --mode production`.
 *
 * These values are injected into the browser bundle by DefinePlugin (below),
 * making them available as constants in src/config/remoteStatus.ts.
 */
const DASHBOARD_REMOTE_URL = process.env['DASHBOARD_REMOTE_URL'] ?? 'http://localhost:3001';
const ANALYTICS_REMOTE_URL = process.env['ANALYTICS_REMOTE_URL'] ?? 'http://localhost:3002';

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
        dashboardApp: `dashboardApp@${DASHBOARD_REMOTE_URL}/remoteEntry.js`,
        analyticsApp: `analyticsApp@${ANALYTICS_REMOTE_URL}/remoteEntry.js`,
      },

      /**
       * Shared — libraries loaded ONCE and reused by all remotes.
       *
       * ── eager: true (HOST ONLY) ────────────────────────────────────────
       * Bundles these into the host's initial chunk so they are available
       * synchronously before any remote tries to consume them.
       * Do NOT set eager on remotes — they sit behind the async boundary
       * (index.ts → import('./bootstrap')) so MF can negotiate the shared
       * scope before any module code runs.
       *
       * ── singleton: true ───────────────────────────────────────────────
       * Tells MF: load exactly one copy, shared by everyone.
       * React MUST be a singleton — React uses module-level globals for the
       * current fiber, current dispatcher, and hook state. Two copies = two
       * independent hook states = "Invalid hook call" errors at runtime.
       * Same applies to react-redux (Context) and react-router-dom (Router).
       *
       * ── strictVersion: true ───────────────────────────────────────────
       * Without this: version mismatch → MF silently uses the higher version
       * and logs a console warning you might never see in production.
       * With this: version mismatch → MF throws immediately at module init.
       * For React / Redux, silent mismatch can cause subtle corruption.
       * Better to fail loudly in dev than break silently in production.
       *
       * ── requiredVersion: match package.json exactly ───────────────────
       * These ranges come directly from each package's package.json.
       * MF reads the installed package's `version` field at runtime and
       * checks it against requiredVersion. If the ranges drift apart
       * (e.g. host needs ^18.3 but remote needs ^18.0) MF picks one copy
       * and the other side may get an API it didn't expect.
       * Keeping ranges in sync across all packages prevents this.
       */
      shared: {
        react: {
          singleton:       true,
          strictVersion:   true,
          requiredVersion: '^18.3.1',
          eager:           true,
        },
        'react-dom': {
          singleton:       true,
          strictVersion:   true,
          requiredVersion: '^18.3.1',
          eager:           true,
        },
        'react-redux': {
          singleton:       true,
          strictVersion:   true,
          requiredVersion: '^9.1.2',
          eager:           true,
        },
        '@reduxjs/toolkit': {
          singleton:       true,
          strictVersion:   true,
          requiredVersion: '^2.3.0',
          eager:           true,
        },
        'react-router-dom': {
          singleton:       true,
          strictVersion:   true,
          requiredVersion: '^7.1.5',
          eager:           true,
        },
      },
    }),

    /**
     * DefinePlugin — injects build-time constants into the browser bundle.
     *
     * These become compile-time string literals (not runtime variables).
     * remoteStatus.ts uses `declare const DASHBOARD_REMOTE_URL: string`
     * to tell TypeScript "this will exist at runtime, Webpack puts it there."
     *
     * JSON.stringify wraps the value in quotes so the result in the bundle is:
     *   var DASHBOARD_REMOTE_URL = "http://localhost:3001"   ← string literal
     * Without JSON.stringify it would be:
     *   var DASHBOARD_REMOTE_URL = http://localhost:3001     ← syntax error
     */
    new webpack.DefinePlugin({
      DASHBOARD_REMOTE_URL: JSON.stringify(DASHBOARD_REMOTE_URL),
      ANALYTICS_REMOTE_URL: JSON.stringify(ANALYTICS_REMOTE_URL),
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
