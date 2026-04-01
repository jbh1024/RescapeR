const CACHE_NAME = "rescaper-cache-v2.0.0-rescaper-assets";
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
  "./assets/sprites/player/rescaper_player_vanguard_sheet.png",
  "./assets/sprites/player/rescaper_player_striker_sheet.png",
  "./assets/sprites/player/rescaper_player_phantom_sheet.png",
  "./assets/sprites/player/rescaper_player_death_sheet.png",
  "./assets/sprites/monsters/rescaper_goblin_anim.png",
  "./assets/sprites/monsters/rescaper_bat_anim.png",
  "./assets/sprites/monsters/rescaper_frog_anim.png",
  "./assets/sprites/monsters/rescaper_snail_anim.png",
  "./assets/sprites/monsters/rescaper_skull_slime_anim.png",
  "./assets/sprites/monsters/rescaper_mushroom_anim.png",
  "./assets/sprites/monsters/rescaper_golem_anim.png",
  "./assets/sprites/monsters/rescaper_necromancer_anim.png",
  "./assets/sprites/monsters/rescaper_boss_parking_boss.png",
  "./assets/sprites/monsters/rescaper_boss_lobby_boss.png",
  "./assets/sprites/monsters/rescaper_boss_conference_boss.png",
  "./assets/sprites/monsters/rescaper_boss_server_boss.png",
  "./assets/sprites/monsters/rescaper_boss_glitch_boss.png",
  "./assets/sprites/monsters/rescaper_boss_marketing_boss.png",
  "./assets/sprites/monsters/rescaper_boss_ceo_boss.png",
  "./assets/sprites/tiles/rescaper_tile_concrete.png",
  "./assets/sprites/tiles/rescaper_tile_marble.png",
  "./assets/sprites/tiles/rescaper_tile_carpet.png",
  "./assets/sprites/tiles/rescaper_tile_metallic.png",
  "./assets/sprites/tiles/rescaper_tile_wood.png",
  "./assets/sprites/tiles/rescaper_tile_luxury.png",
  "./assets/sprites/tiles/rescaper_tile_tech.png",
  "./assets/sprites/tiles/rescaper_tile_bright.png",
  "./assets/sprites/tiles/rescaper_elevator_gate.png",
  "./assets/sprites/ui/rescaper_ui_frame.png",
  "./assets/sprites/ui/rescaper_transition_elevator.png",
  "./assets/sprites/backgrounds/rescaper_bg_office_parking.png",
  "./assets/sprites/backgrounds/rescaper_bg_office_lobby.png",
  "./assets/sprites/backgrounds/rescaper_bg_office_floor.png",
  "./assets/sprites/backgrounds/rescaper_bg_office_server.png",
  "./assets/sprites/backgrounds/rescaper_bg_office_cafe.png",
  "./assets/sprites/backgrounds/rescaper_bg_office_executive.png",
  "./assets/sprites/backgrounds/rescaper_bg_office_glitch.png",
  "./assets/sprites/backgrounds/rescaper_bg_office_marketing.png",
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
