// Lern-Text zum Wesen: was es ist, was es prägt und was die Welt damit zu tun hat.
// Gen-Erklärungen kommen aus der Browser-App (include/gene_texts.h, generiert).
#pragma once
#include <stddef.h>

#include "fitness.h"
#include "sim.h"

void explain_creature(const SimSnapshot &s, const Environment &env, char *out, size_t len);
