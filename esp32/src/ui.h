// Runde Oberfläche: Wesen in der Mitte, sechs Umwelt-Regler als Bögen am Rand,
// unten Generation + Kurzbeschreibung.
//
// Bedienung
//   Übersicht:   Bogen am Rand antippen -> Regler bearbeiten
//   Bearbeiten:  Finger am Ring entlangziehen = Wert,
//                in der Mitte nach links/rechts wischen = anderer Regler,
//                Mitte antippen (oder 6 s nichts tun) = zurück
#pragma once

void ui_build();
void ui_tick();  // aus loop(): Sim-Schnappschuss übernehmen

// Regler von außen setzen (Serial, später NVS) – hält die Anzeige synchron
void ui_env_changed();
