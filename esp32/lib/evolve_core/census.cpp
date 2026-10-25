#include "census.h"

#include <math.h>
#include <string.h>

namespace P = phys;

static constexpr int MAX_N = 128;
static constexpr int G = P::NUM_GENES;

static inline real clamp01(real x) { return x < 0 ? real(0) : x > 1 ? real(1) : x; }

void selectionWeights(const real *mean, const Environment &env, real *w) {
  const real eps = real(0.01);
  real g[G];
  real mx = real(1e-9);
  for (int k = 0; k < G; k++) {
    memcpy(g, mean, sizeof g);
    g[k] = clamp01(mean[k] + eps);
    const real up = fitness(g, env);
    g[k] = clamp01(mean[k] - eps);
    const real dn = fitness(g, env);
    w[k] = (up > dn ? up - dn : dn - up) / (2 * eps);
    if (w[k] > mx) mx = w[k];
  }
  for (int k = 0; k < G; k++) w[k] = real(0.15) + real(0.85) * (w[k] / mx);
}

int clusters(const Population &pop, const real *weights, real radius, real minFraction, Species *out, int maxOut) {
  static int16_t q[MAX_N * G];
  static int16_t density[MAX_N];
  static uint8_t order[MAX_N];
  static bool assigned[MAX_N];
  static uint8_t members[MAX_N];
  const int N = pop.size() < MAX_N ? pop.size() : MAX_N;

  // Gewichtete Gene in Q10: d² über 26 Gene bleibt < 2^31
  for (int i = 0; i < N; i++) {
    const real *gi = pop.genome(i);
    for (int k = 0; k < G; k++) q[i * G + k] = int16_t(gi[k] * weights[k] * real(1024) + real(0.5));
  }
  const int32_t r2 = int32_t(radius * 1024) * int32_t(radius * 1024);
  auto near = [&](int a, int b) {
    const int16_t *qa = q + a * G, *qb = q + b * G;
    int32_t s = 0;
    for (int k = 0; k < G; k++) {
      const int32_t d = int32_t(qa[k]) - int32_t(qb[k]);
      s += d * d;
      if (s > r2) return false;
    }
    return true;
  };

  memset(density, 0, sizeof density);
  for (int i = 0; i < N; i++)
    for (int j = i + 1; j < N; j++)
      if (near(i, j)) {
        density[i]++;
        density[j]++;
      }
  // Stabil nach Dichte absteigend (wie Array.sort in V8: Gleichstand behält die Reihenfolge)
  for (int i = 0; i < N; i++) {
    int j = i;
    while (j > 0 && density[order[j - 1]] < density[i]) {
      order[j] = order[j - 1];
      j--;
    }
    order[j] = uint8_t(i);
  }

  memset(assigned, 0, sizeof assigned);
  int n = 0;
  for (int o = 0; o < N; o++) {
    const int seed = order[o];
    if (assigned[seed]) continue;
    int m = 0;
    for (int j = 0; j < N; j++)
      if (!assigned[j] && near(seed, j)) {
        assigned[j] = true;
        members[m++] = uint8_t(j);
      }
    const real frac = real(m) / real(N);
    if (frac < minFraction) continue;
    // Einsortieren nach Größe (größte zuerst), überzählige kleine fallen weg
    Species s;
    s.size = m;
    s.fraction = frac;
    for (int k = 0; k < G; k++) s.centroid[k] = 0;
    for (int a = 0; a < m; a++) {
      const real *ga = pop.genome(members[a]);
      for (int k = 0; k < G; k++) s.centroid[k] += ga[k];
    }
    for (int k = 0; k < G; k++) s.centroid[k] /= real(m);
    int pos = n;
    while (pos > 0 && out[pos - 1].size < s.size) pos--;
    if (pos >= maxOut) continue;
    for (int b = (n < maxOut ? n : maxOut - 1); b > pos; b--) out[b] = out[b - 1];
    out[pos] = s;
    if (n < maxOut) n++;
  }
  return n;
}
