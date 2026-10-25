// Kurzbeschreibung des Wesens – Port von world/describe.ts. Texte in UTF-8.
#pragma once
#include <stddef.h>

#include "evo_real.h"

const char *kingdomOf(const real *g);

// "Reich · Merkmal, Merkmal, Merkmal" in out (wird immer nullterminiert)
void describe(const real *g, char *out, size_t len);
