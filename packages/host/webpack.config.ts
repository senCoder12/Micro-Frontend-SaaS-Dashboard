import path from 'path';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import type { Configuration } from 'webpack';
import type { Configuration as DevServerConfiguration } from 'webpack-dev-server';

const isDev = process.env.NODE_ENV !== 'production';

const config: Configuration & { devServer?: DevServerConfiguration } = {
  entry: './src/index.ts',

  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: isDev ? '[name].js' : '[name].[contenthash].js',
    publicPath: 'auto',
    clean: true,
  },

  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.jsx'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
      /**
       * Force all axios imports to resolve to the single root-level copy.
       * Without this, npm workspaces may resolve axios-mock-adapter's own
       * axios peer differently, giving Webpack two type-incompatible instances.
       */
      'axios': path.resolve(__dirname, '../../node_modules/axios'),
    },
  },

  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: {
          loader: 'ts-loader',
          options: {
            /**
             * transpileOnly: true — ts-loader skips type checking during bundling.
             * Type safety is enforced by the separate `npm run type-check` (tsc --noEmit).
             *
             * WHY this split (standard industry pattern, used by Next.js / CRA):
             *   - Webpack's job is BUNDLING, not type checking
             *   - ts-loader's full type checker can produce false positives with
             *     circular module type contexts in monorepos (the axios duplicate error)
             *   - `tsc --noEmit` has full project context and is the authoritative checker
             *   - Result: faster builds + no spurious bundle-time type errors
             */
            transpileOnly: true,
          },
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
    new HtmlWebpackPlugin({
      template: './public/index.html',
    }),
    ...(isDev ? [] : [new MiniCssExtractPlugin({ filename: '[name].[contenthash].css' })]),
  ],

  devServer: {
    port: 3000,
    historyApiFallback: true, // enables client-side routing
    hot: true,
    open: true,
    headers: {
      'Access-Control-Allow-Origin': '*', // required for MF cross-origin loading
    },
  },

  optimization: {
    splitChunks: {
      chunks: 'all',
    },
  },
};

export default config;
