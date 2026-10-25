#include "explain.h"

#include <stdio.h>
#include <string.h>

#include "describe.h"
#include "gene_texts.h"

namespace P = phys;

struct KingdomText {
  const char *kingdom;
  const char *text;
};

// Reiche wie kingdomOf() in world/describe.ts
static const KingdomText KINGDOMS[] = {
    {"Pflanze", "Pflanzen holen sich ihre Energie aus Sonnenlicht und Wasser. Sie bleiben an einem Ort "
                "und müssen nicht jagen."},
    {"Tier", "Tiere bewegen sich und fressen andere Lebewesen. Beweglichkeit kostet viel Energie, "
             "erschließt aber Futter und Fluchtwege."},
    {"Pilz", "Pilze zersetzen totes Material und nehmen die Nährstoffe direkt auf. Sie brauchen weder "
             "Licht noch Beine, aber Feuchtigkeit."},
    {"Mikrobe", "Mikroben sind winzige Einzeller. Klein zu sein ist billig – darum kommen sie dort durch, "
                "wo für Größeres zu wenig da ist."},
    {"Protist", "Protisten sind Einzeller zwischen Pflanze und Tier: ein bisschen Licht nutzen, ein "
                "bisschen schwimmen. Oft ein Zwischenschritt, bevor sich eine Richtung durchsetzt."},
};

struct WorldText {
  real Environment::*field;
  const char *low;
  const char *high;
};

// Je Regler ein Satz für „wenig“ und „viel“ – nur Zusammenhänge, die engine/fitness.ts
// tatsächlich rechnet (Isolation braucht Stoffwechsel, Fell taugt nicht im Wasser,
// Leuchten nur im Dunkeln, Reichweite für hohes Futter, Verteidigung gegen Räuber).
static const WorldText WORLD[] = {
    {&Environment::temperature,
     "Es ist kalt: Wärmedämmung hilft, aber nur zusammen mit einem aktiven Stoffwechsel, der Wärme erzeugt.",
     "Es ist heiß: Fell und Dämmung würden hier nur überhitzen."},
    {&Environment::light, "Es ist dunkel: Photosynthese lohnt kaum, eigenes Leuchten kann Beute anlocken.",
     "Viel Sonnenlicht: Photosynthese lohnt sich."},
    {&Environment::water, "Trockenes Land: Pflanzen fehlt Wasser, an Land helfen Beine beim Futtersuchen.",
     "Tiefes Wasser: schlanke Schwimmer sind im Vorteil, Beine und Fell bringen hier wenig."},
    {&Environment::foodAbundance, "Futter ist knapp: jedes Merkmal kostet Energie, sparsame Baupläne gewinnen.",
     "Futter gibt es reichlich: auch aufwendige Körper können sich das leisten."},
    {&Environment::foodHeight, "Das Futter liegt am Boden: lange Beine braucht hier niemand.",
     "Das Futter hängt hoch: lange Gliedmaßen, Größe oder Flügel helfen."},
    {&Environment::predation, "Kaum Räuber: Panzer wäre nur Ballast.",
     "Viele Räuber: Panzer, Größe, Tarnung oder schnelle Flucht zahlen sich aus."},
};

// Kern-Gene (0–9) ruhen um 0.5, die bedingten Kosten-Gene (10–25) ohne ihren Stressor
// bei ~0.12 (mutationAnchor in engine/types.ts) – „prägend“ heißt deutlich darüber.
static float gene_score(int g, real v) {
  return g < 10 ? float(v) - 0.55f : float(v) - 0.35f;
}

static void append(char *out, size_t len, const char *s) { strncat(out, s, len - strlen(out) - 1); }

void explain_creature(const SimSnapshot &s, const Environment &env, char *out, size_t len) {
  out[0] = 0;
  const char *k = kingdomOf(s.mean);
  for (const auto &kt : KINGDOMS)
    if (!strcmp(kt.kingdom, k)) append(out, len, kt.text);

  // Erst die Merkmale aus dem Titel (describe), dann auf mindestens zwei auffüllen
  int shown[3];
  int n = 0;
  int titleGenes[3];
  bool high[3];
  const int nt = describeGenes(s.mean, titleGenes, high);
  for (int i = 0; i < nt; i++)
    if (high[i]) shown[n++] = titleGenes[i];  // Gen-Texte beschreiben die Oberseite
  while (n < 2) {
    int best = -1;
    for (int g = 0; g < P::NUM_GENES; g++) {
      bool used = false;
      for (int i = 0; i < n; i++) used |= shown[i] == g;
      if (used || gene_score(g, s.mean[g]) < 0) continue;
      if (best < 0 || gene_score(g, s.mean[g]) > gene_score(best, s.mean[best])) best = g;
    }
    if (best < 0) break;
    shown[n++] = best;
  }
  append(out, len, "\n\nPrägt es:");
  if (n == 0) append(out, len, "\nKein Merkmal sticht heraus – ein Allrounder.");
  char line[200];
  for (int i = 0; i < n; i++) {
    snprintf(line, sizeof line, "\n· %s: %s", texts::GENE_LABEL[shown[i]], texts::GENE_EXPLAIN[shown[i]]);
    append(out, len, line);
  }

  // Bis zu zwei auffällige Regler, der extremste zuerst
  append(out, len, "\n\nDeine Welt:");
  int pick[2] = {-1, -1};
  float dev[2] = {0, 0};
  for (int i = 0; i < int(sizeof WORLD / sizeof WORLD[0]); i++) {
    float d = float(env.*WORLD[i].field) - 0.5f;
    if (d < 0) d = -d;
    if (d < 0.25f) continue;
    if (d > dev[0]) {
      pick[1] = pick[0], dev[1] = dev[0];
      pick[0] = i, dev[0] = d;
    } else if (d > dev[1]) {
      pick[1] = i, dev[1] = d;
    }
  }
  if (pick[0] < 0) append(out, len, "\nAusgeglichen – kein Faktor drückt besonders.");
  for (int p : pick) {
    if (p < 0) continue;
    append(out, len, "\n");
    append(out, len, env.*WORLD[p].field < real(0.5) ? WORLD[p].low : WORLD[p].high);
  }

  snprintf(line, sizeof line,
           "\n\nGeneration %u. Du steuerst nur die Welt – das Wesen passt sich über Generationen selbst an.",
           s.generation);
  append(out, len, line);
}
