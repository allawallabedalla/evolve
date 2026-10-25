// Simulation + Spielregeln im eigenen FreeRTOS-Task: ein Generationsschritt pro
// Sekunde. LVGL läuft im Arduino-loop() und liest nur Schnappschüsse, Ereignisse
// und schickt Befehle – alles über einen Mutex.
#pragma once
#include <stdint.h>

#include "evo_real.h"
#include "fitness.h"
#include "game.h"
#include "physics.h"

// true = keine Log-Ausgaben (während ui_screenshot() Binärdaten schickt)
extern volatile bool g_serial_quiet;

struct SimSnapshot {
  uint32_t generation;
  float stepMs;
  real rep[phys::NUM_GENES];  // „dein Wesen“ (Art im Schwarm, geglättet)
  char desc[DESC_LEN];        // Form nach dem letzten Formwechsel
  char name[16];
  uint32_t age;  // Generationen seit Gründung der Linie
  float fitness;
  Status status;
  float peril01;  // 0..1 bis zum Aussterben
  bool perilWarn;
  bool extinct;
  int16_t challenge;  // -1 = keine
  ChallengePhase chPhase;
  uint32_t chUsed;  // Generationen seit die Uhr läuft
  Environment envActual;  // was in der Welt gerade gilt
  Environment envTarget;  // wohin die Regler zeigen
};

// Lädt einen Speicherstand aus NVS (falls vorhanden) und startet den Task.
// Gesichert wird alle 60 s und 5 s nach einer Änderung.
void sim_start(uint32_t seed);

// Speicherstand löschen und neu starten (frische Welt)
void sim_forget();

// Kopie des letzten Stands; false, solange noch keiner da ist
bool sim_snapshot(SimSnapshot &out);

// Nächstes Spielereignis (Formwechsel, Herausforderung, Aussterben …); false = keins
bool sim_pop_event(GameEvent &out);

// Chronik der Linie (älteste zuerst); Rückgabe = Anzahl
int sim_chronicle(ChronicleEntry *out, int max);

// Ziel-Umwelt (die Regler). Die Ist-Umwelt läuft dem Ziel über einige Generationen
// nach (Trägheit). Bei laufender Herausforderung wird in deren Grenzen gezogen.
void sim_set_env(const Environment &target);
Environment sim_get_env();

// Befehle der Oberfläche – wirken spätestens mit der nächsten Generation
void sim_set_watching(bool on);  // Bildschirm an? (Aussterbe-Uhr läuft nur dann)
void sim_new_lineage();
void sim_accept_challenge(int idx);
void sim_abandon_challenge();
bool sim_challenge_solved(int idx);
