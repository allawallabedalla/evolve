#include "sim.h"

#include <Arduino.h>
#include <Preferences.h>

#include "describe.h"
#include "population.h"

static constexpr int POP_SIZE = 100;
static constexpr uint32_t STEP_PERIOD_MS = 1000;
// Speichern: alles alle 60 s, eine Regler-Änderung zusätzlich 5 s nach dem letzten
// Dreh. NVS verteilt die Schreibzugriffe über seine Seiten – bei ~1500 Sicherungen
// am Tag hält der Flash damit Jahrzehnte.
static constexpr uint32_t SAVE_PERIOD_MS = 60000;
static constexpr uint32_t ENV_SAVE_DELAY_MS = 5000;
// Wiederbesiedeln aus dem gespeicherten Mittelwert-Genom: SWARM.seedSpread in app/index.html
static constexpr real SEED_SPREAD = real(0.06);

static constexpr const char *NVS_NS = "evolve";
static constexpr uint8_t SAVE_VERSION = 1;  // bei Layout-Änderung von SaveBlob hochzählen

// Was ein Neustart überlebt: Mittelwert-Genom, Umwelt, Generation
struct SaveBlob {
  uint32_t generation;
  Environment env;
  real mean[phys::NUM_GENES];
};

static SemaphoreHandle_t lock;
static Environment env;  // Default = Startumwelt der App (engine/types.ts-Werte)
static uint32_t env_changed_ms = 0;  // 0 = keine ungesicherte Regler-Änderung
static SimSnapshot snap;
static bool have_snap = false;
static Preferences prefs;
static SaveBlob saved;
static bool restored = false;

static bool load_state() {
  if (prefs.getUChar("ver", 0) != SAVE_VERSION) return false;
  if (prefs.getBytesLength("state") != sizeof(SaveBlob)) return false;
  return prefs.getBytes("state", &saved, sizeof saved) == sizeof saved;
}

static void save_state(const SimSnapshot &s, const Environment &e) {
  SaveBlob b;
  b.generation = s.generation;
  b.env = e;
  memcpy(b.mean, s.mean, sizeof b.mean);
  const uint32_t t0 = millis();
  prefs.putBytes("state", &b, sizeof b);
  prefs.putUChar("ver", SAVE_VERSION);
  Serial.printf("gespeichert: gen=%u (%u ms)\n", b.generation, millis() - t0);
}

static void publish(Population &pop, const Environment &e, SimSnapshot &local) {
  real sum = 0;
  for (int i = 0; i < pop.size(); i++) sum += fitness(pop.genome(i), e);
  local.meanFitness = float(sum / real(pop.size()));
  pop.mean(local.mean);
  describe(local.mean, local.desc, sizeof local.desc);
  xSemaphoreTake(lock, portMAX_DELAY);
  snap = local;
  have_snap = true;
  xSemaphoreGive(lock);
}

static void sim_task(void *arg) {
  PopulationConfig cfg;
  cfg.size = POP_SIZE;
  cfg.founderUniform = !restored;
  Population pop(cfg, (uint32_t)(uintptr_t)arg);
  SimSnapshot local = {};
  if (restored) {
    // wie spawnSwarm(seedGenome) in der App: eng um das gespeicherte Genom
    pop.seedFrom(saved.mean, SEED_SPREAD);
    local.generation = saved.generation;
    publish(pop, saved.env, local);  // Wesen sofort zeigen, nicht erst nach dem ersten Schritt
  }
  uint32_t last_save = millis();
  TickType_t wake = xTaskGetTickCount();

  for (;;) {
    xSemaphoreTake(lock, portMAX_DELAY);
    const Environment e = env;
    const uint32_t changed = env_changed_ms;
    xSemaphoreGive(lock);

    const uint32_t t0 = micros();
    pop.step(e);
    const uint32_t t1 = micros();

    local.generation++;
    local.stepMs = (t1 - t0) / 1000.0f;
    publish(pop, e, local);

    Serial.printf("gen=%u fit=%.4f step=%.1fms stats=%.1fms heap=%u min=%u | %s\n", local.generation,
                  local.meanFitness, local.stepMs, (micros() - t1) / 1000.0f, ESP.getFreeHeap(),
                  ESP.getMinFreeHeap(), local.desc);

    const uint32_t now = millis();
    if (now - last_save >= SAVE_PERIOD_MS || (changed && now - changed >= ENV_SAVE_DELAY_MS)) {
      save_state(local, e);
      last_save = now;
      xSemaphoreTake(lock, portMAX_DELAY);
      if (env_changed_ms == changed) env_changed_ms = 0;  // nur löschen, wenn nicht inzwischen neu gedreht
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
    env = saved.env;
    Serial.printf("geladen: gen=%u temperature=%.2f predation=%.2f foodAbundance=%.2f foodHeight=%.2f "
                  "light=%.2f water=%.2f\n",
                  saved.generation, double(env.temperature), double(env.predation), double(env.foodAbundance),
                  double(env.foodHeight), double(env.light), double(env.water));
  } else {
    Serial.println("kein Speicherstand – neue Welt");
  }
  // Priorität 1, loop() läuft auf 2 (setup()): die Oberfläche hat immer Vorrang, die
  // Simulation rechnet in den Pausen von LVGL. Bei gleicher Priorität stahl ein
  // 180-ms-Schritt der Oberfläche Zeitscheiben (Ruckeln); auf 0 teilte sie sich die
  // CPU mit dem Idle-Task und brauchte doppelt so lang.
  xTaskCreate(sim_task, "sim", 8192, (void *)(uintptr_t)seed, 1, nullptr);
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

void sim_set_env(const Environment &e) {
  xSemaphoreTake(lock, portMAX_DELAY);
  env = e;
  env_changed_ms = millis() | 1;  // nie 0
  xSemaphoreGive(lock);
}

Environment sim_get_env() {
  xSemaphoreTake(lock, portMAX_DELAY);
  const Environment e = env;
  xSemaphoreGive(lock);
  return e;
}
