/* eslint-disable import/no-extraneous-dependencies */
import { URL } from 'url';

import browserSync from 'browser-sync';

import { configs, bundler } from './middleware';

const bs = browserSync.create();
const entry = [new URL('../examples/M1SpatialAudioPlayer.v02.js', import.meta.url).pathname];
// const entry = [new URL('../examples/test.js', import.meta.url).pathname];

// findAPortNotInUse(3000).then((...args) => {
//   console.log(args);
// });

// console.log(browserSync);

bs.init({ ...configs, middleware: bundler(bs, { entry }) });
