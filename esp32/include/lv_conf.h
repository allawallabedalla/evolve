// LVGL 8.3 – nur Abweichungen vom Default, Rest füllt lv_conf_internal.h
#if 1
#ifndef LV_CONF_H
#define LV_CONF_H

#define LV_COLOR_DEPTH 16
#define LV_COLOR_16_SWAP 1  // Bytes in Display-Reihenfolge -> DMA direkt aus dem LVGL-Puffer

// Kein PSRAM: LVGL-Heap klein halten
#define LV_MEM_CUSTOM 0
#define LV_MEM_SIZE (32U * 1024U)

#define LV_TICK_CUSTOM 1
#define LV_TICK_CUSTOM_INCLUDE "Arduino.h"
#define LV_TICK_CUSTOM_SYS_TIME_EXPR (millis())

#define LV_DISP_DEF_REFR_PERIOD 15
#define LV_INDEV_DEF_READ_PERIOD 20

#define LV_USE_LOG 0
#define LV_USE_SNAPSHOT 1  // Serial-Befehl "shot": Bildschirm als Bild zum PC
#define LV_USE_PERF_MONITOR 0

// Eigene Montserrat-Schnitte (SIL OFL, TTF aus lvgl/scripts/built_in_font) mit Latin-1
// (ä ö ü ß ·), erzeugt mit lv_font_conv@1.5.2: src/fonts/font_de_*.c, Optionen im Dateikopf.
// Die eingebauten Schriften können nur ASCII.
#define LV_FONT_MONTSERRAT_14 0
#define LV_FONT_CUSTOM_DECLARE LV_FONT_DECLARE(font_de_14) LV_FONT_DECLARE(font_de_20)
#define LV_FONT_DEFAULT &font_de_14

#endif
#endif
