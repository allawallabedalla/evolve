// Kurzbeschreibung des Wesens – Port von world/describe.ts. Texte in UTF-8.
#pragma once
#include <stddef.h>

#include "evo_real.h"

const char *kingdomOf(const real *g);

// "Reich · Merkmal, Merkmal, Merkmal" in out (wird immer nullterminiert)
void describe(const real *g, char *out, size_t len);

// Die Gene, die describe() als Merkmal nennt (höchstens 3, in Reihenfolge).
// high[i] = true für die Oberseite ("groß"), false für die Unterseite ("winzig").
int describeGenes(const real *g, int genes[3], bool high[3]);
