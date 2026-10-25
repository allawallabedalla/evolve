// Simulation im eigenen FreeRTOS-Task: ein Generationsschritt pro Sekunde.
// LVGL läuft im Arduino-loop() und liest nur Schnappschüsse (sim_snapshot).
#pragma once
#include <stdint.h>

#include "evo_real.h"
#include "fitness.h"
#include "physics.h"

struct SimSnapshot {
  uint32_t generation;
  float meanFitness;
  float stepMs;
  real mean[phys::NUM_GENES];
  char desc[96];
};

void sim_start(uint32_t seed);

// Kopie des letzten Stands; false, solange noch keine Generation gelaufen ist
bool sim_snapshot(SimSnapshot &out);

void sim_set_env(const Environment &env);
Environment sim_get_env();
