# AGENTS.md

This repo uses one editable frontend source and generated platform outputs.

## Source of truth

Edit frontend source files only in these paths:

- `frontend/html/*.html`
- `frontend/styles/*.css`
- `frontend/src/game/**/*.js`
- `frontend/src/mp-v2-sim/**/*.js`
- `frontend/assets/`

`frontend/index.html` is generated from `frontend/html/`; do not patch it directly.
`frontend/styles.css` is generated from `frontend/styles/`; do not patch it directly.
`frontend/src/game.js` is generated from the split files in `frontend/src/game/`; do not patch it directly.
`frontend/src/mp-v2-sim.js` is generated from the split files in `frontend/src/mp-v2-sim/`; do not patch it directly.

Do not manually edit generated client files in:

- root `index.html`, `styles.css`, `src/game.js`, `assets/`
- `CrazyGames/`
- `Itch/`
- `GamePix/`

Those generated files are rebuilt from `frontend/`.

## Build targets

- Render/local backend serves the generated root client files.
- CrazyGames upload files are generated into `CrazyGames/`.
- itch.io upload files are generated into `Itch/`.
- GamePix upload files are generated into `GamePix/`.
- The backend implementation lives in `backend/src/`.
- `backend/server.js` is a small compatibility loader for the backend source bundle.
- Root `server.js` is only a compatibility entrypoint for `npm start`.

## Commands

Use `npm.cmd` on Windows PowerShell if `npm` is blocked by execution policy.

```sh
npm run build
npm run build:render
npm run build:crazygames
npm run build:itch
npm run build:gamepix
npm run package:crazygames
npm run package:itch
npm run package:gamepix
npm start
npm run test:physics:framerate
```

## Important workflow

When changing the game frontend:

1. Edit files under `frontend/`.
2. Apply gameplay or physics behavior updates to both implementations when relevant:
   - singleplayer/local client logic in `frontend/src/game/**/*.js`
   - multiplayer simulation logic in `frontend/src/mp-v2-sim/**/*.js`
3. Run `npm run build` to refresh generated Render, CrazyGames, itch.io, and GamePix outputs.
4. Run relevant tests.

When preparing a CrazyGames upload:

1. Run `npm run package:crazygames`.
2. Upload the contents of the generated `CrazyGames/` folder directly.
3. Do not upload a `.zip`, `.rar`, `.7z`, or any other archive; CrazyGames rejects archives for this project.

If a generated file differs from `frontend/`, fix the source in `frontend/` or the build script in `scripts/build-platforms.js`; do not patch the generated output directly.

When preparing an itch.io upload:

1. Run `npm run package:itch`.
2. Upload `Itch/clusternauts-itch.zip`; the ZIP contains `index.html` at the archive root.

When preparing a GamePix upload:

1. Run `npm run package:gamepix`.
2. Upload `GamePix/build.zip`; the ZIP contains `index.html` at the archive root.
