# Style & Conventions

- **Language:** UI/Docs in Korean, Code/Comments in English/Korean.
- **Architecture:** ES Modules, centralized `state` management.
- **Safety:** Always check `state.floor` before rendering to avoid initialization errors.
- **Physics:** Use Delta Time (`dt`) for frame-rate independent calculations.
- **Naming:** Follow existing camelCase for variables/functions, PascalCase for Systems.
- **Avoid Root Pollution:** Do not add game assets/scripts to the project root; keep them in `playable-web/`.
