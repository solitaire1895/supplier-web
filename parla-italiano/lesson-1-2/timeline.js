// Lesson 1.2 timeline: built from the real audio durations, so picture, sound and captions share one clock.
// Steps run in order: {n} narration line, {it, who} Italian TTS line, {w, tag} a beat with no voice.
// Spreads: 0 café · 1 vowels · 2 stress street · 3 doubles stage.

export const STEPS = [
  { w: 1.3, tag: 'open' },
  { it: 'o01', who: 'orso', bubble: 'Mio nono ha un gatto nero!' },
  { w: 2.0, tag: 'laugh' },                      // Giulia laughs: "nono = NINTH?!"
  { n: 'n01', tag: 'hookVO' },
  { w: .9, tag: 'turn1' },                       // → vowels
  { n: 'n02', tag: 'objectives' },
  { n: 'n03', tag: 'glide' },
  { it: 'g01', who: 'giulia', tag: 'vowels' },
  { n: 'n04', tag: 'final' },
  { it: 'g02', who: 'giulia', tag: 'notte' },
  { n: 'n05', tag: 'openClosed' },
  { w: .9, tag: 'turn2' },                       // → stress street
  { n: 'n06', tag: 'stress' },
  { it: 'g03', who: 'giulia', tag: 'syl1' },
  { n: 'n07', tag: 'further' },
  { it: 'g04', who: 'giulia', tag: 'syl2' },
  { n: 'n08', tag: 'accents' },
  { it: 'g05', who: 'giulia', tag: 'syl3' },
  { n: 'n09', tag: 'bonus' },
  { w: .9, tag: 'turn3' },                       // → doubles stage
  { n: 'n10', tag: 'doubles' },
  { it: 'g06', who: 'giulia', tag: 'papa' },
  { it: 'g07', who: 'giulia', tag: 'nono' },
  { n: 'n11', tag: 'mistake' },
  { n: 'n12', tag: 'trick' },
  { it: 'g08', who: 'giulia', tag: 'gatto' },
  { w: .9, tag: 'turn4' },                       // → back to the café
  { it: 'o02', who: 'orso', bubble: 'Un caffè, per favore.', en: 'A coffee, please.', tag: 'order' },
  { it: 'g09', who: 'giulia', bubble: 'Ecco! Perché è in Italia?', en: 'Here you go! Why are you in Italy?', tag: 'ecco' },
  { it: 'o03', who: 'orso', bubble: 'Per studiare l’italiano! Mio nonno è italiano.', en: 'To study Italian! My grandpa is Italian.', tag: 'answerIT' },
  { w: .6, tag: 'clap' },
  { n: 'n13', tag: 'win' },
  { n: 'n14', tag: 'quiz' },
  { w: 3.4, tag: 'countdown' },
  { it: 'g10', who: 'giulia', tag: 'answer' },
  { n: 'n15', tag: 'star' },
  { n: 'n16', tag: 'recap' },
  { n: 'n17', tag: 'next' },
  { it: 'o04', who: 'orso', bubble: 'Ciao, nonno!', tag: 'ciao' },
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
