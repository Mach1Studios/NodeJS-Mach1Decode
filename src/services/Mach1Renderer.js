import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import Stats from 'stats.js';

export default class Mach1Renderer {
  #container
  #camera
  #scene
  #ambientLight
  #pointLight
  #directionalLight
  #loader = new GLTFLoader()
  #renderer
  #composer
  #mesh
  #pivot

  #width = 320
  #height = 240

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

  constructor() {
    const createScene = (geometry, scale, material) => {
      this.#mesh = new THREE.Mesh(geometry, material);

      this.#mesh.position.y = 120;

      this.#mesh.scale.x = scale;
      this.#mesh.scale.y = scale;
      this.#mesh.scale.z = scale;

      this.#pivot = new THREE.Group();
      this.#pivot.position.set(0.0, -150.0, 0);
      this.#pivot.add(this.#mesh);

      this.#scene.add(this.#pivot);
    };

    const mainWindow = document.getElementById('main');
    this.#container = document.getElementById('modelview');

    this.#camera = new THREE.PerspectiveCamera(27, this.#width / this.#height, 1, 10000);
    this.#camera.position.z = 2500;

    this.#scene = new THREE.Scene();
    this.#scene.background = new THREE.Color(0x474747);

    // LIGHTS
    this.#ambientLight = new THREE.AmbientLight(0x474747);
    this.#scene.add(this.#ambientLight);

    this.#pointLight = new THREE.PointLight(0xffffff, 1.25, 1000);
    this.#pointLight.position.set(0, 0, 600);

    this.#scene.add(this.#pointLight);

    this.#directionalLight = new THREE.DirectionalLight(0xffffff);
    this.#directionalLight.position.set(1, -0.5, -1);
    this.#scene.add(this.#directionalLight);

    const material = new THREE.MeshPhongMaterial({
      color: 0x191919,
      specular: 0x50505,
      shininess: 25,
      normalScale: new THREE.Vector2(0.8, 0.8),
    });

    // this.#loader = new GLTFLoader();
    this.#loader.load('https://threejs.org/examples/models/gltf/LeePerrySmith/LeePerrySmith.glb', (gltf) => {
      createScene(gltf.scene.children[0].geometry, 100, material);
    });

    this.#renderer = new THREE.WebGLRenderer({ alpha: true });
    this.#renderer.setSize(this.#width, this.#height);
    this.#container.appendChild(this.#renderer.domElement);

    this.stats = new Stats();

    // COMPOSER
    this.#renderer.autoClear = false;

    const renderModel = new RenderPass(this.#scene, this.#camera);
    this.#composer = new EffectComposer(this.#renderer);
    this.#composer.addPass(renderModel);

    // EVENTS
    mainWindow.addEventListener('mousemove', this.#onDocumentMouseMove, false);
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
  }
}
