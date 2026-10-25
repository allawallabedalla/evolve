// Das Wesen als einfache Vektorform aus dem Genom der eigenen Art.
// Angelehnt an engine/development.ts (Reich bestimmt den Bauplan, Gene die
// Ausprägung), aber stark vereinfacht. Gezeichnet wird direkt im
// LV_EVENT_DRAW_MAIN – kein Canvas-Puffer, der RAM bleibt frei.
//
// Es lebt: atmet im Takt seines Stoffwechsels, blinzelt, bewegt sich je nach
// Mobilität, Pflanzen wiegen sich, Leuchten pulsiert, Flügel schlagen.
#pragma once
#include <lvgl.h>

#include "evo_real.h"

lv_obj_t *creature_create(lv_obj_t *parent, lv_coord_t w, lv_coord_t h);
void creature_set_genome(lv_obj_t *obj, const real *genome);

// Animation fortschreiben (aus einem LVGL-Timer, ~20 Bilder/s)
void creature_tick(lv_obj_t *obj, uint32_t now_ms);

// Hüpfer: als Reaktion aufs Antippen (1) oder zum Feiern eines Formwechsels (2 = doppelt hoch, drei Sprünge)
void creature_hop(int strength);

// Streicheln: Finger an Bildschirmposition (x, y) streicht über das Wesen. Es schaut
// dem Finger nach, lehnt sich hinein, wackelt; nach genug Streicheln steigen Herzen
// (Tiere) bzw. Funken (alle anderen) auf. Rein zur Zuneigung – die Gene bleiben, wie sie sind.
void creature_pet(lv_obj_t *obj, int x, int y);
void creature_pet_end();
