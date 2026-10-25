// Runde Oberfläche: Wesen in der Mitte, sechs Umwelt-Regler als Bögen am Rand,
// unten Generation + Kurzbeschreibung.
//
// Bedienung
//   Übersicht:   Wesen antippen -> Erklärung (scrollen, Tippen = zurück)
//                Bogen am Rand antippen -> Regler bearbeiten
//   Bearbeiten:  Finger am Ring entlangziehen = Wert,
//                in der Mitte nach links/rechts wischen = anderer Regler,
//                Mitte antippen (oder 6 s nichts tun) = zurück
#pragma once

void ui_build();
void ui_tick();  // aus loop(): Sim-Schnappschuss übernehmen

// Regler von außen setzen (Serial, später NVS) – hält die Anzeige synchron
void ui_env_changed();

// Für den Scroll-Messlauf (Serial "bench"): Erklärung öffnen, scrollen, schließen
void ui_info_open();
void ui_info_scroll(int dy);
void ui_info_close();
void ui_info_invalidate();
void ui_info_text_visible(bool on);
