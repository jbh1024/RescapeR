export const RescapeRInputSystem = {
  keys: {},
  
  init(onKeyDown) {
    window.addEventListener("keydown", (e) => {
      // 방향키, 스페이스바 등 브라우저 스크롤 유발 키 방지
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " ", "Spacebar"].includes(e.key)) {
        e.preventDefault();
      }
      const wasDown = this.keys[e.key];
      this.keys[e.key] = true;
      if (onKeyDown) onKeyDown(e, wasDown);
    });
    window.addEventListener("keyup", (e) => {
      this.keys[e.key] = false;
    });
  },

  isPressed(key) {
    return !!this.keys[key];
  }
};
