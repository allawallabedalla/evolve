// Port von world/population.ts. Zufallszahlen werden in exakt derselben Reihenfolge
// gezogen wie dort – nur so bleibt der double-Build auf derselben Bahn wie TS.
#include "population.h"

#include <cmath>

static inline real clamp01(real x) { return x < 0 ? real(0) : x > 1 ? real(1) : x; }

Population::Population(const PopulationConfig &cfg, uint32_t seed, real start)
    : cfg_(cfg), rng_(seed) {
  const int N = cfg_.size;
  genomes_ = new real[N * G];
  next_ = new real[N * G];
  w_ = new real[N];
  cum_ = new real[N];
  if (cfg_.founderUniform) {
    for (int i = 0; i < N * G; i++) genomes_[i] = rng_.next();
  } else {
    for (int i = 0; i < N * G; i++) genomes_[i] = clamp01(start + randn() * cfg_.startSpread);
  }
}

Population::~Population() {
  delete[] genomes_;
  delete[] next_;
  delete[] w_;
  delete[] cum_;
}

// Box-Muller wie makeRandn(): u zuerst, dann v
real Population::randn() {
  real u = rng_.next();
  if (u < real(1e-9)) u = real(1e-9);
  const real v = rng_.next();
  return std::sqrt(real(-2) * std::log(u)) * std::cos(real(6.283185307179586) * v);  // 2 * Math.PI
}

void Population::seedFrom(const real *genome, real spread) {
  real base[G];
  for (int g = 0; g < G; g++) base[g] = clamp01(genome[g]);
  for (int i = 0; i < cfg_.size; i++)
    for (int g = 0; g < G; g++) genomes_[i * G + g] = clamp01(base[g] + randn() * spread);
}

void Population::computeWeights(const Environment &env) {
  const int N = cfg_.size;
  for (int i = 0; i < N; i++) w_[i] = std::pow(fitness(genomes_ + i * G, env), cfg_.selPower);
  if (!cfg_.competition || cfg_.numAxes == 0) return;

  const real inv2c2 = real(1) / (real(2) * cfg_.sigmaC * cfg_.sigmaC);
  const real inv2k2 = real(1) / (real(2) * cfg_.sigmaK * cfg_.sigmaK);
  const int *axes = cfg_.axes;
  const int na = cfg_.numAxes;
  // cum_ dient hier als Zwischenspeicher für die Konkurrenz-Gewichte: w_ wird
  // erst überschrieben, wenn alle Dichten berechnet sind (TS: base -> w).
  for (int i = 0; i < N; i++) {
    const real *gi = genomes_ + i * G;
    real n = 0;
    for (int j = 0; j < N; j++) {
      const real *gj = genomes_ + j * G;
      real d2 = 0;
      for (int a = 0; a < na; a++) {
        const real d = gi[axes[a]] - gj[axes[a]];
        d2 += d * d;
      }
      n += std::exp(-d2 * inv2c2);
    }
    n /= real(N);
    real dk2 = 0;
    for (int a = 0; a < na; a++) {
      const real d = gi[axes[a]] - cfg_.kCenter;
      dk2 += d * d;
    }
    const real K = std::exp(-dk2 * inv2k2);
    cum_[i] = (w_[i] * K) / (n + real(1e-9));
  }
  for (int i = 0; i < N; i++) w_[i] = cum_[i];
}

// Roulette über kumulierte Gewichte, binäre Suche wie pick()
int Population::pick(real total) {
  const real r = rng_.next() * total;
  int lo = 0;
  int hi = cfg_.size - 1;
  while (lo < hi) {
    const int mid = (lo + hi) >> 1;
    if (cum_[mid] < r)
      lo = mid + 1;
    else
      hi = mid;
  }
  return lo;
}

void Population::reproduce() {
  const int N = cfg_.size;
  real total = 0;
  for (int i = 0; i < N; i++) {
    total += w_[i];
    cum_[i] = total;
  }
  for (int k = 0; k < N; k++) {
    const int ia = total > 0 ? pick(total) : int(rng_.next() * real(N));
    const int ib = total > 0 ? pick(total) : int(rng_.next() * real(N));
    const real *pa = genomes_ + ia * G;
    const real *pb = genomes_ + ib * G;
    real *child = next_ + k * G;
    for (int g = 0; g < G; g++) {
      const real base = rng_.next() < cfg_.recombProb ? pb[g] : pa[g];
      child[g] = clamp01(base + randn() * cfg_.mutationSd);
    }
  }
  real *t = genomes_;
  genomes_ = next_;
  next_ = t;
}

void Population::step(const Environment &env) {
  computeWeights(env);
  reproduce();
}

void Population::mean(real *out) const {
  const int N = cfg_.size;
  for (int g = 0; g < G; g++) out[g] = 0;
  for (int i = 0; i < N; i++)
    for (int g = 0; g < G; g++) out[g] += genomes_[i * G + g];
  for (int g = 0; g < G; g++) out[g] /= real(N);
}
