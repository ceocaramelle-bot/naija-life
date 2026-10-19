# NAIJA LIFE progress ledger

## Completed
- Phase 0: architecture decisions (README).
- Phase 1: start screen, landscape lock, blocky character, joystick, camera, collision, HUD, minimap, local save, one-time ₦100,000, Suya Spot and ATM. (Delivered; not yet confirmed on a device.)
- Phase 2 (delivered, awaiting device test): geographic pipeline.

## Phase 2 systems
- js/geo.js single coordinate conversion (lat/lon to local metres, z south).
- tools/import.html + js/osmconvert.js: OpenStreetMap (Overpass) to district file with road node ids, bridges, buildings, parks, places, signals, licence metadata.
- js/roadgraph.js: road graph, A* routing, road clearance.
- js/geoworld.js: ribbon roads with mitered joins, ranked draw order, raised bridge decks with ramps and pillars, extruded merged building footprints, parks, kiosks placed on free ground.
- js/collision.js: circle/point collision against boxes and polygon footprints.
- Full map: pan, zoom, tap-to-route along roads, destination beam, arrival detection.
- Fallback: hand-built Phase 1 district if the data file is missing.

## Tested so far
- Syntax check of every JS file and JSON: passed.
- Node tests on fake OSM data: projection round-trip correct; converter produced roads/buildings/places; A* route 441 m vs about 443 m expected; road clearance correct; polygon collision pushes the character out of a building and detects camera-inside and above-roof correctly.
- Wallet logic (Phase 1) in Node: passed.
- NOT run: the 3D scene, touch controls, importer page, or real Overpass data. These need your phone.

## Known bugs / risks
- Unknown until first device test. Likely first problems: Overpass timeouts for large radius, coordinates entered in the wrong order, performance on low-end phones.

## Next
- Fix issues from your test. Then Phase 3 (character creation and identity) or sidewalks/crossings/streetlights first, your choice.
