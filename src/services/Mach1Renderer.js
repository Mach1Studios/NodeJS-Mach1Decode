/* eslint-disable */

import * as THREE from 'three';

import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import Stats from 'stats.js';

import * as facemesh from '@tensorflow-models/face-landmarks-detection';

export default class Mach1Renderer {
  #camera

  #composer
  #mesh
  #pivot
  #model

  #renderer = new THREE.WebGLRenderer({ alpha: true })
  #scene = new THREE.Scene()
  #stats = new Stats();

  #ambientLight = new THREE.AmbientLight(0x474747)
  #directionalLight = new THREE.DirectionalLight(0xffffff)
  #pointLight = new THREE.PointLight(0xffffff, 1.25, 1000)

  #width = 320
  #height = 240

  #predication = {}

  #onDocumentMouseMove = (event) => {
    this.mouseX = (event.clientX) / window.innerWidth;
    this.mouseY = (event.clientY) / window.innerHeight;
  }

  #onWindowResize = () => {
    this.#camera.aspect = this.#width / this.#height;
    this.#camera.updateProjectionMatrix();

    this.#renderer.setSize(this.#width, this.#height);
    this.#composer.setSize(this.#width, this.#height);
  }

  constructor(layout) {
    this.#camera = new THREE.PerspectiveCamera(27, this.#width / this.#height, 1, 10000);
    this.#camera.position.z = 2500;

    this.#pointLight.position.set(0, 0, 600);
    this.#directionalLight.position.set(1, -0.5, -1);

    this.#scene.background = new THREE.Color(0x474747);

    this.#scene.add(this.#ambientLight);
    this.#scene.add(this.#pointLight);
    this.#scene.add(this.#directionalLight);

    this.#renderer.setSize(this.#width, this.#height);
    this.#renderer.autoClear = false;

    const renderModel = new RenderPass(this.#scene, this.#camera);
    this.#composer = new EffectComposer(this.#renderer);
    this.#composer.addPass(renderModel);

    layout.appendChild(this.#renderer.domElement);

    window.addEventListener('mousemove', this.#onDocumentMouseMove, false);
    window.addEventListener('resize', this.#onWindowResize, false);

    this.#onWindowResize();
  }

  render({ pitch, roll, yaw }) {
    if (this.#mesh) {
      this.#pivot.rotation.y = Math.PI - THREE.Math.degToRad(yaw);
      this.#pivot.rotation.x = THREE.Math.degToRad(pitch);
      this.#pivot.rotation.z = -THREE.Math.degToRad(roll);
    }
    this.#composer.render();
    this.#stats.update();
  }

  async startPredicationRender(input, canvas) {
    const { videoWidth } = input;
    const { videoHeight } = input;


    input.width = videoWidth;
    input.height = videoHeight;
    canvas.width = videoWidth;
    canvas.height = videoHeight;

    const ctx = canvas.getContext('2d');
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.fillStyle = '#32EEDB';
    ctx.strokeStyle = '#32EEDB';

    try {
      // NOTE: This takes the first element by CSS class
      // and after some changes on the HTML page this code can be broken
      // FIXME: Need to use getElementsById
      const canvasContainer = document.querySelector('.canvas-wrapper');
      canvasContainer.style = `width: ${videoWidth}px; height: ${videoHeight}px`;
    } catch (e) {
      console.log('Broken canvas container');
    }

    this.predication = {
      input,
      canvas,
      ctx,
      videoWidth,
      videoHeight,
    };

    this.#model = await facemesh.load(facemesh.SupportedPackages.mediapipeFacemesh);
    await this.renderPrediction();
  }

  async renderPrediction() {
    console.log('render');
    const { controls } = window;
    const {
      input,
      canvas,
      ctx,
      videoWidth,
      videoHeight,
    } = this.predication;

    function radiansToDegrees(radians) {
      return radians * (180 / Math.PI);
    }

    const predictions = await this.#model.estimateFaces({
      input,
    });
    const warningMessage = 'WARNING: UNABLE TO TRACK FACE!';
    ctx.drawImage(input, 0, 0, videoWidth, videoHeight, 0, 0, canvas.width, canvas.height);

    document.getElementById('stats').innerHTML = '';
    document.getElementById('warning').innerHTML = (window.modeTracker === 'facetracker' && predictions.length === 0)
      ? warningMessage
      : '';

    if (predictions.length > 0) {
      predictions.forEach((prediction) => {
        try {
          if (window.modeTracker === 'facetracker') {
            document.getElementById('warning').innerHTML = (prediction.faceInViewConfidence < 1) ? warningMessage : '';
            document.getElementById('stats').innerHTML += `confidence: ${prediction.faceInViewConfidence.toFixed(4)}`;
          }
        } catch (err) {
          document.getElementById('stats').innerHTML = err.message;
        }

        const keypoints = prediction.scaledMesh;

        for (let i = 0; i < keypoints.length; i += 1) {
          const x = keypoints[i][0];
          const y = keypoints[i][1];

          ctx.fillStyle = 'white';
          ctx.fillRect(x, y, 2, 2);

          if (parseInt(controls.nPoint, 10) === i) {
            ctx.fillStyle = 'red';
            ctx.fillRect(x, y, 6, 6);
          }

          if (i === 10 || i === 152) {
            ctx.fillStyle = 'green';
            ctx.fillRect(x, y, 6, 6);
          }
          if (i === 234 || i === 454) {
            ctx.fillStyle = 'yellow';
            ctx.fillRect(x, y, 6, 6);
          }
        }

        const pTop = new THREE.Vector3(prediction.mesh[10][0], prediction.mesh[10][1], prediction.mesh[10][2]);
        const pBottom = new THREE.Vector3(prediction.mesh[152][0], prediction.mesh[152][1], prediction.mesh[152][2]);
        const pLeft = new THREE.Vector3(prediction.mesh[234][0], prediction.mesh[234][1], prediction.mesh[234][2]);
        const pRight = new THREE.Vector3(prediction.mesh[454][0], prediction.mesh[454][1], prediction.mesh[454][2]);

        const pTB = pTop.clone().addScaledVector(pBottom, -1).normalize();
        const pLR = pLeft.clone().addScaledVector(pRight, -1).normalize();

        let yaw = radiansToDegrees(Math.PI / 2 - pLR.angleTo(new THREE.Vector3(0, 0, 1)));
        let pitch = radiansToDegrees(Math.PI / 2 - pTB.angleTo(new THREE.Vector3(0, 0, 1)));
        let roll = radiansToDegrees(Math.PI / 2 - pTB.angleTo(new THREE.Vector3(1, 0, 0)));

        if (yaw > parseFloat(controls.FOV)) {
          yaw = parseFloat(controls.FOV);
        }
        if (yaw < -parseFloat(controls.FOV)) {
          yaw = -parseFloat(controls.FOV);
        }
        if (pitch > parseFloat(controls.FOV)) {
          pitch = parseFloat(controls.FOV);
        }
        if (pitch < -parseFloat(controls.FOV)) {
          pitch = -parseFloat(controls.FOV);
        }
        if (roll > parseFloat(controls.FOV)) {
          roll = parseFloat(controls.FOV);
        }
        if (roll < -parseFloat(controls.FOV)) {
          roll = -parseFloat(controls.FOV);
        }

        if (window.modeTracker === 'facetracker') {
          window.yaw = yaw * parseFloat(controls.yawMultiplier);
          window.pitch = pitch * parseFloat(controls.pitchMultiplier);
          window.roll = roll * parseFloat(controls.rollMultiplier);
        }
      });
    }
    requestAnimationFrame(() => this.renderPrediction());
  }
}
