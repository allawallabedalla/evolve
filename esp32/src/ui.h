// Runde Oberfläche: Wesen in der Mitte, sechs Umwelt-Regler als Bögen am Rand,
// unten Name/Zustand (bzw. Ziel oder Warnung) und die aktuelle Form.
//
// Bedienung
//   Übersicht:   Wesen antippen -> es hüpft, dann Erklärung
//                Wesen lange drücken -> Menü (Herausforderung, Chronik, Neues Leben)
//                Bogen am Rand antippen -> Regler bearbeiten
//   Bearbeiten:  Finger am Ring entlangziehen = Ziel der Welt (sie folgt mit Verzögerung),
//                in der Mitte nach links/rechts wischen = anderer Regler,
//                Mitte antippen (oder 6 s nichts tun) = zurück
//   Karten:      scrollen mit dem Finger, Tippen daneben = zurück
#pragma once
#include <stdint.h>

void ui_build();
void ui_tick();  // aus loop(): Schnappschuss und Ereignisse der Simulation übernehmen

// Regler von außen gesetzt (Serial) – hält die Anzeige synchron
void ui_env_changed();

// Bildschirm-Schlaf (main.cpp): beim Aufwachen gibt es einen Rückblick
void ui_sleep();
void ui_wake();

// Für den Scroll-Messlauf (Serial "bench"): Erklärung öffnen, scrollen, schließen
void ui_info_open();
void ui_info_scroll(int dy);
void ui_info_close();
void ui_info_invalidate();
void ui_info_text_visible(bool on);
