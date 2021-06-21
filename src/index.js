import Mach1DecodeModule from '../lib/Mach1Decode';

export class Mach1DecoderProxy {
  #player;
  #module;

  constructor(source) {
    if (source) {
      this.#player = source;
    }

    new Mach1DecodeModule().then((m1DecodeModule) => {
      this.#module = new m1DecodeModule.Mach1Decode();

      this.#module.setPlatformType(this.#module.Mach1PlatformType.Mach1PlatformDefault);
      this.#module.setDecodeAlgoType(this.#module.Mach1DecodeAlgoType.Mach1DecodeAlgoSpatial);
      this.#module.setFilterSpeed(0.9);
    });
  }

  decode({ yaw, pitch, roll }) {
    if (this.#module !== null && yaw !== null && pitch !== null && roll !== null) {
      this.#module.beginBuffer();
      const decoded = this.#module.decode(yaw, pitch, roll);
      this.#module.endBuffer();

      if (this.#player) {
        this.#player.gains = decoded;
      }

      return decoded;
    }

    return null;
  }
}

export { default as Mach1SoundPlayer } from './services/Mach1SoundPlayer';
export { default as Mach1Renderer } from './services/Mach1Renderer';
export { default as Gimbal } from './services/Gimbal';
