import Mach1DecodeModule from '../lib/Mach1Decode';
import Mach1DecodeModuleWasm from '../lib/Mach1Decode.wasm';

export class Mach1DecoderProxy {
  #player;
  #module;

  #debug = {
    enable: false,
    values: {},
  };

  constructor(source, options) {
    if (source) {
      this.#player = source;
    }
    if (typeof options === 'object' && hasOwnProperty.call(options, 'debug')) {
      this.#debug.enable = options.debug;
    }

    new Mach1DecodeModule()
      .then((m1DecodeModule) => {
        this.#module = new m1DecodeModule.Mach1Decode();

        this.#module.setPlatformType(this.#module.Mach1PlatformType.Mach1PlatformDefault);
        this.#module.setDecodeAlgoType(this.#module.Mach1DecodeAlgoType.Mach1DecodeAlgoSpatial);
        this.#module.setFilterSpeed(0.9);
      });
  }

  decode({ yaw, pitch, roll }) {
    if (!this.#module) return null;
    if (this.#module !== null && yaw !== null && pitch !== null && roll !== null) {
      this.#module.beginBuffer();
      const decoded = this.#module.decode(yaw, pitch, roll);
      this.#module.endBuffer();

      if (this.#player) {
        this.#player.gains = decoded;
      }

      if (this.#debug.enable && (this.#debug.values.yaw !== yaw || this.#debug.values.pitch !== pitch || this.#debug.values.roll !== roll)) {
        this.#debug.values = { yaw, pitch, roll };

        console.debug(`Inpute values: yaw=${yaw}, pitch=${pitch}, roll=${roll}`);
        console.debug(`Decoded values: ${decoded}`);
      }

      return decoded;
    }

    return null;
  }
}

export { default as Mach1SoundPlayer } from './services/Mach1SoundPlayer';
export { default as Mach1Renderer } from './services/Mach1Renderer';
export { default as Gimbal } from './services/Gimbal';
