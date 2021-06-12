/* eslint-disable import/no-extraneous-dependencies */
import { URL } from 'url';

import browserSync from 'browser-sync';

import { configs, bundler } from './middleware';

const bs = browserSync.init();
const entry = [new URL('../examples/M1SpatialAudioPlayer.v02.js', import.meta.url).pathname];

bs.init({ ...configs, middleware: bundler(bs, { entry }) });
