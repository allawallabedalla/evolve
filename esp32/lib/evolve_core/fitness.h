// Fitness-Funktion – Port von engine/fitness.ts. Physik-Konstanten aus physics.h.
#pragma once
#include "evo_real.h"

// Umwelt-Regler (engine/types.ts Environment). Optionale TS-Felder mit ihrem Default.
struct Environment {
  real temperature = real(0.5);
  real predation = real(0.3);
  real foodAbundance = real(0.5);
  real foodHeight = real(0.2);
  real light = real(0.5);
  real water = real(0.6);
  real toxicity = 0;
  real oxygen = 1;
  real salinity = 0;
  real uv = 0;
  real pressure = 0;
  real aridity = 0;
  real radiation = 0;
  real fire = 0;
  real frost = 0;
  real wind = 0;
};

real fitness(const real *traits, const Environment &env);
