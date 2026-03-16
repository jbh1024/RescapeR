# Suggested Commands

## Running the Project
- **Local (Simple):** `python3 -m http.server 8000` (Access at http://localhost:8000/playable-web/)
- **Docker (Dev):** `./scripts/deploy.sh dev` (Access at http://localhost:8080)

## Build & Deployment
- **Multi-arch Build:** `./scripts/build-multiarch.sh <version> <username>`
- **Docker Hub Deploy:** `./scripts/deploy-dockerhub.sh <version> <username>`

## Verification & Testing
- **Syntax Check:** `node --check playable-web/game.js`
- **Smoke Test:** `./playable-web/smoke-check.sh`
- **Playwright Tests:** `npx playwright test`

## System Utils (Darwin)
- `ls`, `grep`, `find`, `git` (standard macOS versions)
