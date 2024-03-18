const keys = new Set();

/**
 * @param {string} key
 * @returns {boolean}
 */
export function isKeyDown(key) {
  return keys.has(key);
}

export function setupInputManager() {
  window.addEventListener("keydown", (evt) => {
    keys.add(evt.key);
  });

  window.addEventListener("keyup", (evt) => {
    keys.delete(evt.key);
  });
}
