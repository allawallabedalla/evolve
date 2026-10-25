// Runde Oberfläche: Wesen in der Mitte, sechs Umwelt-Regler als Bögen am Rand,
// unten Name/Zustand (bzw. Ziel oder Warnung) und die aktuelle Form.
//
// Bedienung
//   Übersicht:   über das Wesen streichen -> streicheln (es schaut zum Finger, schnurrt, Herzen)
//                Wesen lange drücken -> Erklärung
//                Wesen antippen -> es hüpft, dann Menü (Herausforderung, Chronik, Neues Leben)
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

// Werkzeuge zum Gestalten (Serial "pose", "shot"):
// Vorschau-Pose = festes Beispiel-Genom statt des echten Wesens (-1 = aus)
int ui_pose(int idx);  // Rückgabe = Anzahl der Posen
// Bildschirm rendern und binär über Serial schicken: "SHOT <w> <h> <bytes>\n" + RGB565 (big endian)
void ui_screenshot();
// Streicheln vorführen (Serial "pet"): 1,5 s automatisch über das Wesen streichen
void ui_pet_demo();

// Für den Scroll-Messlauf (Serial "bench"): Erklärung öffnen, scrollen, schließen
void ui_info_open();
void ui_info_scroll(int dy);
void ui_info_close();
void ui_info_invalidate();
void ui_info_text_visible(bool on);
