// Kurzbeschreibung des Wesens – Port von world/describe.ts. Texte in UTF-8.
#pragma once
#include <stddef.h>
#include <stdint.h>

#include "evo_real.h"

const char *kingdomOf(const real *g);

// Reiche als Zahl (Reihenfolge = KINGDOM_NAMES)
enum Kingdom : uint8_t { K_PFLANZE, K_TIER, K_PILZ, K_MIKROBE, K_PROTIST, K_COUNT };
extern const char *const KINGDOM_NAMES[K_COUNT];
Kingdom kingdomIdOf(const real *g);

// „Ist das dieselbe Art?“ – wie formKey() in world/describe.ts: Reich + ALLE
// hervorstechenden Merkmale (nicht nur die ersten drei), als Zahl.
uint32_t formKeyCode(const real *g);

// "Reich · Merkmal, Merkmal, Merkmal" in out (wird immer nullterminiert)
void describe(const real *g, char *out, size_t len);

// Die Gene, die describe() als Merkmal nennt (höchstens 3, in Reihenfolge).
// high[i] = true für die Oberseite ("groß"), false für die Unterseite ("winzig").
int describeGenes(const real *g, int genes[3], bool high[3]);
