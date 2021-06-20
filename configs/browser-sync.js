/* eslint-disable import/no-extraneous-dependencies */
import { URL } from 'url';

import _ from 'lodash';
import browserSync from 'browser-sync';

import { configs, bundler } from './middleware';

const bs = browserSync.create();

const version = _.get(process, 'argv.2', 'v02');
const entry = [new URL(`../examples/M1SpatialAudioPlayer.${version}.js`, import.meta.url).pathname];

bs.init({ ...configs, middleware: bundler(bs, { entry }) });
