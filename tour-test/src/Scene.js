import {
  Scene as BaseScene,
  BoxGeometry,
  MeshBasicMaterial,
  Mesh,
  DirectionalLight,
  Raycaster,
  Vector2,
  Loader,
  Camera,
  PerspectiveCamera,
  Vector3,
  WebGLRenderer,
  Object3D,
  AmbientLight,
} from "three";

import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { OutlinePass } from "three/examples/jsm/postprocessing/OutlinePass.js";
import { FXAAShader } from "three/examples/jsm/shaders/FXAAShader.js";

import gsap from "gsap";

import FpsControls from "./FpsControls";

const MODES = {
  SCENE_VIEW: "scene-view",
  MODEL_VIEW: "model-view",
};

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

    this._mode = MODES.SCENE_VIEW;

    /** @type {Object3D | null} */
    this._highlightedObject = null;
  }

  get camera() {
    return this._camera;
  }

  get controls() {
    return this._controls;
  }

  async loadModels() {
    this._testModel = await this._loader.loadAsync("/models/head/scene.gltf");
  }

  setup() {
    const aspect = window.innerWidth / window.innerHeight;
    this._camera = new PerspectiveCamera(75, aspect, 0.1, 20000);
    this._camera.position.set(0, 0, 20);

    this._pointer = new Vector2(-100, -100);

    this._controls = new FpsControls(this._camera, this._canvas);
    this.add(this._controls.getObject());

    this._testModel.scene.scale.set(1, 1, 1);
    this._testModel.scene.position.set(0, 0, 0);

    // this.add(this._testModel.scene);

    const ambientLight = new AmbientLight(0xcccccc);
    this.add(ambientLight);

    const directionalLight = new DirectionalLight(0xddffdd, 0.4);
    directionalLight.position.set(0, 1, 1).normalize();
    this.add(directionalLight);

    this._generateCubes(3);

    this._setupOutlineShader();

    this._raycaster = new Raycaster(new Vector3(), new Vector3(0, -1, 0), 0, 15);
  }

  /**
   *
   * @param {number} dt
   */
  onRender(dt) {
    if (this._mode === MODES.SCENE_VIEW) {
      this._controls.update(dt);
      this._checkIntersections();
    }

    this._composer.render(dt);
  }

  addEventListeners() {
    window.addEventListener("pointermove", (evt) => this._onPointerMove(evt));
    window.addEventListener("pointerdown", () => this._onPointerDown());
    window.addEventListener("keydown", (evt) => this._onKeyDown(evt));
  }

  /**
   * @param {boolean} value
   */
  setControlsLock(value) {
    if (this._mode === MODES.MODEL_VIEW) {
      return;
    }

    if (value && !this._controls.isLocked) {
      this._controls.lock();
    } else if (value && this._controls.isLocked) {
      this._controls.unlock();
    }
  }

  _checkIntersections() {
    this._raycaster.setFromCamera(new Vector2(0, 0), this._camera);

    // first check intersection with the last intersected object
    if (this._highlightedObject && this._checkIntersection(this._highlightedObject)) {
      return;
    }

    for (const object of this.children) {
      if (object.id === this._highlightedObject || !this._checkIntersection(object)) {
        continue;
      }

      this._setCursorHighlight(true);

      this._highlightedObject = object;
      this._outlinePass.selectedObjects = [this._highlightedObject];

      return;
    }

    this._outlinePass.selectedObjects = [];
    this._highlightedObject = null;

    this._setCursorHighlight(false);
  }

  /**
   * @param {Object3D} object
   * @returns {boolean}
   */
  _checkIntersection(object) {
    const intersection = this._raycaster.intersectObject(object);
    return intersection.length !== 0;
  }

  /**
   * @param {PointerEvent} evt
   */
  _onPointerMove(evt) {
    this._pointer.x = (evt.clientX / window.innerWidth) * 2 - 1;
    this._pointer.y = -(evt.clientY / window.innerHeight) * 2 + 1;
  }

  _onPointerDown() {
    if (!this._highlightedObject) {
      return;
    }

    this._transitionToModelView(this._highlightedObject);
  }

  /**
   * @param {KeyboardEvent} evt
   */
  _onKeyDown(evt) {
    if (evt.key !== "q" || this._mode !== MODES.MODEL_VIEW) {
      return;
    }

    this._transitionToSceneView();
  }

  /**
   * @param {number} count
   */
  _generateCubes(count) {
    const cubeGeometry = new BoxGeometry(1, 1, 1);

    const colors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00];

    for (let i = 0; i < count; i++) {
      const cubeMaterial = new MeshBasicMaterial({ color: colors[Math.floor(Math.random() * colors.length)] });
      const cube = new Mesh(cubeGeometry, cubeMaterial);

      const x = -25 + Math.random() * 50;
      const y = -25 + Math.random() * 50;

      cube.position.set(x, 0, y);
      this.add(cube);
    }
  }

  /**
   * @param {boolean} highlight
   */
  _setCursorHighlight(highlight) {
    // TODO: add a check so i dont trigger anim when cursor
    // is already at the desired state

    const size = highlight ? 54 : 3;
    const backgroundColor = highlight ? "rgba(0, 0, 0, 0.4)" : "transparent";

    gsap.to("#cursor", {
      width: size,
      height: size,
      backgroundColor,
      duration: 0.2,
    });
  }

  _setupOutlineShader() {
    // TODO: set composer size to canvas width
    // also have a separate renderer class for this

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

    const effectFXAA = new ShaderPass(FXAAShader);
    effectFXAA.uniforms["resolution"].value.set(1 / window.innerWidth, 1 / window.innerHeight);
    effectFXAA.renderToScreen = true;
    this._composer.addPass(effectFXAA);
  }

  /**
   * @param {Object3D} object
   */
  _transitionToModelView(object) {
    this._mode = MODES.MODEL_VIEW;

    this._setCursorHighlight(false);
    gsap.set("#cursor", {
      display: "none"
    });

    this.controls.disconnect();

    // TODO: transition camera to front of the model
    // this should also account for the model's rotation
  }

  _transitionToSceneView() {
    gsap.set("#cursor", {
      display: "block"
    });

    this._controls.connect();

    this._mode = MODES.SCENE_VIEW;
  }
}
