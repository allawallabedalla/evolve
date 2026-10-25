#include "describe.h"

#include <stdio.h>
#include <string.h>

struct Axis {
  int idx;
  const char *hi;
  const char *lo;  // nullptr = keine Unterseite
  real hiT;
  real loT;
};

// Reihenfolge und Schwellen wie AXES in world/describe.ts
static const Axis AXES[] = {
    {1, "groß", "winzig", real(0.62), real(0.22)},
    {4, "gepanzert", nullptr, real(0.55), 0},
    {0, "isoliert", nullptr, real(0.6), 0},
    {8, "geflügelt", nullptr, real(0.5), 0},
    {7, "verholzt", nullptr, real(0.62), 0},
    {3, "hochaktiv", "träge", real(0.72), real(0.18)},
    {2, "gliedmaßenreich", nullptr, real(0.66), 0},
    {9, "leuchtend", nullptr, real(0.5), 0},
};

const char *kingdomOf(const real *g) {
  const real size = g[1], photo = g[5], mob = g[6];
  if (photo > real(0.45) && mob < real(0.4)) return "Pflanze";
  if (mob > real(0.45) && photo < real(0.4)) return "Tier";
  if (photo < real(0.45) && mob < real(0.4)) return size < real(0.18) ? "Mikrobe" : "Pilz";
  return "Protist";
}

int describeGenes(const real *g, int genes[3], bool high[3]) {
  int n = 0;
  for (const Axis &a : AXES) {
    if (n == 3) break;
    const real v = g[a.idx];
    if (v >= a.hiT) {
      genes[n] = a.idx;
      high[n++] = true;
    } else if (a.lo && v <= a.loT) {
      genes[n] = a.idx;
      high[n++] = false;
    }
  }
  return n;
}

void describe(const real *g, char *out, size_t len) {
  int genes[3];
  bool high[3];
  const int n = describeGenes(g, genes, high);
  const char *traits[3];
  for (int i = 0; i < n; i++) {
    for (const Axis &a : AXES)
      if (a.idx == genes[i]) traits[i] = high[i] ? a.hi : a.lo;
  }
  char desc[96];
  if (n == 0) {
    snprintf(desc, sizeof desc, "generalistisch");
  } else {
    desc[0] = 0;
    for (int i = 0; i < n; i++) {
      if (i) strncat(desc, ", ", sizeof desc - strlen(desc) - 1);
      strncat(desc, traits[i], sizeof desc - strlen(desc) - 1);
    }
  }
  snprintf(out, len, "%s · %s", kingdomOf(g), desc);
}
