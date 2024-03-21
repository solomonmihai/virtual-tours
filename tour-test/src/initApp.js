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
  renderer.setClearColor(0x2e096e);

  return renderer;
}

/**
 *
 * @param {Scene} scene
 */
function addLockEvents(scene) {
  const overlay = document.getElementById("overlay");

  scene.controls.addEventListener("fps-unlock", () => {
    scene.setControlsLock(false);
    overlay.style.display = "flex";
  });

  scene.controls.addEventListener("fps-lock", () => {
    scene.setControlsLock(true);
    overlay.style.display = "none";
  });

  overlay.addEventListener("pointerdown", () => {
    scene.setControlsLock(true);
    overlay.style.display = "none";
  });
}

export default async function initApp() {
  const canvas = document.getElementById("three-canvas");
  const fpsCounter = document.getElementById("fps-counter");

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
    requestAnimationFrame(animate);

    if (!scene.controls.isLocked) {
      return;
    }

    const currentTime = performance.now();
    const dt = (currentTime - lastFrameTime) / 1000;
    lastFrameTime = currentTime;

    scene.onRender(dt);

    const fps = Math.floor(1 / dt);
    const pos = scene.camera.position.toArray().map(Math.floor).join(" ");

    fpsCounter.innerText = `fps: ${fps}
      pos: ${pos}
    `;
  }

  animate();
}
