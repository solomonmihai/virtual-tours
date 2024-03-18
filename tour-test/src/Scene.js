import {
  Scene as BaseScene,
  BoxGeometry,
  MeshBasicMaterial,
  Mesh,
  AmbientLight,
  DirectionalLight,
  Raycaster,
  Vector2,
  Loader,
  Camera,
  PerspectiveCamera,
  Vector3,
  WebGLRenderer,
} from "three";

import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { OutlinePass } from "three/examples/jsm/postprocessing/OutlinePass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { FXAAShader } from "three/examples/jsm/shaders/FXAAShader.js";

import FpsControls from "./FpsControls";

export default class Scene extends BaseScene {
  /**
   * @param {Object} options
   * @param {Loader} options.loader
   * @param {HTMLElement} options.canvas
   * @param {WebGLRenderer} options.renderer
   */
  constructor({ loader, canvas, renderer }) {
    super();
    this._loader = loader;
    this._canvas = canvas;
    this._renderer = renderer;

    /** @type {Camera} */
    this._camera = null;

    /** @type {Raycaster} */
    this._raycaster = null;

    /** @type {Vector2} */
    this._pointer = null;
  }

  get camera() {
    return this._camera;
  }

  async loadModels() {
    this._testModel = await this._loader.loadAsync("/models/head/scene.gltf");
  }

  setup() {
    const aspect = window.innerWidth / window.innerHeight;
    this._camera = new PerspectiveCamera(75, aspect, 1, 20000);
    this._camera.position.set(0, 0, 20);

    this._controls = new FpsControls(this._camera, this._canvas);
    this.add(this._controls.controls.getObject());

    this._testModel.scene.scale.set(1, 1, 1);
    this._testModel.scene.position.set(0, 0, 0);
    // setTimeout(() => {
    // this.add(this._testModel.scene);
    // }, 2000);

    // const ambientLight = new AmbientLight(0xcccccc);
    // this.add(ambientLight);

    const directionalLight = new DirectionalLight(0xddffdd, 0.4);
    directionalLight.position.set(0, 1, 1).normalize();
    this.add(directionalLight);

    this._generateCubes();

    this._setupOutlineShader();

    this._raycaster = new Raycaster(new Vector3(), new Vector3(0, -1, 0), 0, 100);

    // set mouse position await from the center of the screen
    this._pointer = new Vector2(-100, -100);
  }

  /**
   *
   * @param {number} dt
   */
  onRender(dt) {
    this._controls.update(dt);
    this._raycaster.ray.origin.copy(this._controls.controls.getObject().position);
    this._composer.render();
  }

  addEventListeners() {
    window.addEventListener("pointermove", (evt) => this._onPointerMove(evt));
  }

  /**
   * @param {boolean} value
   */
  setControlsLock(value) {
    if (value && !this._controls.controls.isLocked) {
      this._controls.controls.lock();
    } else if (value && this._controls.controls.isLocked) {
      this._controls.controls.unlock();
    }
  }

  _checkIntersections() {
    this._raycaster.setFromCamera(this._pointer, this._camera);
    const intersects = this._raycaster.intersectObjects(this.children, false);

    this._outlinePass.selectedObjects = [];

    if (intersects.length === 0) {
      return;
    }

    this._outlinePass.selectedObjects = [intersects[0].object];
  }

  /**
   * @param {PointerEvent} evt
   */
  _onPointerMove(evt) {
    if (!this._pointer) {
      return;
    }

    this._pointer.x = (evt.clientX / window.innerWidth) * 2 - 1;
    this._pointer.y = -(evt.clientY / window.innerHeight) * 2 + 1;

    this._checkIntersections();
  }

  _generateCubes() {
    const cubeGeometry = new BoxGeometry(1, 1, 1);

    const colors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00];

    for (let i = 0; i < 15; i++) {
      const cubeMaterial = new MeshBasicMaterial({ color: colors[Math.floor(Math.random() * colors.length)] });
      const cube = new Mesh(cubeGeometry, cubeMaterial);

      const x = -25 + Math.random() * 50;
      const y = -25 + Math.random() * 50;

      cube.position.set(x, 0, y);
      this.add(cube);
    }
  }

  _setupOutlineShader() {
    this._composer = new EffectComposer(this._renderer);
    this._composer.setSize(window.innerWidth, window.innerHeight);

    const renderPass = new RenderPass(this, this._camera);
    this._composer.addPass(renderPass);

    this._outlinePass = new OutlinePass(new Vector2(window.innerWidth, window.innerHeight), this, this._camera);
    this._outlinePass.visibleEdgeColor.set("#ffffff");
    this._outlinePass.hiddenEdgeColor.set("#ffffff");
    this._outlinePass.edgeStrength = 10.0;
    this._outlinePass.edgeThickness = 5.0;

    this._composer.addPass(this._outlinePass);

    // const outputPass = new OutputPass();
    // this._composer.addPass(outputPass);

    const effectFXAA = new ShaderPass(FXAAShader);
    effectFXAA.uniforms["resolution"].value.set(1 / window.innerWidth, 1 / window.innerHeight);
    effectFXAA.renderToScreen = true;
    this._composer.addPass(effectFXAA);
  }
}
