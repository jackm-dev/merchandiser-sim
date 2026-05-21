# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Appleton Merchandisers Simulator — a first-person 3D browser game where the player works as a field merchandiser inside a Walmart-style store. Built for Jack, who has real-world experience in field merchandising.

## Running the Game

```bash
npm run dev       # starts at http://localhost:3000
```

Click "Start Shift" to lock the mouse and enter the store. WASD to move, mouse to look, ESC to pause.

## Tech Stack

- **Three.js** — all 3D rendering
- **Vite** — dev server and build tool
- **Vanilla JavaScript** — no frameworks, keep it simple

Do not introduce React, TypeScript, or additional frameworks. Keep all 3D logic in plain JS with Three.js.

## File Structure

- `src/main.js` — scene, camera, renderer, animation loop
- `src/store.js` — entire store environment (floor, ceiling, walls, shelves, products, lighting)
- `src/player.js` — first-person movement with PointerLockControls and shelf collision

## Architecture Notes

- 1 unit = 1 meter in world space. Keep this consistent when adding geometry.
- The OTC medicine aisle runs along the z-axis, centered at x=0. Left gondola at x≈-1.925, right at x≈+1.925.
- Products face the aisle center. Left gondola products face +x (index 0 of materials array = front). Right gondola is rotated 180° so the same index works.
- `PLANOGRAM` array in store.js controls which product sits on which shelf level (index 0 = bottom shelf).
- Canvas textures for products are cached in `_texCache` — create once, reuse across all instances of the same product.
- Collision boxes for shelves are defined in `player.js` as `[minX, maxX, minZ, maxZ]` arrays.

## OTC Products (Fictional Brands)

| Product | Real equivalent | Shelf level |
|---|---|---|
| AllerClear 24HR | Zyrtec (cetirizine) | 3 — eye level, hero product |
| AllerClear-D | Zyrtec-D | 4 — top |
| PollenBlock | Claritin (loratadine) | 2 |
| HistaStop PM | Benadryl (diphenhydramine) | 1 |
| NasaClear Spray | Flonase (fluticasone) | endcap |
| ClearAir Generic | Store brand cetirizine | 0 — bottom |

## Roadmap

**Phase 1 — Complete:** Store environment, first-person movement, OTC aisle with planogram, endcap display.

**Phase 2 — Next:** Company tablet UI (press E), task system with 3 task types:
1. OSA Check — find out-of-stock gaps, restock from backroom
2. PDQ Endcap Setup — pick up display from receiving, place on endcap
3. Category Reset — follow planogram on device, pull and re-slot products

**Phase 3:** Full task suite working end-to-end with scoring.

**Phase 4:** Polish — sound effects, NPC manager, store announcements.
