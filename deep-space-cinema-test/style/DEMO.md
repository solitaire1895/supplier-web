# Deep Space Cinema — demo film: Journey Through the Unknown

One example among many. Don't reuse its story, arc, shots, props or timings.

**Story:** a vast fictional cruiser slides out from behind a planet's limb. The camera runs its hull, the engines gather power, there's one held breath, and it jumps to hyperspace. The stars stream into lines, then settle back on an empty sky. 15 s, no text, no voice.

**Shots:** (1) wide long-lens emergence, with the planet drawn over the ship (a matte cheat: depthTest off for that shot only); (2) low three-quarter hull run from bow to engines; (3) behind the engines: build, hold, jump, flash, settle.

**Palette:** steel greys under a warm hard sun (#fff1e0); engines, windows and the trail in ice blue → violet (#6fd6ff → #a48cff); a teal and magenta nebula, dim; a few cream windows.

**Score:** synthesized. Sub drone + a throaty hum on 41.2 Hz, pads (D-minor add9 → B-flat major 7 → D major), a brass-like swell from a saw stack opening its low-pass, a boom with a pitch drop, a whoosh, a reverse swell, a flash shimmer. The mix cuts every tail during the held breath.

## Build notes

- `sh build.sh` (set `LIB` to the library). Under SwiftShader (no GPU), a 2×-supersampled frame takes about 5–8 s.
- `mix.py` normalises loudness itself (BS.1770, gated) to −14 LUFS with a −1.3 dBTP ceiling, so `build.sh` can fall back to a plain ffmpeg encode when only ffmpeg 6.x is installed.
- Low end: a zero-phase low shelf keeps 20–120 Hz around −3 dB per octave relative to the rest (a minimum-phase shelf only half-cancels because of its phase shift).

## Which file draws what

| File | Draws |
|---|---|
| `space.js` | Nebula baked into a cube map once; per-pixel stars (three layers, sized to the pixel); the sun; hyperspace streaks around a vanishing direction; the planet surface (fbm continents, cloud bands, terminator, night lights, limb haze) and the atmosphere shell; the environment map bake |
| `ship.js` | Procedural panel maps (plate split, seams, vents, rivets); the hull swept from superellipse cross-sections (UVs in world units); dorsal ridge, bridge, keel, nacelles on pylons; sparse greebles; windows drawn in the hull shader from local position and normal, with flicker; hangar bays, beacons, engines (nozzle, throat, additive plume, halo) |
| `main.js` | Lights and shadows, post (bloom, vignette, grade), the three shots, the jump (stretch from the tail, trail, flash, warp), `render(t)` |
| `story.js` | Timeline and sound events |
| `mix.py` | The whole soundtrack and the loudness |
