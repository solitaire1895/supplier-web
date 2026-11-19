// Lesson 1.1 timeline: built from the real audio durations, so picture, sound and captions share one clock.
// Steps run in order: {n} narration line, {it, who} Italian TTS line, {w, tag} a beat with no voice.

export const STEPS = [
  { w: 1.3, tag: 'open' },                       // the book snaps open on the hotel
  { it: 'g01', who: 'giulia', bubble: 'Buongiorno! Come si chiama?', en: 'Hello! What’s your name?' },
  { w: 2.4, tag: 'spellEN' },                    // Orso spells O-R-S-O the English way
  { n: 'n01' },
  { w: .9, tag: 'turn1' },                       // page turn → alphabet spread
  { n: 'n02', tag: 'objectives' },
  { n: 'n03', tag: 'letters21' },
  { n: 'n04', tag: 'read' },
  { n: 'n05', tag: 'vowelsWrong' },
  { it: 'g02', who: 'giulia', vowel: 0 }, { it: 'g03', who: 'giulia', vowel: 1 }, { it: 'g04', who: 'giulia', vowel: 2 },
  { it: 'g05', who: 'giulia', vowel: 3 }, { it: 'g06', who: 'giulia', vowel: 4 },
  { n: 'n06', tag: 'swap' },
  { w: 1.0, tag: 'swapped' },
  { w: .9, tag: 'turn2' },                       // → the street of letters
  { it: 'g07', who: 'giulia', letter: 'H' }, { n: 'n07', letter: 'H' },
  { it: 'g08', who: 'giulia', letter: 'CG' }, { n: 'n08', letter: 'CG' },
  { it: 'g09', who: 'giulia', letter: 'Q' }, { n: 'n09', letter: 'Q' },
  { it: 'g10', who: 'giulia', letter: 'R' }, { n: 'n10', letter: 'R' },
  { w: 1.4, tag: 'motorbike' },
  { it: 'g11', who: 'giulia', letter: 'Z' }, { n: 'n11', letter: 'Z' },
  { n: 'n12', tag: 'strip' },
  { w: .9, tag: 'turn3' },                       // → the map
  { n: 'n13', tag: 'map' },
  { it: 'g12', who: 'giulia', tag: 'cities' },
  { n: 'n14', tag: 'doppia' },
  { w: .9, tag: 'turn4' },                       // → back to the hotel
  { it: 'g13', who: 'giulia', bubble: 'Come si scrive?', en: 'How do you spell it?' },
  { it: 'o01', who: 'orso', tag: 'spellIT', bubble: 'O come Otranto, erre come Roma, esse come Savona, O come Otranto!' },
  { it: 'g14', who: 'giulia', bubble: 'Perfetto, grazie!', en: 'Perfect, thanks!' },
  { w: .6, tag: 'key' },
  { n: 'n15', tag: 'keyWin' },
  { n: 'n16', tag: 'quiz' },
  { w: 3.4, tag: 'countdown' },
  { it: 'g15', who: 'giulia', tag: 'answer', bubble: 'Acca, come hotel!' },
  { n: 'n17', tag: 'star' },
  { n: 'n18', tag: 'recap' },
  { it: 'o02', who: 'orso', bubble: 'Andiamo!', tag: 'andiamo' },
  { w: 1.6, tag: 'close' },
];

export const GAP = .12;   // breath between voiced steps

/** Places every step on the clock. durs = {n01: s, g01: s, ...}. Returns {cues, DUR, at(tag)}. */
export function buildTimeline(durs) {
  let t = 0; const cues = [];
  for (const s of STEPS) {
    const id = s.n || s.it, d = id ? durs[id] : s.w;
    if (id && d == null) throw new Error(`no duration for ${id}`);
    cues.push({ ...s, id, t0: t, t1: t + d });
    t += d + (id ? GAP : 0);
  }
  const at = tag => cues.find(c => c.tag === tag);
  return { cues, DUR: t + .3, at };
}
