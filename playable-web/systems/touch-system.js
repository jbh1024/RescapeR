export const RescapeRTouchSystem = {
  isActive: false,
  _inputSystem: null,
  _onVirtualKeyDown: null,
  _container: null,

  isMobile() {
    // 터치 지원 여부 (실제 기기 + Chrome DevTools 에뮬레이션)
    const hasTouch = navigator.maxTouchPoints > 0
      || "ontouchstart" in window
      || window.matchMedia("(pointer: coarse)").matches;
    // 터치 디바이스이면서 폭이 좁으면 모바일 (세로/가로 모두 포함)
    const isNarrow = Math.min(window.innerWidth, window.innerHeight) <= 1024;
    return hasTouch && isNarrow;
  },

  init(inputSystem, onVirtualKeyDown) {
    this._inputSystem = inputSystem;
    this._onVirtualKeyDown = onVirtualKeyDown;
    this._createGamepad();
    this._preventDefaults();
    this._listenResize();
    this._listenMediaQuery();
  },

  show() {
    this.isActive = true;
    document.body.classList.add("mobile-mode");
    this._container.classList.add("active");
  },

  hide() {
    this.isActive = false;
    document.body.classList.remove("mobile-mode");
    this._container.classList.remove("active");
    this._container.querySelectorAll("button[data-keycode]").forEach((btn) => {
      const code = btn.dataset.keycode;
      this._inputSystem.keys[code] = false;
      btn.classList.remove("pressed");
    });
  },

  _createGamepad() {
    const container = document.createElement("div");
    container.id = "touch-gamepad";
    container.innerHTML = `
      <div class="pad-group pad-left">
        <button class="btn-jump" data-keycode="ArrowUp">\u25B2 JUMP</button>
        <button data-keycode="ArrowLeft">\u25C0</button>
        <button data-keycode="ArrowRight">\u25B6</button>
      </div>
      <div class="pad-group pad-right">
        <button data-keycode="KeyE">E</button>
        <button data-keycode="KeyQ">Q</button>
        <button data-keycode="Space">ATK</button>
        <button data-keycode="ShiftLeft">DASH</button>
      </div>
    `;
    document.body.appendChild(container);
    this._container = container;

    container.querySelectorAll("button[data-keycode]").forEach((btn) => {
      const code = btn.dataset.keycode;

      const press = (e) => {
        e.preventDefault();
        this._inputSystem.keys[code] = true;
        btn.classList.add("pressed");
        if (this._onVirtualKeyDown) this._onVirtualKeyDown(code);
      };

      const release = (e) => {
        e.preventDefault();
        this._inputSystem.keys[code] = false;
        btn.classList.remove("pressed");
      };

      // 터치 이벤트 (실제 모바일)
      btn.addEventListener("touchstart", press, { passive: false });
      btn.addEventListener("touchend", release, { passive: false });
      btn.addEventListener("touchcancel", release, { passive: false });

      // 마우스 이벤트 (Chrome DevTools 에뮬레이션 + 데스크톱 폴백)
      btn.addEventListener("mousedown", press);
      btn.addEventListener("mouseup", release);
      btn.addEventListener("mouseleave", release);
    });
  },

  _preventDefaults() {
    const canvas = document.getElementById("game");
    if (canvas) {
      canvas.addEventListener("touchstart", (e) => e.preventDefault(), { passive: false });
      canvas.addEventListener("touchmove", (e) => e.preventDefault(), { passive: false });
    }

    document.addEventListener("contextmenu", (e) => {
      if (this.isActive) e.preventDefault();
    });

    document.addEventListener("touchmove", (e) => {
      if (e.touches.length > 1 && this.isActive) e.preventDefault();
    }, { passive: false });
  },

  _listenResize() {
    let resizeTimer;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        this._autoToggle();
      }, 200);
    });
  },

  _listenMediaQuery() {
    // pointer: coarse 미디어쿼리 변화 감지 (Chrome DevTools 모바일 전환 시 즉시 반영)
    const mq = window.matchMedia("(pointer: coarse)");
    if (mq.addEventListener) {
      mq.addEventListener("change", () => this._autoToggle());
    }
  },

  _autoToggle() {
    if (this.isMobile() && !this.isActive) {
      this.show();
    } else if (!this.isMobile() && this.isActive) {
      this.hide();
    }
  },
};
