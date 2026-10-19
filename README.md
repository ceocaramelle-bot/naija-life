# NAIJA LIFE

Your City. Your Story. Your Rules.

Nigerian open-world life sim for Android phone browsers. **Phase 2 build: single player, landscape only, real map data pipeline.**

## Stack
- Frontend: plain HTML, CSS and JavaScript ES modules. Three.js r160 from jsDelivr (pinned). No build step.
- Hosting: GitHub Pages (static). It cannot run a game server.
- Backend (Phase 8, not built): Supabase. The ₦100,000 start bonus will be granted by a server function, once per account.
- World data: OpenStreetMap (ODbL). Attribution "© OpenStreetMap contributors" is shown in the game. No Google Maps scraping.
- Look: blocky, Minecraft-style. Original designs only.

## Repository structure
```
index.html
css/style.css
js/main.js        game loop, HUD, panels, camera, map UI, routing UI
js/world.js       chooses real-map world or hand-built fallback district
js/geoworld.js    builds roads, bridges, buildings, parks from a district file
js/geo.js         latitude/longitude <-> game metres (the ONE conversion used everywhere)
js/osmconvert.js  OpenStreetMap JSON -> district file
js/roadgraph.js   road widths, road graph, A* routing, road clearance
js/collision.js   circle/point collision against boxes and building footprints
js/util3d.js      shared helpers (sky, labels, kiosks)
js/layout.js      hand-built fallback district data
js/player.js, js/controls.js, js/minimap.js, js/storage.js
tools/import.html map importer page (run it on GitHub Pages)
data/worlds.json  world registry
data/districts/abuja-center.json   <- YOU create this with the importer
README.md, PROGRESS.md
```

## Phase 2 files
New: js/geo.js, js/collision.js, js/roadgraph.js, js/osmconvert.js, js/util3d.js, js/geoworld.js, tools/import.html.
Replaced in full: index.html, css/style.css, js/main.js, js/world.js, js/minimap.js, data/worlds.json, README.md, PROGRESS.md.
Unchanged from Phase 1: js/layout.js, js/player.js, js/controls.js, js/storage.js.

## Upload the new and replaced files
1. For a replaced file: open it on GitHub, tap the pencil, select all, delete, paste the new contents, commit.
2. For a new file: **Add file > Create new file**, type the full path (e.g. `js/geo.js`), paste, commit.

## Make the real Abuja district (one time)
1. Open `https://YOUR-USERNAME.github.io/naija-life/tools/import.html` on your phone.
2. The default coordinates are only an approximate point near central Abuja. Open Google Maps, press and hold the exact spot you want, copy the two numbers shown, and paste them in (latitude first).
3. Tap **Fetch from OpenStreetMap**. Check the counts and the preview picture look like that place. Orange lines are bridges or flyovers.
4. Tap **Download district file**.
5. In your repository open the `data` folder, then **Add file > Upload files** (or create `data/districts/abuja-center.json` and paste). The final path must be exactly `data/districts/abuja-center.json`. Commit.
6. Open the game, wait about a minute after the commit, and reload. The start screen should say "Loaded OpenStreetMap data: N roads, M buildings...".
If the file is missing or unreadable, the game safely falls back to the hand-built Phase 1 district and tells you.

## Test list
1. Start screen shows the loaded counts (or the fallback notice) and "Map data © OpenStreetMap contributors (ODbL)".
2. Tap Play: you spawn on a road. Roads, buildings and parks are visible. You cannot walk through buildings.
3. A Suya Spot and a Bank ATM are on open ground near you (yellow dots on the minimap). Buying suya costs ₦1,500.
4. Open the map: drag to pan, +/- to zoom, tap a spot. A blue route follows the roads and a yellow beam marks the destination. Walk there: "You have arrived".
5. Orange-brown raised decks are bridges (look from a distance). They are not walkable yet.
6. Reload: balance and position are kept; the ₦100,000 is not added again.

## Known limitations (Phase 2)
- Data is as mapped in OpenStreetMap: incomplete or out of date in places. Not verified on the ground.
- Bridges and flyovers are drawn raised with ramps and pillars, but the character stays on the ground, so you cannot climb or drive on them yet (planned with vehicles). Tunnels are not drawn in 3D.
- No sidewalks, crossings, traffic-light models, streetlights or road signs in 3D yet. Signals and crossings appear on the map when OSM has them.
- Routing uses road connections as mapped and ignores one-way rules (walking route). Search and place filters are planned.
- Buildings are flat-coloured extrusions with estimated heights, no windows or interiors. Complex (multipolygon) buildings are skipped. The nearest 1200 buildings are drawn.
- Money and saves are still stored on the device only (Phase 8 adds a server).
- Terrain is flat; no elevation data yet.
- 
