// Population – Port von world/population.ts (Klasse Population).
// Portiert ist genau der Pfad, den das Haustier der Live-App fährt (SWARM in
// app/index.html): gestreute oder gaußsche Gründer, Wright-Fisher-Reproduktion,
// Rekombination, gaußsche Mutation, mehrachsige Konkurrenz. Nicht portiert:
// Gründer-Los, Kanalisierung, envOf (Koevolution).
//
// Speicher: Genome als flaches Array [size * NUM_GENES], einmal beim Konstruieren
// allokiert, danach keine Allokation mehr je Generation.
#pragma once
#include <stdint.h>

#include "evo_real.h"
#include "fitness.h"
#include "physics.h"
#include "rng.h"

constexpr int MAX_COMPETITION_AXES = 8;

struct PopulationConfig {
  int size = 100;
  real mutationSd = real(0.05);
  real selPower = real(2.0);
  real recombProb = real(0.5);
  real startSpread = real(0.06);
  bool founderUniform = true;  // founderSpread "uniform" (sonst "gaussian" um start)
  bool competition = true;
  int numAxes = 8;
  int axes[MAX_COMPETITION_AXES] = {1, 2, 5, 6, 4, 8, 9, 15};  // SWARM.niche
  real sigmaC = real(0.22);
  real sigmaK = real(50);
  real kCenter = real(0.5);
};

class Population {
 public:
  static constexpr int G = phys::NUM_GENES;

  Population(const PopulationConfig &cfg, uint32_t seed, real start = real(0.5));
  ~Population();
  Population(const Population &) = delete;
  Population &operator=(const Population &) = delete;

  int size() const { return cfg_.size; }
  const real *genome(int i) const { return genomes_ + i * G; }

  // Population aus einem Genom neu befüllen (mit kleiner Streuung), wie seedFrom().
  void seedFrom(const real *genome, real spread);
  void seedFrom(const real *genome) { seedFrom(genome, cfg_.startSpread); }

  // Reproduktions-Gewichte (Fitness^selPower, ggf. /Konkurrenz) in weights().
  void computeWeights(const Environment &env);
  const real *weights() const { return w_; }

  // Eine Generation weiter: Selektion + Rekombination + Mutation.
  void step(const Environment &env);

  void mean(real *out) const;

 private:
  real randn();
  int pick(real total);
  void reproduce();

  PopulationConfig cfg_;
  Mulberry32 rng_;
  real *genomes_;
  real *next_;
  real *w_;
  real *cum_;
};
