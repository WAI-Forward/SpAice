# Clusternauts

Clusternauts has one editable frontend source tree:

```text
frontend/
```

Edit the game client here:

- `frontend/html/*.html`
- `frontend/styles/*.css`
- `frontend/src/game/**/*.js`
- `frontend/src/mp-v2-sim/**/*.js`
- `frontend/assets/`

These frontend-looking files are generated bundles. Do not edit these by hand:

- `frontend/index.html`
- `frontend/styles.css`
- `frontend/src/game.js`
- `frontend/src/mp-v2-sim.js`
- root `index.html`
- root `styles.css`
- root `src/game.js`
- root `src/mp-v2-sim.js`
- root `assets/`
- `CrazyGames/`
- `Itch/build/`
- `GamePix/`

Backend logic lives in `backend/src/`. `backend/server.js` is a small loader that preserves the existing `npm start` entrypoint.

## Install

```sh
npm install
```

On Windows PowerShell, if `npm` is blocked by script execution policy, use `npm.cmd` instead:

```sh
npm.cmd install
```

## Build

Build every platform output:

```sh
npm run build
```

Build only the Render/local output:

```sh
npm run build:render
```

Build only the CrazyGames folder:

```sh
npm run build:crazygames
```

Build only the itch.io staging folder:

```sh
npm run build:itch
```

Build only the GamePix folder:

```sh
npm run build:gamepix
```

## Run Locally

```sh
npm start
```

The backend starts from root `server.js`, which loads `backend/server.js`.

For persistent multiplayer state, the backend reads `data/db-uri.json` when it
exists. It uses `dev_address` locally and `prod_address` when
`NODE_ENV=production`. `CLUSTERNAUTS_DATABASE_URL` or `DATABASE_URL` can override
that value, and may contain either a raw PostgreSQL URL or the same JSON shape as
the Cloud Run `db-uri` secret.

## CrazyGames Upload

CrazyGames runs as a static client and talks to the Cloud Run backend:

```text
https://clusternauts-806779816452.us-central1.run.app
```

The database URL must stay server-side in Cloud Run, via
`CLUSTERNAUTS_DATABASE_URL` or `DATABASE_URL`. Do not put a database URL in the
CrazyGames upload. To package against another backend, set
`CLUSTERNAUTS_BACKEND_ORIGIN` to an HTTPS server URL before running the package
command.

To rebuild the CrazyGames upload folder:

```sh
npm run package:crazygames
```

Upload the contents of:

```text
CrazyGames/
```

Do not zip or archive the folder; CrazyGames expects the loose generated files.

## itch.io Upload

To rebuild the itch.io staging folder and upload ZIP:

```sh
npm run package:itch
```

Upload:

```text
Itch/clusternauts-itch.zip
```

The ZIP contains `index.html` at the archive root. The itch build talks to the
same Cloud Run backend as CrazyGames by default. To package against another
backend, set `CLUSTERNAUTS_ITCH_BACKEND_ORIGIN` before running the package
command, then confirm the actual itch runtime origin is allowed by the backend
CORS policy.

## GamePix Upload

To rebuild the GamePix upload folder:

```sh
npm run package:gamepix
```

Upload the contents of:

```text
GamePix/build.zip
```

The GamePix build talks to the same Cloud Run backend by default. To package
against another backend, set `CLUSTERNAUTS_GAMEPIX_BACKEND_ORIGIN` before
running the package command.

## Tests

```sh
npm run test:physics:framerate
npm run check:file-sizes
```

## Repo Layout

```text
frontend/       editable game frontend source and generated client bundles
backend/src/    backend server implementation
backend/server.js  backend bundle loader
CrazyGames/     generated CrazyGames upload folder
Itch/          generated itch.io staging folder and upload zip
GamePix/       generated GamePix upload folder
scripts/        build and packaging scripts
docs/           extra project notes
```

For more detail, see `docs/deployment-layout.md`.
