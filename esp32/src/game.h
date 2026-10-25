// Spielregeln über der Simulation: Linie (Name, Alter), das Wesen als Art im
// Schwarm, Formwechsel als Ereignis, Chronik, Aussterbe-Uhr, Herausforderungen.
// Vorbild ist die Browser-App (app/index.html); Leitplanken aus
// docs/bindung-konzept.md: kein Tod durch Abwesenheit, kein Zwang, kein Grind.
//
// Reine Logik ohne FreeRTOS – sim.cpp ruft game_step() nach jeder Generation.
#pragma once
#include <stdint.h>

#include "challenges.h"
#include "fitness.h"
#include "physics.h"
#include "population.h"

constexpr int CHRONICLE_LEN = 12;
constexpr int DESC_LEN = 48;  // Form-Beschreibung (describe)
constexpr int TEXT_LEN = 72;  // Chronik- und Ereignistexte

struct ChronicleEntry {
  uint32_t gen;
  char desc[TEXT_LEN];
};

enum ChallengePhase : uint8_t { CH_NONE, CH_WAIT, CH_RUN };

// Was ein Neustart überlebt (Teil des NVS-Speicherstands)
struct GamePersist {
  uint32_t lineageSeed;
  uint32_t birthGen;
  char name[16];
  uint32_t committedKey;
  char committedDesc[DESC_LEN];
  uint8_t chronCount;
  ChronicleEntry chron[CHRONICLE_LEN];  // älteste zuerst
  int16_t challenge;  // Index in CHALLENGES, -1 = keine
  uint8_t chPhase;
  uint32_t chStart;
  uint8_t solved[(NUM_CHALLENGES + 7) / 8];
};

enum GameEventType : uint8_t {
  EV_NONE,
  EV_EVOLVED,        // a = vorher, b = nachher
  EV_CH_RUNNING,     // Welt im Rahmen, die Uhr läuft
  EV_CH_WON,
  EV_CH_EXPIRED,
  EV_CH_LEFT,
  EV_PERIL_WARN,
  EV_EXTINCT,
};

struct GameEvent {
  GameEventType type;
  uint32_t gen;
  int16_t challenge;  // betroffene Herausforderung, sonst -1
  char a[TEXT_LEN];
  char b[TEXT_LEN];
};

enum Status : uint8_t { ST_THRIVING, ST_OK, ST_STRUGGLING, ST_LIMIT };
extern const char *const STATUS_TEXT[4];

struct Game {
  GamePersist p;
  // flüchtig
  real rep[phys::NUM_GENES];  // „dein Wesen“: geglätteter Zentroid der eigenen Art
  bool haveRep;
  uint32_t candKey;
  int candCount;
  float peril;  // beobachtete Sekunden mit Fitness ≤ PERIL_FIT
  bool perilArmed;
  bool extinct;
  real fitness;
  Status status;
};

// Neue Linie: frischer Name, Chronik mit Gründungseintrag, keine Herausforderung.
// Gelöste Herausforderungen bleiben (Fortschritt übersteht „Neues Leben“, wie in der App).
void game_new_lineage(Game &g, uint32_t seed, uint32_t gen, const Population &pop);

// Nach einem Neustart: flüchtigen Teil neu aufsetzen
void game_restored(Game &g, const Population &pop);

// Nach jeder Generation. watching = Bildschirm an (die Aussterbe-Uhr läuft nur dann).
// Ereignisse landen in emit (darf nullptr sein).
void game_step(Game &g, const Population &pop, const Environment &env, uint32_t gen, bool watching, float dt,
               void (*emit)(const GameEvent &));

// Herausforderung annehmen/aufgeben
void game_accept(Game &g, int idx);
void game_abandon(Game &g);

// Zielwert eines Reglers in die Grenzen der laufenden Herausforderung ziehen
real game_clamp_field(const Game &g, int field, real v);

bool game_solved(const Game &g, int idx);
bool env_in_bounds(const Challenge &c, const Environment &e);
real *env_field(Environment &e, int field);  // Reihenfolge = Board-Regler
