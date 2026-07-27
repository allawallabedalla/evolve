// ASCII-Umschrift erkennen, ohne echtes Deutsch fälschlich zu treffen. Ein naiver
// Substring-Test auf "ue"/"ae"/"oe" schlägt auf jedes Wort mit "au"+e (bauen,
// Sauerstoff -> "aue"), "eu"+e (Neue, steuert -> "eue") oder zufälligem "ue"/"oe"
// in der Wortmitte (zuerst, koexistieren, sexuell) an — bei der ersten Fassung
// (Paket P3) waren das ALLE 41 Erstmeldungen, keine einzige ein echter Fehler.
// Eine transliterierte Silbe hat stattdessen fast immer eines dieser Muster:
// "ä"->"ae" vor typischen Folgen (hnlich/nder/hig/hlt/ss/rt/ter/rb/rm/uch/ndig),
// "ö"->"oe" vor (ss/glich/he/rper/nn/hn/rd/n-Wortende),
// "ü"->"ue" vor (ck/hr/ss/nsch/ber/rde/brig/gel/tig/chte/llig/rlich/ndig).
// Gegengetestet an 31 echten Wörtern (0 Fehlalarme) und 27 echten Fehlern (24 erkannt).
const AE_MUSTER = /a(e)(hnlich|nder|ngst|nger|higkeit|hig|hlt|lt|hnen|ss|tt|rk|gl|rgern|rmlich|quivalen|sthet|ra|chst|lter|hre|sch|uch|ndig|rt|ter|rb|rm)/i;
const OE_MUSTER = /o(e)(glichkeit|glich|ss|gl|he|ht|rper|nn|hn|rd|kolog|konom|sophag|sen|st|se|n\b)/i;
const UE_MUSTER = /u(e)(berzeug|berschwemm|berschuss|bertrag|ck|hr|ss|nsch|ber|rde|brig|gel|hl|tig|chte|llig|rlich|hle|ndig|gung|nde|st)/i;

export function umschrift(t) {
  const out = [];
  for (const w of String(t).match(/[A-Za-zÄÖÜäöüß]+/g) || []) {
    if (/[äöüÄÖÜ]/.test(w)) continue;
    if (AE_MUSTER.test(w) || OE_MUSTER.test(w) || UE_MUSTER.test(w)) out.push(w);
  }
  return out;
}
