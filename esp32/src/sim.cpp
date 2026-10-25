#include "sim.h"

#include <Arduino.h>
#include <Preferences.h>

#include "describe.h"
#include "population.h"

static constexpr int POP_SIZE = 100;
static constexpr uint32_t STEP_PERIOD_MS = 1000;
// Speichern: alles alle 60 s; nach einer Regler-Änderung oder einem Spielereignis
// zusätzlich kurz danach. NVS verteilt die Schreibzugriffe über seine Seiten – bei
// ~1500 Sicherungen am Tag hält der Flash damit Jahrzehnte.
static constexpr uint32_t SAVE_PERIOD_MS = 60000;
static constexpr uint32_t DIRTY_SAVE_DELAY_MS = 5000;
// Wiederbesiedeln aus dem gespeicherten Genom: SWARM.seedSpread in app/index.html
static constexpr real SEED_SPREAD = real(0.06);
// Trägheit der Welt (docs/bindung-konzept.md V2): ein Regler-Zug ist ein Klimawandel,
// der je Generation höchstens um diesen Betrag einschwingt – ganz von 0 auf 1 in
// 25 Generationen. 1.0 = sofort wie vorher.
static constexpr real ENV_RATE = real(0.04);

static constexpr const char *NVS_NS = "evolve";
static constexpr uint8_t SAVE_VERSION = 3;  // bei Layout-Änderung von SaveBlob hochzählen

struct SaveBlob {
  uint32_t generation;
  Environment actual;
  Environment target;
  real mean[phys::NUM_GENES];
  GamePersist game;
};

static SemaphoreHandle_t lock;
static Environment target;  // Regler
static Environment actual;  // Welt
static uint32_t dirty_ms = 0;  // 0 = nichts Ungesichertes
static bool watching = true;
static bool req_new_lineage = false;
static int req_accept = -2;  // -2 = nichts, -1 = aufgeben, sonst Index
static SimSnapshot snap;
static bool have_snap = false;
static GameEvent events[8];
static int ev_head = 0, ev_count = 0;
static Game game;  // nur der Sim-Task schreibt; Chronik/solved liest die UI unter dem Mutex
static Preferences prefs;
static SaveBlob saved;
static bool restored = false;

static void mark_dirty() { dirty_ms = millis() | 1; }  // nie 0

static void push_event(const GameEvent &e) {
  xSemaphoreTake(lock, portMAX_DELAY);
  events[(ev_head + ev_count) % 8] = e;
  if (ev_count < 8)
    ev_count++;
  else
    ev_head = (ev_head + 1) % 8;
  mark_dirty();
  xSemaphoreGive(lock);
  Serial.printf("Ereignis %d gen=%u | %s | %s\n", e.type, e.gen, e.a, e.b);
}

static bool load_state() {
  if (prefs.getUChar("ver", 0) != SAVE_VERSION) return false;
  if (prefs.getBytesLength("state") != sizeof(SaveBlob)) return false;
  return prefs.getBytes("state", &saved, sizeof saved) == sizeof saved;
}

static void save_state(uint32_t gen, const Population &pop) {
  static SaveBlob b;
  b.generation = gen;
  pop.mean(b.mean);
  xSemaphoreTake(lock, portMAX_DELAY);
  b.actual = actual;
  b.target = target;
  b.game = game.p;
  xSemaphoreGive(lock);
  const uint32_t t0 = millis();
  prefs.putBytes("state", &b, sizeof b);
  prefs.putUChar("ver", SAVE_VERSION);
  Serial.printf("gespeichert: gen=%u (%u Byte, %u ms)\n", gen, unsigned(sizeof b), millis() - t0);
}

static void publish(uint32_t gen, float stepMs) {
  xSemaphoreTake(lock, portMAX_DELAY);
  snap.generation = gen;
  snap.stepMs = stepMs;
  memcpy(snap.rep, game.rep, sizeof snap.rep);
  memcpy(snap.desc, game.p.committedDesc, sizeof snap.desc);
  memcpy(snap.name, game.p.name, sizeof snap.name);
  snap.age = gen - game.p.birthGen;
  snap.fitness = float(game.fitness);
  snap.status = game.status;
  snap.peril01 = game.peril / 60.0f;
  snap.perilWarn = game.peril >= 20.0f;
  snap.extinct = game.extinct;
  snap.challenge = game.p.challenge;
  snap.chPhase = ChallengePhase(game.p.chPhase);
  snap.chUsed = game.p.chPhase == CH_RUN ? gen - game.p.chStart : 0;
  snap.envActual = actual;
  snap.envTarget = target;
  have_snap = true;
  xSemaphoreGive(lock);
}

static void approach(real &a, real t) {
  const real d = t - a;
  a += d > ENV_RATE ? ENV_RATE : d < -ENV_RATE ? -ENV_RATE : d;
}

static void sim_task(void *arg) {
  const uint32_t seed = (uint32_t)(uintptr_t)arg;
  PopulationConfig cfg;
  cfg.size = POP_SIZE;
  cfg.founderUniform = !restored;
  Population pop(cfg, seed);
  uint32_t gen = 0;
  if (restored) {
    // wie spawnSwarm(seedGenome) in der App: eng um das gespeicherte Genom
    pop.seedFrom(saved.mean, SEED_SPREAD);
    gen = saved.generation;
    game.p = saved.game;
    game_restored(game, pop);
  } else {
    game_new_lineage(game, seed, 0, pop);
  }
  game.fitness = fitness(game.rep, actual);
  publish(gen, 0);  // Wesen sofort zeigen, nicht erst nach dem ersten Schritt

  uint32_t last_save = millis();
  uint32_t last_step = millis();
  TickType_t wake = xTaskGetTickCount();

  for (;;) {
    // Befehle der Oberfläche übernehmen, Welt einen Schritt Richtung Regler bewegen
    xSemaphoreTake(lock, portMAX_DELAY);
    const bool newLineage = req_new_lineage;
    const int accept = req_accept;
    req_new_lineage = false;
    req_accept = -2;
    for (int f = 0; f < 6; f++) approach(*env_field(actual, f), *env_field(target, f));
    const Environment e = actual;
    const bool watch = watching;
    const uint32_t dirty = dirty_ms;
    xSemaphoreGive(lock);

    if (newLineage) {
      pop.foundUniform();
      game_new_lineage(game, esp_random(), gen, pop);
      mark_dirty();
    }
    if (accept >= 0) game_accept(game, accept);
    if (accept == -1) game_abandon(game);

    const uint32_t t0 = micros();
    pop.step(e);
    const uint32_t t1 = micros();
    gen++;

    const uint32_t now = millis();
    const float dt = (now - last_step) / 1000.0f;
    last_step = now;
    game_step(game, pop, e, gen, watch, dt > 2 ? 2 : dt, push_event);
    publish(gen, (t1 - t0) / 1000.0f);

    Serial.printf("gen=%u fit=%.3f step=%.0fms game=%.0fms heap=%u peril=%.0f | %s · %s\n", gen,
                  double(game.fitness), (t1 - t0) / 1000.0, (micros() - t1) / 1000.0, ESP.getFreeHeap(),
                  double(game.peril), game.p.name, game.p.committedDesc);

    if (now - last_save >= SAVE_PERIOD_MS || (dirty && now - dirty >= DIRTY_SAVE_DELAY_MS)) {
      save_state(gen, pop);
      last_save = now;
      xSemaphoreTake(lock, portMAX_DELAY);
      if (dirty_ms == dirty) dirty_ms = 0;  // nur löschen, wenn nicht inzwischen neu geändert
      xSemaphoreGive(lock);
    }

    vTaskDelayUntil(&wake, pdMS_TO_TICKS(STEP_PERIOD_MS));
  }
}

void sim_start(uint32_t seed) {
  lock = xSemaphoreCreateMutex();
  prefs.begin(NVS_NS, false);
  restored = load_state();
  if (restored) {
    actual = saved.actual;
    target = saved.target;
    Serial.printf("geladen: gen=%u %s (%s)\n", saved.generation, saved.game.name, saved.game.committedDesc);
  } else {
    Serial.println("kein Speicherstand – neue Welt");
  }
  // Priorität 1, loop() läuft auf 2 (setup()): die Oberfläche hat immer Vorrang, die
  // Simulation rechnet in den Pausen von LVGL. Bei gleicher Priorität stahl ein
  // 180-ms-Schritt der Oberfläche Zeitscheiben (Ruckeln); auf 0 teilte sie sich die
  // CPU mit dem Idle-Task und brauchte doppelt so lang.
  xTaskCreate(sim_task, "sim", 10240, (void *)(uintptr_t)seed, 1, nullptr);
}

void sim_forget() {
  prefs.clear();
  Serial.println("Speicherstand gelöscht – Neustart");
  delay(100);
  ESP.restart();
}

bool sim_snapshot(SimSnapshot &out) {
  xSemaphoreTake(lock, portMAX_DELAY);
  const bool ok = have_snap;
  if (ok) out = snap;
  xSemaphoreGive(lock);
  return ok;
}

bool sim_pop_event(GameEvent &out) {
  xSemaphoreTake(lock, portMAX_DELAY);
  const bool ok = ev_count > 0;
  if (ok) {
    out = events[ev_head];
    ev_head = (ev_head + 1) % 8;
    ev_count--;
  }
  xSemaphoreGive(lock);
  return ok;
}

int sim_chronicle(ChronicleEntry *out, int max) {
  xSemaphoreTake(lock, portMAX_DELAY);
  const int n = game.p.chronCount < max ? game.p.chronCount : max;
  memcpy(out, game.p.chron + (game.p.chronCount - n), sizeof(ChronicleEntry) * n);
  xSemaphoreGive(lock);
  return n;
}

// Herausforderung, die für die Regler gerade gilt – auch eine eben angenommene,
// die der Sim-Task erst mit der nächsten Generation übernimmt
static int active_challenge_locked() {
  if (req_accept >= 0) return req_accept;
  if (req_accept == -1) return -1;
  return game.p.challenge;
}

void sim_set_env(const Environment &t) {
  xSemaphoreTake(lock, portMAX_DELAY);
  target = t;
  const int ch = active_challenge_locked();
  if (ch >= 0)
    for (int f = 0; f < 6; f++) {
      real *v = env_field(target, f);
      if (*v < real(CHALLENGES[ch].lo[f])) *v = real(CHALLENGES[ch].lo[f]);
      if (*v > real(CHALLENGES[ch].hi[f])) *v = real(CHALLENGES[ch].hi[f]);
    }
  mark_dirty();
  xSemaphoreGive(lock);
}

Environment sim_get_env() {
  xSemaphoreTake(lock, portMAX_DELAY);
  const Environment e = target;
  xSemaphoreGive(lock);
  return e;
}

void sim_set_watching(bool on) {
  xSemaphoreTake(lock, portMAX_DELAY);
  watching = on;
  xSemaphoreGive(lock);
}

void sim_new_lineage() {
  xSemaphoreTake(lock, portMAX_DELAY);
  req_new_lineage = true;
  xSemaphoreGive(lock);
}

void sim_accept_challenge(int idx) {
  xSemaphoreTake(lock, portMAX_DELAY);
  req_accept = idx;
  // Regler sofort in den Rahmen ziehen; die Welt folgt mit ihrer Trägheit
  const Challenge &c = CHALLENGES[idx];
  for (int f = 0; f < 6; f++) {
    real *v = env_field(target, f);
    if (*v < real(c.lo[f])) *v = real(c.lo[f]);
    if (*v > real(c.hi[f])) *v = real(c.hi[f]);
  }
  mark_dirty();
  xSemaphoreGive(lock);
}

void sim_abandon_challenge() {
  xSemaphoreTake(lock, portMAX_DELAY);
  req_accept = -1;
  xSemaphoreGive(lock);
}

bool sim_challenge_solved(int idx) {
  xSemaphoreTake(lock, portMAX_DELAY);
  const bool s = game_solved(game, idx);
  xSemaphoreGive(lock);
  return s;
}
