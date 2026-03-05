export const RescapeRInputSystem = {
  keys: {},
  
  init(onKeyDown) {
    window.addEventListener("keydown", (e) => {
      this.keys[e.key] = true;
      if (onKeyDown) onKeyDown(e);
    });
    window.addEventListener("keyup", (e) => {
      this.keys[e.key] = false;
    });
  },

  isPressed(key) {
    return !!this.keys[key];
  }
};
