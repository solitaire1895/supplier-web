# Deep Space Cinema 深空电影 — Style Prompt

Made from a blank page; techniques from Glass Product Render (glass-product) in Lemo-Opuscar, with the star field and haze ideas of Low-poly Isometric Island (lowpoly-island).

> Feature-film space cinematography rendered in real-time 3D: one vast, finely detailed starship against a planet, nebulae and deep star fields, lit by a single distant sun, filmed with slow, heavy camera moves; light (engines, windows, hyperspace) is the only colour that burns.
> References (grammar only): the slow establishing shots of large-scale space features; matte-painting nebulae; long-lens ship fly-bys. Copy none of their ships, silhouettes, logos, music or type, and never name them in the film.

## 1. Essence, and what it is not

**Scale and silence.** A single hero vessel, many times larger than the camera, drifting through a real-feeling void: a planet's limb glowing with atmosphere, layered nebulae, stars at three depths. Its hull is panelled metal that catches hard sunlight on one side and falls into near-black on the other; its life shows as light: engines, window rows, beacons. Everything is slow until one release of energy.

It is **not** a cartoon, a HUD or wireframe, a product-studio render, or a neon synthwave poster. No text on screen unless the film needs a title. The ship is always **fictional**: never a known franchise's silhouette, markings or name.

## 2. Materials & rendering

- **three.js r170**, `MeshPhysicalMaterial`, Neutral tone mapping, 2× supersampling, bloom only above ~1.0, physical depth of field (`core/three/post.js`).
- **Hull**: sleek and streamlined. Long forms swept from superellipse cross-sections (a long taper to a fine bow, a dorsal ridge, nacelles on swept pylons), not stacked boxes. Metalness ~0.5, roughness 0.35–0.7 from procedural canvas maps: plate seams (dark in colour, recessed in bump), vents, rivets, plate tint variation. Greebles are sparse, kept to the engine section. Never one smooth material: the eye reads scale from panel density.
- **Scale cues**: thousands of tiny windows (instanced or texture-based emission) in rows, docking-bay recesses, antenna masts, navigation beacons that blink slowly (red port, green starboard, white strobe).
- **Engines**: nozzles with an emissive inner throat (white-hot core → ice-blue), additive plume cones and sprite halos; a faint heat shimmer is optional. Light **leaks onto the hull** around them (a blue point light per engine cluster).
- **Light**: one directional "sun", warm white (≈ #fff1e0), hard-edged; a very weak cool fill (≈ 2–4 % of key) so the shadow side is near-black but not dead. No ambient grey wash. The environment map is a baked image of the space backdrop itself (`PMREMGenerator.fromScene`), so metal reflects the nebula and planet.
- **Planet**: a sphere with a procedural surface (fbm continents/cloud bands in muted tones), a Fresnel atmosphere shell (thin, bright on the sunlit limb), and a terminator; the night side may show faint city or lightning specks.
- **Backdrop**: a large inverted sphere with a shader: three layers of stars (dense dim dust, mid stars, a few bright ones with small diffraction spikes), and nebulae from domain-warped fbm in two dim hues. Stars never twinkle; they are steady points.
- **Post**: bloom (strength 0.5–0.9, threshold ~1.0), subtle anamorphic horizontal streak on the brightest lights, vignette, gentle contrast; grain 1–2 in `mux.sh`. No chromatic aberration beyond a hair.

## 3. Colour logic

- The world is neutral: steel greys, the warm white of the sun, deep blue-black space (never pure #000 in a wide: ≈ #03050a).
- **One light colour family, reserved for energy**: ice blue → soft violet (≈ #6fd6ff → #a48cff) for engines, windows, the hyperspace trail and their glow on the hull. Windows may be a warmer cream only in small numbers (crew quarters).
- **Nebulae**: deep teal and magenta, low saturation and dim (they sit behind, never compete with the ship). The planet in muted earth or ice tones.
- The sunlit hull side is the brightest non-emissive surface; the engines are the brightest thing in the frame.

## 4. Type & subtitles

- **Off by default.** A film without a title shows no text.
- **Titles**: ultra-thin (200), very wide-tracked capitals in an OFL face (Exo 2 or Inter Tight), 90–130 px, centred in the lower or upper third over empty space; they fade in over ~1 s while a slow ice-blue glint crosses the letters. Small tracked caps (18–20 px) for kickers and credits.
- **Subtitles** (only if there is dialogue): white, light weight, ~38 px, a soft dark shadow, no box, bottom centre. Hold ≥ max(1.8 s, speech + 0.6 s).

## 5. Motion quality

- **24 fps, everything eased, everything heavy.** Big things move slowly: the ship crosses the frame over seconds, with tiny drift in roll and pitch. Nothing snaps except the hyperspace release.
- **The camera always moves**: slow push-ins, tracks along the hull, crane-ups past the planet's limb. Never handheld; at most a few frames of low-frequency shake at the hyperspace release.
- **Life on the hull**: windows flicker on/off in small clusters, beacons blink on a slow rhythm, engines breathe (±5 % intensity).
- **Build and release**: energy gathers (engine glow climbing, a low swell) before it's let go in one fast move.
- Dissolves (≤ 1 s) are allowed between shots; cuts land on the score's accents.

## 6. Camera grammar

A vocabulary, not a route. Opening and ending come from the topic.

| Move | Expresses | Can serve |
|---|---|---|
| Wide, long lens, ship emerging from behind a planet or moon | Discovery, scale | an arrival; a first sighting |
| Slow push along the hull, close, wide-angle | Size, detail, craft | a reveal; crew life |
| Low angle under the ship as it passes over camera | Weight, menace, awe | a flagship; a threat |
| Engine close-up from behind, rack focus to the stars ahead | Power, intent | a departure; a decision |
| Long lens, ship tiny against a vast nebula | Loneliness, the unknown | an ending; a question |
| Crane up past the planet's limb into the sun | Hope, a new beginning | a dawn; a title |
| Hyperspace POV: stars stretching to lines | Release, speed | a jump; a climax |

Framing: the ship in a strong diagonal or entering from a frame edge; the planet anchors a lower or side third; leave negative space in the direction of travel. At key moments the ship fills at least a third of the frame height.

## 7. Sound palette

- **Cinematic sound design, synthesized in code**: sub-bass engine drone (30–60 Hz with 2nd/3rd harmonics so it speaks on small speakers), a slow beating hum (two detuned sines), airy space pads (filtered noise + soft detuned saws), a slow low-brass-like swell (stacked saws, low-pass opening), a deep boom (pitched sine drop + noise), whooshes and a reverse swell into the release, a high shimmer for starlight.
- **Space is quiet**: the ambience bed is low and wide; sound grows as the camera gets close to the hull (doppler-ish pitch shift on passes).
- **Silence before release**: a near-silence of 0.3–0.6 s (a held breath) right before the hyperspace jump; the jump's boom is the loudest sound in the film.
- No voice unless the user asks. No piano-and-strings.
- **Mix**: −14 LUFS; keep 20–120 Hz around −3 dB relative to the rest; limit the boom's peak so loudnorm stays linear.

## 8. Native moves

A menu: use the ones your story needs.

- **Emergence.** The ship slides out from behind a planet's limb, its silhouette cutting the atmosphere glow. *Fits content like:* an arrival; a product reveal; a comeback.
- **Hull run.** A long close track along kilometres of panels, windows and trenches. *Fits content like:* scale of an organisation; a city in motion; craftsmanship.
- **Engine bloom.** The engines climb from idle to blinding, the glow washing over the hull. *Fits content like:* a launch; a decision; power-up.
- **Hyperspace stretch.** Stars elongate into glowing lines converging on a vanishing point, the ship leaving a blue trail, then a white flash. *Fits content like:* a jump to the next chapter; speed; a climax.
- **Eclipse.** The ship crosses the sun; a corona and god-rays edge its silhouette. *Fits content like:* a turning point; a reveal of shape.

## 9. Pitfalls of the medium

- A smooth hull reads as a toy → panel maps + greeble geometry + thousands of small lights; scale comes from detail density.
- A grey ambient light flattens everything → one hard key, almost no fill.
- Bloom on the whole frame turns space milky → bloom threshold ~1.0, only emissives exceed it.
- Twinkling or moving stars when the camera is still look like noise → steady stars, parallax only from the camera.
- Nebula too bright or saturated competes with the ship → dim, low saturation.
- Hyperspace lines that don't converge on one vanishing point look broken → stretch along the view direction in screen space from a single focus.
- Software WebGL (SwiftShader) is slow → keep the per-frame bake small (64–128 px env), instancing for windows, 2× SSAA only for finals.
- ffmpeg 6.x under-reports audio length in loudnorm (TECHNIQUE.md §1) → use ffmpeg 7+.

## 10. Engine

In `demo/`: `space.js` (backdrop shader: stars + nebula; planet + atmosphere; env bake), `ship.js` (swept superellipse hull, panel maps, windows in the hull shader, beacons, engines and plumes), `warp.js` (hyperspace star streaks and trail), `main.js` (shots, cameras, lights, post, render(t)), `story.js` (timeline and sound events shared with the mix), `mix.py` (synthesized score and sound design), `build.sh`. Techniques from `$LIB/styles/glass-product/demo/` (post, emissive pulse shaders) and `$LIB/core/three/post.js`.

## 11. Variation space

You decide the ship (always fictional), the planet, the nebula hues within the colour logic, the structure, opening, ending, camera path and score.

- Structures: **a single journey** (arrival → close look → departure); **a fleet** (one ship, then the scale of many); **a signal** (a dark ship wakes up light by light).
- Openings: **sound first** (black, the hum, then the planet's limb lights up); **macro first** (one window, pulling back to the whole ship); **eclipse** (a silhouette against the sun).
- Endings: **jump** (hyperspace, the stars settle back); **long lens** (the ship tiny in the nebula); **arrival** (a new planet rising).
