export const RescapeRUtils = {
  randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },

  pctText(v) {
    return `${Math.round(v * 100)}%`;
  }
};
