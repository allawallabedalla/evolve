// Nativer Prüfstand für den Paritätstest (esp32/tools/parity.mjs), nur [env:native*].
//
//   program rng <seed> <count>        -> eine uint32 je Zeile
//   program fitness < samples.txt     -> eine Fitness je Zeile (26 Gene + 16 Umweltwerte je Zeile)
//   program run <seed> <gens> <N> <16 Umweltwerte> [uniform|gaussian]
//                                     -> Mittelwert-Genom (26 Werte), dann describe()
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#include "describe.h"
#include "fitness.h"
#include "population.h"
#include "rng.h"

static const int ENV_N = 16;

static void set_env(Environment &e, const double *v) {
  real *f[ENV_N] = {&e.temperature, &e.predation, &e.foodAbundance, &e.foodHeight, &e.light, &e.water,
                    &e.toxicity,    &e.oxygen,    &e.salinity,      &e.uv,         &e.pressure, &e.aridity,
                    &e.radiation,   &e.fire,      &e.frost,         &e.wind};
  for (int k = 0; k < ENV_N; k++) *f[k] = real(v[k]);
}

int main(int argc, char **argv) {
  if (argc >= 4 && !strcmp(argv[1], "rng")) {
    Mulberry32 r((uint32_t)strtoul(argv[2], nullptr, 10));
    long n = atol(argv[3]);
    for (long i = 0; i < n; i++) printf("%u\n", r.next_u32());
    return 0;
  }
  if (argc >= 2 && !strcmp(argv[1], "fitness")) {
    const int G = phys::NUM_GENES;
    double v[G + ENV_N];
    real t[G];
    for (;;) {
      for (int k = 0; k < G + ENV_N; k++)
        if (scanf("%lf", &v[k]) != 1) return 0;
      for (int k = 0; k < G; k++) t[k] = real(v[k]);
      Environment e;
      set_env(e, v + G);
      printf("%.17g\n", (double)fitness(t, e));
    }
  }
  if (argc >= 5 + ENV_N && !strcmp(argv[1], "run")) {
    uint32_t seed = (uint32_t)strtoul(argv[2], nullptr, 10);
    int gens = atoi(argv[3]);
    PopulationConfig cfg;
    cfg.size = atoi(argv[4]);
    double v[ENV_N];
    for (int k = 0; k < ENV_N; k++) v[k] = atof(argv[5 + k]);
    if (argc > 5 + ENV_N) cfg.founderUniform = strcmp(argv[5 + ENV_N], "gaussian") != 0;
    Environment e;
    set_env(e, v);
    Population pop(cfg, seed);
    for (int i = 0; i < gens; i++) pop.step(e);
    real m[phys::NUM_GENES];
    pop.mean(m);
    for (int g = 0; g < phys::NUM_GENES; g++) printf("%.17g\n", (double)m[g]);
    char d[128];
    describe(m, d, sizeof d);
    printf("%s\n", d);
    return 0;
  }
  fprintf(stderr, "Aufruf: rng <seed> <n> | fitness < datei | run <seed> <gens> <N> <16 Umweltwerte>\n");
  return 2;
}
