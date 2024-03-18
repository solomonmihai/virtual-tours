import { Camera, Vector3 } from "three";
import { PointerLockControls } from "three/examples/jsm/controls/PointerLockControls";
import { isKeyDown } from "./Input";

export default class FpsControls {
  /**
   * @param {Camera} camera
   * @param {HTMLElement} element
   */
  constructor(camera, element) {
    this._controls = new PointerLockControls(camera, element);

    this._speed = 10;
  }

  /**
   * @returns {PointerLockControls}
   * */
  get controls() {
    return this._controls;
  }

  /**
   * @param {Number} dt
   */
  update(dt) {
    if (!this._controls.isLocked) {
      return;
    }

    this._updateMovement(dt);
  }

  /**
   * @param {Number} dt
   */
  _updateMovement(dt) {
    const dir = new Vector3();
    if (isKeyDown("w")) {
      dir.z = 1;
    }
    if (isKeyDown("s")) {
      dir.z = -1;
    }
    if (isKeyDown("d")) {
      dir.x = 1;
    }
    if (isKeyDown("a")) {
      dir.x = -1;
    }

    dir.normalize();
    dir.multiplyScalar(this._speed * dt);

    this._controls.moveRight(dir.x);
    this._controls.moveForward(dir.z);
  }
}
