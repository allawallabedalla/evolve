#include "ui.h"

#include <Arduino.h>
#include <lvgl.h>
#include <math.h>

#include "board.h"
#include "creature.h"
#include "explain.h"
#include "sim.h"

LV_FONT_DECLARE(font_de_14);
LV_FONT_DECLARE(font_de_20);

struct Regler {
  const char *name;
  uint32_t color;
  real Environment::*field;
  const char *words[3];  // niedrig / mittel / hoch
};

// Die sechs Spieler-Regler der App (engine/types.ts Environment), im Uhrzeigersinn ab 1 Uhr
static const Regler REGLER[] = {
    {"Wärme", 0xFF7043, &Environment::temperature, {"eisig", "mild", "heiß"}},
    {"Licht", 0xFFE066, &Environment::light, {"dunkel", "dämmrig", "sonnig"}},
    {"Wasser", 0x42A5F5, &Environment::water, {"trocken", "Ufer", "tiefes Wasser"}},
    {"Futter", 0x8BC34A, &Environment::foodAbundance, {"karg", "mäßig", "reich"}},
    {"Futterhöhe", 0xC8A060, &Environment::foodHeight, {"am Boden", "mittelhoch", "hoch oben"}},
    {"Räuber", 0xC062D8, &Environment::predation, {"keine", "einige", "viele"}},
};
static constexpr int NUM_REGLER = sizeof REGLER / sizeof REGLER[0];
static constexpr int SEG_SPAN = 360 / NUM_REGLER;
static constexpr int SEG_GAP = 10;
static constexpr int SEG_FIRST = -60;  // Mitte des ersten Bogens (LVGL: 0° = 3 Uhr, im Uhrzeigersinn)
static constexpr uint32_t EDIT_TIMEOUT_MS = 6000;
static constexpr uint32_t INFO_TIMEOUT_MS = 30000;
static constexpr lv_coord_t RING = 232;
static constexpr lv_coord_t RING_W = 14;
static constexpr lv_coord_t RING_TOUCH_R = 80;  // ab diesem Radius zählt ein Tippen als Ring

static lv_obj_t *seg[NUM_REGLER];
static lv_obj_t *creature;
static lv_obj_t *gen_label;
static lv_obj_t *desc_label;

static lv_obj_t *edit_arc;
static lv_obj_t *edit_panel;
static lv_obj_t *edit_name;
static lv_obj_t *edit_value;
static lv_obj_t *edit_hint;

static lv_obj_t *info_panel;
static lv_obj_t *info_scroll;
static lv_obj_t *info_title;
static lv_obj_t *info_body;
static char info_text[1024];

static int editing = -1;  // -1 = Übersicht
static bool info_open = false;
static uint32_t last_touch_ms = 0;
static bool swallow_click = false;

static int seg_center(int i) { return SEG_FIRST + i * SEG_SPAN; }
static int norm360(int a) { return ((a % 360) + 360) % 360; }

static int value_pct(int i) {
  const Environment e = sim_get_env();
  return int(e.*REGLER[i].field * 100 + real(0.5));
}

static const char *word_for(int i, int pct) { return REGLER[i].words[pct < 33 ? 0 : pct < 67 ? 1 : 2]; }

static void update_edit_labels() {
  const int pct = lv_arc_get_value(edit_arc);
  lv_label_set_text(edit_name, REGLER[editing].name);
  lv_label_set_text_fmt(edit_value, "%d %%", pct);
  lv_label_set_text(edit_hint, word_for(editing, pct));
}

static void refresh_segments() {
  for (int i = 0; i < NUM_REGLER; i++) lv_arc_set_value(seg[i], value_pct(i));
}

static void show_overview() {
  editing = -1;
  lv_obj_add_flag(edit_arc, LV_OBJ_FLAG_HIDDEN);
  lv_obj_add_flag(edit_panel, LV_OBJ_FLAG_HIDDEN);
  for (int i = 0; i < NUM_REGLER; i++) lv_obj_clear_flag(seg[i], LV_OBJ_FLAG_HIDDEN);
  lv_obj_clear_flag(creature, LV_OBJ_FLAG_HIDDEN);
  lv_obj_clear_flag(gen_label, LV_OBJ_FLAG_HIDDEN);
  lv_obj_clear_flag(desc_label, LV_OBJ_FLAG_HIDDEN);
  refresh_segments();
}

static void show_edit(int i) {
  editing = (i + NUM_REGLER) % NUM_REGLER;
  last_touch_ms = millis();
  const lv_color_t c = lv_color_hex(REGLER[editing].color);
  lv_obj_set_style_arc_color(edit_arc, c, LV_PART_INDICATOR);
  lv_obj_set_style_bg_color(edit_arc, c, LV_PART_KNOB);
  lv_obj_set_style_text_color(edit_name, c, 0);
  lv_arc_set_value(edit_arc, value_pct(editing));
  update_edit_labels();
  for (int k = 0; k < NUM_REGLER; k++) lv_obj_add_flag(seg[k], LV_OBJ_FLAG_HIDDEN);
  lv_obj_add_flag(creature, LV_OBJ_FLAG_HIDDEN);
  lv_obj_add_flag(gen_label, LV_OBJ_FLAG_HIDDEN);
  lv_obj_add_flag(desc_label, LV_OBJ_FLAG_HIDDEN);
  lv_obj_clear_flag(edit_arc, LV_OBJ_FLAG_HIDDEN);
  lv_obj_clear_flag(edit_panel, LV_OBJ_FLAG_HIDDEN);
}

static void show_info() {
  SimSnapshot s;
  if (!sim_snapshot(s)) return;
  explain_creature(s, sim_get_env(), info_text, sizeof info_text);
  lv_label_set_text(info_title, s.desc);
  lv_label_set_text(info_body, info_text);
  lv_obj_scroll_to_y(info_scroll, 0, LV_ANIM_OFF);
  lv_obj_clear_flag(info_panel, LV_OBJ_FLAG_HIDDEN);
  info_open = true;
  last_touch_ms = millis();
}

static void hide_info(lv_event_t *) {
  lv_obj_add_flag(info_panel, LV_OBJ_FLAG_HIDDEN);
  info_open = false;
}

// Übersicht: Tippen aufs Wesen = Erklärung, Tippen auf den Ring = Bogen unter dem Finger
static void screen_clicked(lv_event_t *) {
  if (editing >= 0) return;
  lv_point_t p;
  lv_indev_get_point(lv_indev_get_act(), &p);
  const int dx = p.x - LCD_W / 2, dy = p.y - LCD_H / 2;
  if (dx * dx + dy * dy < RING_TOUCH_R * RING_TOUCH_R) {
    show_info();
    return;
  }
  const int deg = int(lroundf(atan2f(float(dy), float(dx)) * 180.0f / float(M_PI)));
  for (int i = 0; i < NUM_REGLER; i++) {
    int d = norm360(deg - seg_center(i));
    if (d > 180) d -= 360;
    if (abs(d) <= SEG_SPAN / 2) {
      show_edit(i);
      return;
    }
  }
}

static void arc_changed(lv_event_t *) {
  last_touch_ms = millis();
  Environment e = sim_get_env();
  e.*REGLER[editing].field = real(lv_arc_get_value(edit_arc)) / real(100);
  sim_set_env(e);
  update_edit_labels();
}

static void arc_released(lv_event_t *) {
  Serial.printf("Regler %s = %d %%\n", REGLER[editing].name, lv_arc_get_value(edit_arc));
}

static void panel_event(lv_event_t *e) {
  const lv_event_code_t code = lv_event_get_code(e);
  if (code == LV_EVENT_GESTURE) {
    const lv_dir_t dir = lv_indev_get_gesture_dir(lv_indev_get_act());
    if (dir == LV_DIR_LEFT || dir == LV_DIR_RIGHT) {
      swallow_click = true;
      show_edit(editing + (dir == LV_DIR_LEFT ? 1 : -1));
    }
  } else if (code == LV_EVENT_CLICKED) {
    if (swallow_click) {
      swallow_click = false;
      return;
    }
    show_overview();
  } else if (code == LV_EVENT_PRESSED) {
    swallow_click = false;
    last_touch_ms = millis();
  }
}

static lv_obj_t *label(lv_obj_t *parent, const lv_font_t *font, uint32_t color, lv_coord_t y) {
  lv_obj_t *l = lv_label_create(parent);
  lv_label_set_text(l, "");
  lv_obj_set_style_text_font(l, font, 0);
  lv_obj_set_style_text_color(l, lv_color_hex(color), 0);
  lv_obj_set_style_text_align(l, LV_TEXT_ALIGN_CENTER, 0);
  lv_obj_align(l, LV_ALIGN_CENTER, 0, y);
  return l;
}

static void style_ring_arc(lv_obj_t *arc, lv_coord_t width) {
  lv_obj_set_size(arc, RING, RING);
  lv_obj_center(arc);
  lv_obj_set_style_arc_width(arc, width, LV_PART_MAIN);
  lv_obj_set_style_arc_width(arc, width, LV_PART_INDICATOR);
  lv_obj_set_style_arc_color(arc, lv_color_hex(0x22332A), LV_PART_MAIN);
  lv_obj_set_style_arc_rounded(arc, true, LV_PART_MAIN);
  lv_obj_set_style_arc_rounded(arc, true, LV_PART_INDICATOR);
  lv_arc_set_range(arc, 0, 100);
}

void ui_build() {
  lv_obj_t *scr = lv_scr_act();
  lv_obj_set_style_bg_color(scr, lv_color_hex(0x0B1A12), 0);
  lv_obj_clear_flag(scr, LV_OBJ_FLAG_SCROLLABLE);
  lv_obj_add_event_cb(scr, screen_clicked, LV_EVENT_CLICKED, nullptr);

  // Übersicht: ein kurzer Bogen je Regler, Füllung = Wert
  for (int i = 0; i < NUM_REGLER; i++) {
    lv_obj_t *a = lv_arc_create(scr);
    style_ring_arc(a, RING_W);
    const int c = seg_center(i);
    lv_arc_set_bg_angles(a, norm360(c - SEG_SPAN / 2 + SEG_GAP / 2), norm360(c + SEG_SPAN / 2 - SEG_GAP / 2));
    lv_obj_set_style_arc_color(a, lv_color_hex(REGLER[i].color), LV_PART_INDICATOR);
    lv_obj_remove_style(a, nullptr, LV_PART_KNOB);
    lv_obj_clear_flag(a, LV_OBJ_FLAG_CLICKABLE);
    seg[i] = a;
  }

  creature = creature_create(scr, 140, 124);
  lv_obj_align(creature, LV_ALIGN_CENTER, 0, -26);

  gen_label = label(scr, &font_de_14, 0xFFFFFF, 50);
  desc_label = label(scr, &font_de_14, 0x9FB4A8, 68);
  lv_obj_set_width(desc_label, 140);
  lv_label_set_long_mode(desc_label, LV_LABEL_LONG_SCROLL_CIRCULAR);
  // Langsame Laufschrift: jedes Pixel Versatz ist ein Neuzeichnen, das dem Sim-Task CPU nimmt
  lv_obj_set_style_anim_speed(desc_label, 18, 0);

  // Bearbeiten: ein großer Bogen über 270°, Knopf am Finger
  edit_arc = lv_arc_create(scr);
  style_ring_arc(edit_arc, 18);
  lv_arc_set_bg_angles(edit_arc, 135, 45);
  lv_obj_set_style_pad_all(edit_arc, 4, LV_PART_KNOB);
  lv_obj_add_event_cb(edit_arc, arc_changed, LV_EVENT_VALUE_CHANGED, nullptr);
  lv_obj_add_event_cb(edit_arc, arc_released, LV_EVENT_RELEASED, nullptr);

  // Mitte: Wischfläche + Tippen = zurück
  edit_panel = lv_obj_create(scr);
  lv_obj_remove_style_all(edit_panel);
  lv_obj_set_size(edit_panel, 150, 150);
  lv_obj_center(edit_panel);
  lv_obj_clear_flag(edit_panel, LV_OBJ_FLAG_SCROLLABLE);
  lv_obj_add_flag(edit_panel, LV_OBJ_FLAG_CLICKABLE);
  lv_obj_add_event_cb(edit_panel, panel_event, LV_EVENT_ALL, nullptr);
  edit_name = label(edit_panel, &font_de_20, 0xFFFFFF, -30);
  edit_value = label(edit_panel, &font_de_20, 0xFFFFFF, 0);
  edit_hint = label(edit_panel, &font_de_14, 0x9FB4A8, 26);
  lv_obj_t *nav = label(edit_panel, &font_de_14, 0x5F7468, 52);
  lv_label_set_text(nav, "< wischen >");

  // Erklärung: runde Fläche über allem, Text scrollt, Tippen schließt
  info_panel = lv_obj_create(scr);
  lv_obj_remove_style_all(info_panel);
  lv_obj_set_size(info_panel, LCD_W, LCD_H);
  lv_obj_set_style_radius(info_panel, LV_RADIUS_CIRCLE, 0);
  lv_obj_set_style_bg_color(info_panel, lv_color_hex(0x0B1A12), 0);
  lv_obj_set_style_bg_opa(info_panel, LV_OPA_COVER, 0);
  lv_obj_clear_flag(info_panel, LV_OBJ_FLAG_SCROLLABLE);
  lv_obj_add_flag(info_panel, LV_OBJ_FLAG_CLICKABLE);
  lv_obj_add_event_cb(info_panel, hide_info, LV_EVENT_CLICKED, nullptr);

  info_scroll = lv_obj_create(info_panel);
  lv_obj_remove_style_all(info_scroll);
  lv_obj_set_size(info_scroll, 172, 212);
  lv_obj_center(info_scroll);
  lv_obj_set_style_pad_ver(info_scroll, 26, 0);
  lv_obj_set_style_pad_row(info_scroll, 8, 0);
  lv_obj_set_flex_flow(info_scroll, LV_FLEX_FLOW_COLUMN);
  lv_obj_set_scroll_dir(info_scroll, LV_DIR_VER);
  lv_obj_set_scrollbar_mode(info_scroll, LV_SCROLLBAR_MODE_OFF);
  lv_obj_add_flag(info_scroll, LV_OBJ_FLAG_EVENT_BUBBLE);  // Tippen ohne Scrollen schließt
  lv_obj_add_event_cb(info_scroll, [](lv_event_t *) { last_touch_ms = millis(); }, LV_EVENT_SCROLL, nullptr);

  info_title = lv_label_create(info_scroll);
  lv_obj_set_width(info_title, lv_pct(100));
  lv_obj_set_style_text_font(info_title, &font_de_20, 0);
  lv_obj_set_style_text_color(info_title, lv_color_hex(0xFFFFFF), 0);
  lv_obj_set_style_text_align(info_title, LV_TEXT_ALIGN_CENTER, 0);
  lv_label_set_long_mode(info_title, LV_LABEL_LONG_WRAP);

  info_body = lv_label_create(info_scroll);
  lv_obj_set_width(info_body, lv_pct(100));
  lv_obj_set_style_text_font(info_body, &font_de_14, 0);
  lv_obj_set_style_text_color(info_body, lv_color_hex(0xC8D6CE), 0);
  lv_label_set_long_mode(info_body, LV_LABEL_LONG_WRAP);

  lv_obj_t *close = lv_label_create(info_scroll);
  lv_obj_set_width(close, lv_pct(100));
  lv_obj_set_style_text_color(close, lv_color_hex(0x5F7468), 0);
  lv_obj_set_style_text_align(close, LV_TEXT_ALIGN_CENTER, 0);
  lv_label_set_text(close, "tippen = zurück");

  lv_obj_add_flag(info_panel, LV_OBJ_FLAG_HIDDEN);
  show_overview();
}

void ui_env_changed() {
  if (editing >= 0) {
    lv_arc_set_value(edit_arc, value_pct(editing));
    update_edit_labels();
  } else {
    refresh_segments();
  }
}

void ui_tick() {
  if (editing >= 0 && millis() - last_touch_ms > EDIT_TIMEOUT_MS) show_overview();
  if (info_open && millis() - last_touch_ms > INFO_TIMEOUT_MS) hide_info(nullptr);

  static uint32_t shown = 0;
  SimSnapshot s;
  if (!sim_snapshot(s) || s.generation == shown) return;
  shown = s.generation;
  creature_set_genome(creature, s.mean);
  lv_label_set_text_fmt(gen_label, "Generation %u", s.generation);
  lv_label_set_text(desc_label, s.desc);
}
