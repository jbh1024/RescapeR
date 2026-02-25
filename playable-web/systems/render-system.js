(function attachRenderSystem(global) {
  function withAlpha(hex, alpha) {
    if (typeof hex !== "string") return `rgba(255,255,255,${alpha.toFixed(2)})`;
    if (hex.startsWith("rgba(")) {
      const m = hex.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*[\d.]+\)/);
      if (m) return `rgba(${m[1]}, ${m[2]}, ${m[3]}, ${alpha.toFixed(2)})`;
    }
    if (hex.startsWith("rgb(")) {
      const m = hex.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
      if (m) return `rgba(${m[1]}, ${m[2]}, ${m[3]}, ${alpha.toFixed(2)})`;
    }
    const c = hex.replace("#", "");
    if (c.length !== 6) return hex;
    const r = parseInt(c.slice(0, 2), 16);
    const g = parseInt(c.slice(2, 4), 16);
    const b = parseInt(c.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(2)})`;
  }

  global.RescapeRRenderSystem = {
    withAlpha,
  };
})(window);
