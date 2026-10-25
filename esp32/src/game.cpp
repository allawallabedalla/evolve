#include "game.h"

#include <stdio.h>
#include <string.h>

#include "census.h"
#include "describe.h"
#include "rng.h"

namespace P = phys;

// Werte aus app/index.html, wo es sie gibt
static constexpr int STABLE_GENS = 15;           // Formwechsel erst nach 15 stabilen Generationen
static constexpr int CENSUS_EVERY = 4;           // Arten-Zählung (O(N²)) nicht jede Generation
static constexpr real CLUSTER_RADIUS = real(0.35);  // SWARM.radius
static constexpr real CLUSTER_MIN = real(0.08);     // SWARM.minFraction
static constexpr real STICKY = real(0.6);           // SWARM.stickyFraction
static constexpr real SMOOTH = real(0.35);  // Anzeige-Glättung je Zählung (App: 0.18 bei häufigerer Zählung)
static constexpr real PERIL_FIT = real(0.04);
static constexpr float PERIL_WARN_S = 20, PERIL_DEAD_S = 60, PERIL_RECOVER = 3;
static constexpr uint32_t CHAL_MIN_GENS = 5;

const char *const STATUS_TEXT[4] = {"gedeiht", "kommt zurecht", "kämpft", "am Limit"};

real *env_field(Environment &e, int f) {
  real Environment::*F[6] = {&Environment::temperature, &Environment::light,      &Environment::water,
                             &Environment::foodAbundance, &Environment::foodHeight, &Environment::predation};
  return &(e.*F[f]);
}

bool env_in_bounds(const Challenge &c, const Environment &e) {
  Environment x = e;
  for (int f = 0; f < 6; f++) {
    const real v = *env_field(x, f);
    // kleine Toleranz: der Regler arbeitet in ganzen Prozent
    if (v < real(c.lo[f]) - real(0.005) || v > real(c.hi[f]) + real(0.005)) return false;
  }
  return true;
}

bool game_solved(const Game &g, int idx) { return g.p.solved[idx / 8] & (1 << (idx % 8)); }

// Name aus Silben, fest an die Linie gebunden
static void make_name(char *out, size_t len, uint32_t seed) {
  static const char *const A[] = {"Ne", "Ka", "Lu", "Mo", "Ti", "Sa", "Ru", "Fe", "Bo", "Wi", "Ari", "Zo",
                                  "Pe", "Ul", "Ma", "Je", "Ko", "Ida", "Fa", "No"};
  static const char *const B[] = {"bel", "ra", "mi", "no", "lin", "ko", "ta", "ru", "sel", "pi",
                                  "len", "ma", "do", "ri", "wen", "lo"};
  static const char *const C[] = {"", "", "", "a", "o", "i", "n", "s"};
  Mulberry32 r(seed ^ 0x9e3779b9u);
  snprintf(out, len, "%s%s%s", A[r.next_u32() % 20], B[r.next_u32() % 16], C[r.next_u32() % 8]);
}

static void chronicle_push(Game &g, uint32_t gen, const char *desc) {
  if (g.p.chronCount == CHRONICLE_LEN) {
    memmove(&g.p.chron[0], &g.p.chron[1], sizeof(ChronicleEntry) * (CHRONICLE_LEN - 1));
    g.p.chronCount--;
  }
  ChronicleEntry &e = g.p.chron[g.p.chronCount++];
  e.gen = gen;
  snprintf(e.desc, sizeof e.desc, "%s", desc);
}

static real wdist2(const real *a, const real *b, const real *w) {
  real s = 0;
  for (int k = 0; k < P::NUM_GENES; k++) {
    const real d = (a[k] - b[k]) * w[k];
    s += d * d;
  }
  return s;
}

// readSwarm() aus der App: Art mit Kontinuität wählen, Anzeige glätten
static void read_swarm(Game &g, const Population &pop, const Environment &env, bool snap) {
  static Species sp[4];
  real mean[P::NUM_GENES], w[P::NUM_GENES];
  pop.mean(mean);
  selectionWeights(mean, env, w);
  const int n = clusters(pop, w, CLUSTER_RADIUS, CLUSTER_MIN, sp, 4);
  const real *raw = mean;  // frisch gestreute Gründer: noch keine Art -> Mittelwert
  if (n > 0) {
    int pick = 0;
    if (n > 1 && g.haveRep) {
      int nearIdx = 0;
      real dn = real(1e30);
      for (int i = 0; i < n; i++) {
        const real d = wdist2(g.rep, sp[i].centroid, w);
        if (d < dn) dn = d, nearIdx = i;
      }
      if (sp[nearIdx].fraction >= STICKY * sp[0].fraction) pick = nearIdx;
    }
    raw = sp[pick].centroid;
  }
  if (snap || !g.haveRep) {
    memcpy(g.rep, raw, sizeof g.rep);
    g.haveRep = true;
  } else {
    for (int k = 0; k < P::NUM_GENES; k++) g.rep[k] += (raw[k] - g.rep[k]) * SMOOTH;
  }
}

static void commit_form(Game &g) {
  g.p.committedKey = formKeyCode(g.rep);
  describe(g.rep, g.p.committedDesc, sizeof g.p.committedDesc);
  g.candKey = g.p.committedKey;
  g.candCount = STABLE_GENS;
}

void game_new_lineage(Game &g, uint32_t seed, uint32_t gen, const Population &pop) {
  uint8_t solved[sizeof g.p.solved];
  memcpy(solved, g.p.solved, sizeof solved);
  memset(&g.p, 0, sizeof g.p);
  memcpy(g.p.solved, solved, sizeof solved);
  g.p.lineageSeed = seed;
  g.p.birthGen = gen;
  g.p.challenge = -1;
  make_name(g.p.name, sizeof g.p.name, seed);
  g.haveRep = false;
  g.peril = 0;
  g.perilArmed = false;
  g.extinct = false;
  read_swarm(g, pop, Environment(), true);
  commit_form(g);
  char first[TEXT_LEN];
  snprintf(first, sizeof first, "Ursprung: %s", g.p.committedDesc);
  chronicle_push(g, gen, first);
}

void game_restored(Game &g, const Population &pop) {
  g.haveRep = false;
  g.peril = 0;
  g.perilArmed = false;
  g.extinct = false;
  read_swarm(g, pop, Environment(), true);
  g.candKey = g.p.committedKey;
  g.candCount = STABLE_GENS;
}

void game_accept(Game &g, int idx) {
  if (idx < 0 || idx >= NUM_CHALLENGES) return;
  g.p.challenge = int16_t(idx);
  g.p.chPhase = CH_WAIT;  // die Uhr läuft erst, wenn die Welt im Rahmen ist (wie in der App)
  g.p.chStart = 0;
}

void game_abandon(Game &g) {
  g.p.challenge = -1;
  g.p.chPhase = CH_NONE;
}

real game_clamp_field(const Game &g, int f, real v) {
  if (g.p.challenge < 0) return v;
  const Challenge &c = CHALLENGES[g.p.challenge];
  if (v < real(c.lo[f])) return real(c.lo[f]);
  if (v > real(c.hi[f])) return real(c.hi[f]);
  return v;
}

static int16_t g_event_challenge = -1;  // von game_step() je Ereignis gesetzt

static void emit_simple(void (*emit)(const GameEvent &), GameEventType t, uint32_t gen, const char *a,
                        const char *b) {
  if (!emit) return;
  GameEvent e = {};
  e.type = t;
  e.gen = gen;
  e.challenge = g_event_challenge;
  if (a) snprintf(e.a, sizeof e.a, "%s", a);
  if (b) snprintf(e.b, sizeof e.b, "%s", b);
  emit(e);
}

void game_step(Game &g, const Population &pop, const Environment &env, uint32_t gen, bool watching, float dt,
               void (*emit)(const GameEvent &)) {
  if (g.extinct) return;
  g_event_challenge = -1;
  if ((gen - g.p.birthGen) % CENSUS_EVERY == 0 || !g.haveRep) read_swarm(g, pop, env, false);

  // Zustand des Wesens
  g.fitness = fitness(g.rep, env);
  g.status = g.fitness >= real(0.35) ? ST_THRIVING
             : g.fitness >= real(0.15) ? ST_OK
             : g.fitness >= real(0.06) ? ST_STRUGGLING
                                        : ST_LIMIT;

  // Formwechsel: erst wenn dieselbe Form STABLE_GENS Generationen hält
  const uint32_t key = formKeyCode(g.rep);
  if (key == g.candKey) {
    if (g.candCount < STABLE_GENS) g.candCount++;
  } else {
    g.candKey = key;
    g.candCount = 1;
  }
  if (g.candCount >= STABLE_GENS && key != g.p.committedKey) {
    char before[DESC_LEN];
    snprintf(before, sizeof before, "%s", g.p.committedDesc);
    commit_form(g);
    chronicle_push(g, gen, g.p.committedDesc);
    emit_simple(emit, EV_EVOLVED, gen, before, g.p.committedDesc);
  }

  // Aussterbe-Uhr – nur unter deinen Augen (V3, nie offline/bei dunklem Bildschirm)
  if (watching) {
    if (g.fitness > PERIL_FIT) g.perilArmed = true;  // einmal lebensfähig gewesen -> Uhr gilt
    const float before = g.peril;
    if (g.perilArmed && g.fitness <= PERIL_FIT)
      g.peril = g.peril + dt > PERIL_DEAD_S ? PERIL_DEAD_S : g.peril + dt;
    else
      g.peril = g.peril - dt * PERIL_RECOVER < 0 ? 0 : g.peril - dt * PERIL_RECOVER;
    if (before < PERIL_WARN_S && g.peril >= PERIL_WARN_S) emit_simple(emit, EV_PERIL_WARN, gen, nullptr, nullptr);
    if (g.peril >= PERIL_DEAD_S) {
      g.extinct = true;
      char t[TEXT_LEN];
      snprintf(t, sizeof t, "ausgestorben nach %u Gen.", unsigned(gen - g.p.birthGen));
      chronicle_push(g, gen, t);
      emit_simple(emit, EV_EXTINCT, gen, g.p.name, t);
      return;
    }
  }

  // Herausforderung (challengeTick() der App)
  if (g.p.challenge >= 0) {
    const Challenge &c = CHALLENGES[g.p.challenge];
    const bool in = env_in_bounds(c, env);
    g_event_challenge = g.p.challenge;
    if (g.p.chPhase == CH_WAIT) {
      if (in) {
        g.p.chPhase = CH_RUN;
        g.p.chStart = gen;
        emit_simple(emit, EV_CH_RUNNING, gen, c.title, nullptr);
      }
    } else if (gen - g.p.chStart >= CHAL_MIN_GENS && kingdomIdOf(g.rep) == c.kingdom) {
      g.p.solved[g.p.challenge / 8] |= 1 << (g.p.challenge % 8);
      char t[TEXT_LEN];
      snprintf(t, sizeof t, "Herausforderung geschafft (%u Gen.)", unsigned(gen - g.p.chStart));
      chronicle_push(g, gen, t);
      emit_simple(emit, EV_CH_WON, gen, c.title, t);
      game_abandon(g);
    } else if (!in) {
      emit_simple(emit, EV_CH_LEFT, gen, c.title, nullptr);
      game_abandon(g);
    } else if (gen - g.p.chStart >= c.generations) {
      emit_simple(emit, EV_CH_EXPIRED, gen, c.title, nullptr);
      game_abandon(g);
    }
  }
}
