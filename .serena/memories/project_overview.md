# RescapeR Project Purpose
"퇴근을 위해 회사라는 던전을 탈출하라!" (Escape the office dungeon for home!)
A 2D Roguelite Action Platformer where players fight "work stress monsters" from B6 to 9F.

# Tech Stack
- **Web:** HTML5 Canvas 2D, Vanilla JavaScript (ES6 Modules), CSS3.
- **PWA:** Service Worker (`sw.js`), Web App Manifest.
- **Backend/Serving:** Docker (Nginx), Multi-arch (AMD64, ARM64).
- **Storage:** LocalStorage (`rescaperSave`, `rescaperMeta`, `rescaperSettings`).
- **Development:** Python HTTP server (for local), Node.js (for syntax check).
- **Testing:** Playwright.

# Codebase Structure
- `playable-web/`: Main web source code.
  - `game.js`: Entry point.
  - `systems/`: Feature-specific logic modules.
  - `assets/`: Sprites, backgrounds, audio.
- `Assets/Scripts/`: Unity/C# scaffolding (for reference/future porting).
- `scripts/`: Docker build, deployment, and utility scripts.
- `docker/`: Nginx configuration.
