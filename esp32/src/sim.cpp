#include "sim.h"

#include <Arduino.h>

#include "describe.h"
#include "population.h"

static constexpr int POP_SIZE = 100;
static constexpr uint32_t STEP_PERIOD_MS = 1000;

static SemaphoreHandle_t lock;
static Environment env;  // Default = Startumwelt der App (engine/types.ts-Werte)
static SimSnapshot snap;
static bool have_snap = false;

static void sim_task(void *arg) {
  PopulationConfig cfg;
  cfg.size = POP_SIZE;
  Population pop(cfg, (uint32_t)(uintptr_t)arg);
  SimSnapshot local = {};
  TickType_t wake = xTaskGetTickCount();

  for (;;) {
    xSemaphoreTake(lock, portMAX_DELAY);
    const Environment e = env;
    xSemaphoreGive(lock);

    const uint32_t t0 = micros();
    pop.step(e);
    const uint32_t t1 = micros();

    // Mittlere Fitness gehört nicht zum Schritt, wird getrennt gemessen
    real sum = 0;
    for (int i = 0; i < pop.size(); i++) sum += fitness(pop.genome(i), e);
    local.generation++;
    local.meanFitness = float(sum / real(pop.size()));
    local.stepMs = (t1 - t0) / 1000.0f;
    pop.mean(local.mean);
    describe(local.mean, local.desc, sizeof local.desc);

    xSemaphoreTake(lock, portMAX_DELAY);
    snap = local;
    have_snap = true;
    xSemaphoreGive(lock);

    Serial.printf("gen=%u fit=%.4f step=%.1fms stats=%.1fms heap=%u min=%u | %s\n", local.generation,
                  local.meanFitness, local.stepMs, (micros() - t1) / 1000.0f, ESP.getFreeHeap(),
                  ESP.getMinFreeHeap(), local.desc);

    vTaskDelayUntil(&wake, pdMS_TO_TICKS(STEP_PERIOD_MS));
  }
}

void sim_start(uint32_t seed) {
  lock = xSemaphoreCreateMutex();
  // Gleiche Priorität wie loop(): FreeRTOS teilt die Zeit, LVGL bleibt flüssig
  xTaskCreate(sim_task, "sim", 8192, (void *)(uintptr_t)seed, 1, nullptr);
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
  xSemaphoreGive(lock);
}

Environment sim_get_env() {
  xSemaphoreTake(lock, portMAX_DELAY);
  const Environment e = env;
  xSemaphoreGive(lock);
  return e;
}
