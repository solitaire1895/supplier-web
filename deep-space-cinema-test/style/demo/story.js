// Journey Through the Unknown · timeline (single source of truth for picture, sound events and the mix)
export const DUR = 15;

// Shots: [t0, t1, name]
export const SHOTS = [
  [0.0, 5.0, 'emerge'],   // wide, long lens: the ship slides out from behind the planet's limb
  [5.0, 10.0, 'hull'],    // low three-quarter: slow push along the hull toward the engine block
  [10.0, 15.0, 'jump'],   // behind the engines: build, held breath, hyperspace
];
export const shotAt = t => SHOTS.find(s => t >= s[0] && t < s[1]) || SHOTS[SHOTS.length - 1];

// Key times
export const T = {
  fadeIn: [0, 1.2],
  build: [10.0, 11.35],    // engines climb from cruise to peak
  hold: [11.35, 11.75],    // held breath: near-silence, engines at peak
  jump: 11.75,             // release: the ship accelerates
  flash: 12.45,            // the ship vanishes into the vanishing point
  settle: [12.6, 13.8],    // streaks retract, stars settle back
  fadeOut: [14.45, 15.0],
};

// Sound events for the mix (t in seconds)
export const SFX = [
  { t: 0.0, type: 'bed' },
  { t: 0.15, type: 'swellLow', dur: 4.6 },
  { t: 1.6, type: 'pass', dur: 3.2, pan: .5 },      // the ship's hum rising as it clears the limb
  { t: 5.0, type: 'cutHit', pan: 0 },
  { t: 5.0, type: 'hullHum', dur: 5.0 },
  { t: 6.2, type: 'beep', pan: -.4 }, { t: 8.1, type: 'beep', pan: .3 },
  { t: 7.4, type: 'servo', pan: .4 },
  { t: 10.0, type: 'cutHit', pan: 0 },
  { t: 10.0, type: 'engineRise', dur: 1.35 },
  { t: 11.35, type: 'hold', dur: .4 },
  { t: 11.75, type: 'boom', pan: 0 },
  { t: 11.75, type: 'whoosh', dur: .9, pan: 0 },
  { t: 12.45, type: 'flash', pan: 0 },
  { t: 12.6, type: 'tail', dur: 2.4 },
];
