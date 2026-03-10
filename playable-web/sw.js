const CACHE_NAME = "rescaper-cache-v1.0.9-modular";
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./game.js",
  "./systems/utils.js",
  "./systems/data-config.js",
  "./systems/audio-system.js",
  "./systems/fx-system.js",
  "./systems/asset-manager.js",
  "./systems/save-system.js",
  "./systems/combat-system.js",
  "./systems/ui-system.js",
  "./systems/render-system.js",
  "./systems/monster-archetype-system.js",
  "./systems/floor-system.js",
  "./systems/player-system.js",
  "./systems/ai-system.js",
  "./systems/input-system.js",
  "./assets/sprites/player/wishforge_player_idle.png",
  "./assets/sprites/player/wishforge_player_jump.png",
  "./assets/sprites/player/wishforge_player_fall.png",
  "./assets/sprites/monsters/wishforge_enemy_dark_guard.png",
  "./assets/sprites/monsters/wishforge_enemy_necromancer.png",
  "./assets/sprites/monsters/wishforge_enemy_goblin.png",
  "./assets/sprites/monsters/wishforge_enemy_goblin_hog.png",
  "./assets/sprites/monsters/wishforge_enemy_bat.png",
  "./assets/sprites/monsters/wishforge_enemy_frog.png",
  "./assets/sprites/monsters/wishforge_enemy_snail.png",
  "./assets/sprites/monsters/wishforge_enemy_skull_slime.png",
  "./assets/sprites/monsters/wishforge_enemy_golem.png",
  "./assets/sprites/monsters/wishforge_enemy_mushroom.png",
  "./assets/sprites/tiles/wishforge_tile_01.png",
  "./assets/sprites/tiles/wishforge_tile_14.png",
  "./assets/sprites/tiles/wishforge_cave_under_tile.png",
  "./assets/sprites/ui/wishforge_ui_lives.png",
  "./assets/sprites/ui/wishforge_ui_boss_icon.png",
  "./assets/sprites/ui/wishforge_ui_popup_bg.png",
  "./assets/sprites/backgrounds/wishforge_bg_merged_dark.png",
  "./assets/sprites/backgrounds/wishforge_bg_sky.png",
  "./assets/sprites/backgrounds/wishforge_bg_mountains.png",
  "./assets/sprites/backgrounds/wishforge_bg_trees_01.png",
  "./assets/sprites/backgrounds/wishforge_bg_trees_02.png",
  "./assets/docs/wishforge-mr-platformer-license.txt",
  "./assets/docs/platformerGraphicsDeluxe.license.txt",
  "./manifest.webmanifest",
  "./icon.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME)
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((networkRes) => {
          const cloned = networkRes.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, cloned));
          return networkRes;
        })
        .catch(() => caches.match("./index.html"));
    })
  );
});
