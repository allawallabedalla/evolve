// Das Wesen als einfache Vektorform aus dem Mittelwert-Genom.
// Angelehnt an engine/development.ts (Reich bestimmt den Bauplan, Gene die
// Ausprägung), aber stark vereinfacht. Gezeichnet wird direkt im
// LV_EVENT_DRAW_MAIN – kein Canvas-Puffer, der RAM bleibt frei.
#pragma once
#include <lvgl.h>

#include "evo_real.h"

lv_obj_t *creature_create(lv_obj_t *parent, lv_coord_t w, lv_coord_t h);
void creature_set_genome(lv_obj_t *obj, const real *genome);
