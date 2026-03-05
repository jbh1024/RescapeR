export const RescapeRAssetManager = {
  assets: {},
  
  loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.decoding = "async";
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
      img.src = src;
    });
  },

  async loadAssets(tree) {
    const out = {};
    for (const [key, value] of Object.entries(tree)) {
      if (typeof value === "string") {
        out[key] = await this.loadImage(value);
      } else {
        out[key] = await this.loadAssets(value);
      }
    }
    return out;
  },

  // 기존 동기식 이미지 생성 (기존 코드와의 호환성을 위해 유지)
  createImageAsset(src) {
    const img = new Image();
    img.decoding = "async";
    img.src = src;
    return img;
  },

  // 기존 트리 로드 로직 (기존 코드 호환성)
  loadArtAssetsSync(tree) {
    const out = {};
    for (const [key, value] of Object.entries(tree)) {
      out[key] = typeof value === "string" ? this.createImageAsset(value) : this.loadArtAssetsSync(value);
    }
    return out;
  }
};
