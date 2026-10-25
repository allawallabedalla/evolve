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
#if EVO_FAST_KERNEL
  q_ = new int16_t[N * cfg_.numAxes];
  acc_ = new uint32_t[N];
  // Tabelle bis exp(-16) ≈ 1e-7, darüber zählt ein Paar nicht mehr
  const double inv2c2 = 1.0 / (2.0 * double(cfg_.sigmaC) * double(cfg_.sigmaC));
  const double maxD2 = 16.0 / inv2c2 * 16777216.0;  // in Q24
  lutShift_ = 0;
  while (double(uint32_t(LUT_SIZE) << lutShift_) < maxD2) lutShift_++;
  lutMaxD2_ = uint32_t(LUT_SIZE) << lutShift_;
  for (int k = 0; k <= LUT_SIZE; k++) {
    const double d2 = double(uint32_t(k) << lutShift_) / 16777216.0;
    lut_[k] = uint32_t(65536.0 * std::exp(-d2 * inv2c2) + 0.5);
  }
#endif
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
#if EVO_FAST_KERNEL
  delete[] q_;
  delete[] acc_;
#endif
}

// Box-Muller wie makeRandn(): u zuerst, dann v
real Population::randn() {
  real u = rng_.next();
  if (u < real(1e-9)) u = real(1e-9);
  const real v = rng_.next();
  return std::sqrt(real(-2) * std::log(u)) * std::cos(real(6.283185307179586) * v);  // 2 * Math.PI
}

void Population::foundUniform() {
  for (int i = 0; i < cfg_.size * G; i++) genomes_[i] = rng_.next();
}

void Population::seedFrom(const real *genome, real spread) {
  real base[G];
  for (int g = 0; g < G; g++) base[g] = clamp01(genome[g]);
  for (int i = 0; i < cfg_.size; i++)
    for (int g = 0; g < G; g++) genomes_[i * G + g] = clamp01(base[g] + randn() * spread);
}

void Population::computeWeights(const Environment &env) {
  const int N = cfg_.size;
  for (int i = 0; i < N; i++) {
    const real f = fitness(genomes_ + i * G, env);
    w_[i] = cfg_.selPower == real(2) ? f * f : std::pow(f, cfg_.selPower);  // f*f wie pow(f, 2), nur billiger
  }
  if (!cfg_.competition || cfg_.numAxes == 0) return;
#if EVO_FAST_KERNEL
  competitionFast();
#else
  competitionExact();
#endif
}

// Konkurrenz-Kernel wie weights() in world/population.ts, gleiche Summationsreihenfolge
void Population::competitionExact() {
  const int N = cfg_.size;
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

#if EVO_FAST_KERNEL
// Derselbe Kernel in Ganzzahlen – der C3 hat keine FPU, und N² soft-float-exp()
// kosteten ~500 ms je Generation. Achsenwerte in Q12, Abstandsquadrat in Q24,
// exp(-d2/(2 sigmaC²)) aus einer Tabelle mit linearer Interpolation (Q16), jedes
// Paar nur einmal (symmetrisch). Abweichung zur exakten Form misst parity.mjs.
void Population::competitionFast() {
  const int N = cfg_.size;
  const int na = cfg_.numAxes;
  for (int i = 0; i < N; i++) {
    const real *gi = genomes_ + i * G;
    for (int a = 0; a < na; a++) q_[i * na + a] = int16_t(gi[cfg_.axes[a]] * real(4096) + real(0.5));
    acc_[i] = 65536;  // j == i: exp(0)
  }
  const uint32_t mask = (1u << lutShift_) - 1;
  for (int i = 0; i < N; i++) {
    const int16_t *qi = q_ + i * na;
    for (int j = i + 1; j < N; j++) {
      const int16_t *qj = q_ + j * na;
      uint32_t d2 = 0;
      for (int a = 0; a < na; a++) {
        const int32_t d = int32_t(qi[a]) - int32_t(qj[a]);
        d2 += uint32_t(d * d);
      }
      if (d2 >= lutMaxD2_) continue;
      const uint32_t k = d2 >> lutShift_;
      const int32_t lo = int32_t(lut_[k]);
      const int32_t e = lo + int32_t((int64_t(int32_t(lut_[k + 1]) - lo) * int64_t(d2 & mask)) >> lutShift_);
      acc_[i] += uint32_t(e);
      acc_[j] += uint32_t(e);
    }
  }
  const real inv2k2 = real(1) / (real(2) * cfg_.sigmaK * cfg_.sigmaK);
  for (int i = 0; i < N; i++) {
    const real *gi = genomes_ + i * G;
    const real n = real(acc_[i]) / (real(65536) * real(N));
    real dk2 = 0;
    for (int a = 0; a < na; a++) {
      const real d = gi[cfg_.axes[a]] - cfg_.kCenter;
      dk2 += d * d;
    }
    w_[i] = (w_[i] * std::exp(-dk2 * inv2k2)) / (n + real(1e-9));
  }
}
#endif

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
