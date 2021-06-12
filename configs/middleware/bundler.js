/* eslint-disable import/no-extraneous-dependencies */
import { URL } from 'url';

import webpack from 'webpack';
import middleware from 'webpack-dev-middleware';

const compiler = (bs, { entry }) => {
  const bundler = webpack({
    // debug: true,
    entry,
    output: {
      path: new URL('.', import.meta.url).pathname,
      publicPath: '/',
      filename: 'dist/bundle.js',
    },
  });
  // console.log(bundler.hooks.done);

  bundler.hooks.done.tap('bs', (stats) => {
    console.log(stats);
    // bs.reload();
  });

  return bundler;
};

export default (bs, opts) => middleware(compiler(bs, opts), { publicPath: '' });
