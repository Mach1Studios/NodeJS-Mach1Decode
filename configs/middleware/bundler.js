/* eslint-disable import/no-extraneous-dependencies, consistent-return */
import { URL } from 'url';

import webpack from 'webpack';
import middleware from 'webpack-dev-middleware';

// console.log(require);

const compiler = (bs, { entry }) => {
  const bundler = webpack({
    mode: 'development',
    entry,
    output: {
      path: new URL('../../dist', import.meta.url).pathname,
      publicPath: '/',
      filename: '[name].bundle.js',
    },
    devtool: 'inline-source-map',
    plugins: [
      new webpack.HotModuleReplacementPlugin(),
      new webpack.NoEmitOnErrorsPlugin(),
    ],
    resolve: {
      fallback: {
        os: require.resolve('os-browserify/browser'),
        path: require.resolve('path-browserify'),
        fs: false,
      },
    },
    target: ['web', 'es5'],
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env'],
              plugins: ['@babel/plugin-proposal-class-properties'],
            },
          },
        },
      ],
    },
  });

  bundler.hooks.done.tap('bs', (stats) => {
    if (stats.hasErrors()) {
      return bs.sockets.emit('fullscreen:message', {
        title: 'Webpack Error:',
        body: stats.toString(),
        timeout: 100000,
      });
    }
    bs.reload();
  });

  return bundler;
};

export default (bs, opts) => middleware(compiler(bs, opts), { publicPath: '/' });
