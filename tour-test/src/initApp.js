import { WebGLRenderer, ACESFilmicToneMapping } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { setupInputManager } from "./Input";

import Scene from "./Scene";

/**
 *
 * @param {HTMLCanvasElement} canvas
 * @returns {WebGLRenderer}
 */
function createRenderer(canvas) {
  const renderer = new WebGLRenderer({
    canvas,
    antialias: true,
  });

  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;
  renderer.shadowMap.enabled = true;

  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setClearColor(0xbb9af7);

  return renderer;
}

/**
 *
 * @param {Scene} scene
 */
function addLockEvents(scene) {
  const overlay = document.getElementById("overlay");

  scene._controls.controls.addEventListener("unlock", () => {
    scene.setControlsLock(false);
    overlay.style.display = "flex";
  });

  overlay.addEventListener("pointerdown", () => {
    scene.setControlsLock(true);
    overlay.style.display = "none";
  });
}

export default async function initApp() {
  const canvas = document.getElementById("three-canvas");
  const renderer = createRenderer(canvas);
  const loader = new GLTFLoader();

  const scene = new Scene({ loader, canvas, renderer });
  await scene.loadModels();
  scene.setup();
  scene.addEventListeners();

  setupInputManager();
  addLockEvents(scene);

  let lastFrameTime = performance.now();

  function animate() {
    const currentTime = performance.now();
    const dt = (currentTime - lastFrameTime) / 1000;
    lastFrameTime = currentTime;

    scene.onRender(dt);

    scene._composer.render(dt);
    // renderer.render(scene, scene.camera);

    requestAnimationFrame(animate);
  }

  animate();
}
