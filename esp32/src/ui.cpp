#include "ui.h"

#include <Arduino.h>
#include <lvgl.h>
#include <math.h>

#include "board.h"
#include "challenges.h"
#include "creature.h"
#include "describe.h"
#include "explain.h"
#include "sim.h"

LV_FONT_DECLARE(font_de_14);
LV_FONT_DECLARE(font_de_20);

struct Regler {
  const char *name;
  uint32_t color;
  const char *words[3];  // niedrig / mittel / hoch
};

// Die sechs Spieler-Regler der App, im Uhrzeigersinn ab 1 Uhr.
// Reihenfolge = env_field() in game.cpp und die Grenzen in challenges.h.
static const Regler REGLER[] = {
    {"Wärme", 0xFF7043, {"eisig", "mild", "heiß"}},
    {"Licht", 0xFFE066, {"dunkel", "dämmrig", "sonnig"}},
    {"Wasser", 0x42A5F5, {"trocken", "Ufer", "tiefes Wasser"}},
    {"Futter", 0x8BC34A, {"karg", "mäßig", "reich"}},
    {"Futterhöhe", 0xC8A060, {"am Boden", "mittelhoch", "hoch oben"}},
    {"Räuber", 0xC062D8, {"keine", "einige", "viele"}},
};
static constexpr int NUM_REGLER = 6;
static constexpr int SEG_SPAN = 360 / NUM_REGLER;
static constexpr int SEG_GAP = 10;
static constexpr int SEG_FIRST = -60;  // Mitte des ersten Bogens (LVGL: 0° = 3 Uhr, im Uhrzeigersinn)
static constexpr uint32_t EDIT_TIMEOUT_MS = 6000;
static constexpr uint32_t CARD_TIMEOUT_MS = 30000;
static constexpr uint32_t BANNER_MS = 4500;
static constexpr lv_coord_t RING = 232;
static constexpr lv_coord_t RING_W = 14;
static constexpr lv_coord_t RING_TOUCH_R = 80;  // ab diesem Radius zählt ein Tippen als Ring
static constexpr int EDIT_START = 135, EDIT_SWEEP = 270;  // großer Bogen im Bearbeiten-Modus

static const char *const DIFFICULTY[3] = {"leicht", "mittel", "schwer"};
static const char *const KINGDOM_GOAL[K_COUNT] = {"eine Pflanze", "ein Tier", "einen Pilz", "eine Mikrobe",
                                                  "einen Protisten"};

// ---- Übersicht -----------------------------------------------------------
static lv_obj_t *seg[NUM_REGLER];
static lv_obj_t *creature;
static lv_obj_t *status_label;
static lv_obj_t *desc_label;
static lv_obj_t *banner_label;

// ---- Bearbeiten ----------------------------------------------------------
static lv_obj_t *edit_arc;
static lv_obj_t *forbid_lo, *forbid_hi;  // Bereiche außerhalb der Herausforderung
static lv_obj_t *edit_panel;
static lv_obj_t *edit_name;
static lv_obj_t *edit_value;
static lv_obj_t *edit_hint;

// ---- Karte (Erklärung, Menü, Herausforderung, Chronik, Rückblick, Ereignis) ----
enum CardMode { CARD_NONE, CARD_INFO, CARD_MENU, CARD_CHALLENGE, CARD_CHRONICLE, CARD_REVEAL, CARD_RESULT, CARD_EXTINCT };
// Ein Label je Zeile statt eines langen: LVGL zeichnet in Streifen und bricht für jeden
// Streifen den Text eines Labels komplett neu um (gemessen: 900 Zeichen ≈ 50 ms je Bild).
static constexpr int CARD_LINES = 16;
static constexpr int CARD_BTNS = 3;
static lv_obj_t *card_panel;
static lv_obj_t *card_scroll;
static lv_obj_t *card_title;
static lv_obj_t *card_line[CARD_LINES];
static lv_obj_t *card_btn[CARD_BTNS];
static lv_obj_t *card_btn_label[CARD_BTNS];
static lv_obj_t *card_hint;
static lv_obj_t *card_prev, *card_next;
static CardMode card = CARD_NONE;
static char card_text[1600];

// ---- Zustand -------------------------------------------------------------
static int editing = -1;  // -1 = Übersicht
static uint32_t last_touch_ms = 0;
static bool swallow_click = false;
static bool asleep = false;
static uint32_t sleep_gen = 0;
static SimSnapshot snap;
static bool have_snap = false;
static uint32_t banner_until = 0;
static uint32_t ring_flash_until = 0;  // Formwechsel: Ring leuchtet golden
static int ch_view = 0;                // angezeigte Herausforderung
static bool confirm_new_life = false;
static int last_challenge = -1;        // für „Nochmal“

static int seg_center(int i) { return SEG_FIRST + i * SEG_SPAN; }
static int norm360(int a) { return ((a % 360) + 360) % 360; }
static int pct(real v) { return int(v * 100 + real(0.5)); }
static const char *word_for(int i, int p) { return REGLER[i].words[p < 33 ? 0 : p < 67 ? 1 : 2]; }

static int target_pct(int i) {
  Environment e = sim_get_env();
  return pct(*env_field(e, i));
}

// ======================================================================== Karte

static void card_close() {
  if (card == CARD_EXTINCT) return;  // nur über „Neues Leben“
  lv_obj_add_flag(card_panel, LV_OBJ_FLAG_HIDDEN);
  card = CARD_NONE;
  confirm_new_life = false;
}

// Text auf die Zeilen-Labels verteilen; Zeilen mit „:“ am Ende sind Überschriften
static void card_set_text(const char *title, char *text) {
  lv_label_set_text(card_title, title);
  int n = 0;
  for (char *p = text; p && *p && n < CARD_LINES;) {
    char *end = strchr(p, '\n');
    if (end) *end = 0;
    if (*p) {
      const size_t len = strlen(p);
      lv_obj_set_style_text_color(card_line[n], lv_color_hex(p[len - 1] == ':' ? 0xFFFFFF : 0xC8D6CE), 0);
      lv_label_set_text(card_line[n], p);
      lv_obj_clear_flag(card_line[n++], LV_OBJ_FLAG_HIDDEN);
    }
    p = end ? end + 1 : nullptr;
  }
  for (; n < CARD_LINES; n++) lv_obj_add_flag(card_line[n], LV_OBJ_FLAG_HIDDEN);
}

static void card_set_buttons(const char *a, const char *b = nullptr, const char *c = nullptr) {
  const char *t[CARD_BTNS] = {a, b, c};
  for (int i = 0; i < CARD_BTNS; i++) {
    if (t[i]) {
      lv_label_set_text(card_btn_label[i], t[i]);
      lv_obj_clear_flag(card_btn[i], LV_OBJ_FLAG_HIDDEN);
    } else {
      lv_obj_add_flag(card_btn[i], LV_OBJ_FLAG_HIDDEN);
    }
  }
}

static void card_show(CardMode m, const char *hint) {
  card = m;
  lv_label_set_text(card_hint, hint);
  const bool arrows = m == CARD_CHALLENGE;
  if (arrows) {
    lv_obj_clear_flag(card_prev, LV_OBJ_FLAG_HIDDEN);
    lv_obj_clear_flag(card_next, LV_OBJ_FLAG_HIDDEN);
  } else {
    lv_obj_add_flag(card_prev, LV_OBJ_FLAG_HIDDEN);
    lv_obj_add_flag(card_next, LV_OBJ_FLAG_HIDDEN);
  }
  lv_obj_scroll_to_y(card_scroll, 0, LV_ANIM_OFF);
  lv_obj_clear_flag(card_panel, LV_OBJ_FLAG_HIDDEN);
  last_touch_ms = millis();
}

static void open_info() {
  if (!have_snap) return;
  explain_creature(snap, snap.envActual, card_text, sizeof card_text);
  card_set_text(snap.desc, card_text);
  card_set_buttons(nullptr);
  card_show(CARD_INFO, "tippen = zurück");
}

static void open_menu() {
  if (!have_snap) return;
  snprintf(card_text, sizeof card_text, "%u Generationen alt, %s.", unsigned(snap.age), STATUS_TEXT[snap.status]);
  card_set_text(snap.name, card_text);
  card_set_buttons("Herausforderung", "Chronik", "Neues Leben");
  confirm_new_life = false;
  card_show(CARD_MENU, "tippen daneben = zurück");
}

static void show_challenge(int idx) {
  ch_view = (idx + NUM_CHALLENGES) % NUM_CHALLENGES;
  const Challenge &c = CHALLENGES[ch_view];
  char bounds[220] = "";
  for (int f = 0; f < 6; f++) {
    if (c.lo[f] <= 0.001f && c.hi[f] >= 0.999f) continue;
    char b[48];
    snprintf(b, sizeof b, "%s%s %d–%d %%", bounds[0] ? ", " : "", REGLER[f].name, int(c.lo[f] * 100 + 0.5f),
             int(c.hi[f] * 100 + 0.5f));
    strncat(bounds, b, sizeof bounds - strlen(bounds) - 1);
  }
  const bool active = have_snap && snap.challenge == ch_view;
  snprintf(card_text, sizeof card_text,
           "%s\n%s\nZiel:\nMach daraus %s – in höchstens %u Generationen.\nRahmen:\n%s\n%s",
           c.title, c.desc, KINGDOM_GOAL[c.kingdom], unsigned(c.generations), bounds[0] ? bounds : "keiner",
           active ? (snap.chPhase == CH_WAIT ? "Läuft: warte, bis die Welt im Rahmen ist."
                                             : "Läuft gerade.")
                  : sim_challenge_solved(ch_view) ? "Schon einmal geschafft." : "");
  char title[48];
  snprintf(title, sizeof title, "%d / %d · %s", ch_view + 1, NUM_CHALLENGES, DIFFICULTY[c.difficulty]);
  card_set_text(title, card_text);
  card_set_buttons(active ? "Aufgeben" : "Annehmen");
  card_show(CARD_CHALLENGE, "< > blättern · tippen daneben = zurück");
}

static void open_challenges() {
  // laufende zuerst, sonst die erste noch ungelöste
  int start = have_snap && snap.challenge >= 0 ? snap.challenge : -1;
  for (int i = 0; start < 0 && i < NUM_CHALLENGES; i++)
    if (!sim_challenge_solved(i)) start = i;
  show_challenge(start < 0 ? 0 : start);
}

static void open_chronicle() {
  static ChronicleEntry ch[CHRONICLE_LEN];
  const int n = sim_chronicle(ch, CHRONICLE_LEN);
  card_text[0] = 0;
  for (int i = 0; i < n; i++) {
    char l[80];
    snprintf(l, sizeof l, "%sGen. %u: %s", i ? "\n" : "", unsigned(ch[i].gen), ch[i].desc);
    strncat(card_text, l, sizeof card_text - strlen(card_text) - 1);
  }
  char title[40];
  snprintf(title, sizeof title, "Chronik von %s", have_snap ? snap.name : "");
  card_set_text(title, card_text);
  card_set_buttons(nullptr);
  card_show(CARD_CHRONICLE, "tippen = zurück");
}

static void card_button(lv_event_t *e) {
  const int i = int(intptr_t(lv_event_get_user_data(e)));
  last_touch_ms = millis();
  switch (card) {
    case CARD_MENU:
      if (i == 0) open_challenges();
      if (i == 1) open_chronicle();
      if (i == 2) {
        if (!confirm_new_life) {
          confirm_new_life = true;  // zweiter Druck bestätigt – die Linie ist sonst weg
          lv_label_set_text(card_btn_label[2], "Wirklich neu?");
        } else {
          sim_new_lineage();
          card_close();
        }
      }
      break;
    case CARD_CHALLENGE:
      if (have_snap && snap.challenge == ch_view) {
        sim_abandon_challenge();
      } else {
        sim_accept_challenge(ch_view);
        last_challenge = ch_view;
      }
      card_close();
      break;
    case CARD_RESULT:
      if (i == 1 && last_challenge >= 0) sim_accept_challenge(last_challenge);
      card_close();
      break;
    case CARD_EXTINCT:
      sim_new_lineage();
      card = CARD_NONE;
      card_close();
      break;
    default:
      card_close();
  }
}

// ======================================================================== Übersicht

static void refresh_segments() {
  if (!have_snap) return;
  Environment a = snap.envActual;
  for (int i = 0; i < NUM_REGLER; i++) lv_arc_set_value(seg[i], pct(*env_field(a, i)));
}

static void update_status_line() {
  if (!have_snap || millis() < banner_until) return;
  uint32_t color = 0xFFFFFF;
  char t[64];
  if (snap.extinct) {
    snprintf(t, sizeof t, "%s ist ausgestorben", snap.name);
    color = 0xFF6B6B;
  } else if (snap.perilWarn) {
    snprintf(t, sizeof t, "%s stirbt aus! %d s", snap.name, int((1 - snap.peril01) * 60 + 0.5f));
    color = 0xFF6B6B;
  } else if (snap.challenge >= 0) {
    const Challenge &c = CHALLENGES[snap.challenge];
    if (snap.chPhase == CH_WAIT)
      snprintf(t, sizeof t, "Ziel %s: warte auf Rahmen", KINGDOM_NAMES[c.kingdom]);
    else
      snprintf(t, sizeof t, "Ziel %s · %u/%u", KINGDOM_NAMES[c.kingdom], unsigned(snap.chUsed),
               unsigned(c.generations));
    color = 0xFFD54F;
  } else {
    static const uint32_t SC[4] = {0x9CFFB0, 0xFFFFFF, 0xFFD54F, 0xFF8A65};
    snprintf(t, sizeof t, "%s · %s", snap.name, STATUS_TEXT[snap.status]);
    color = SC[snap.status];
  }
  lv_label_set_text(status_label, t);
  lv_obj_set_style_text_color(status_label, lv_color_hex(color), 0);
  lv_label_set_text(desc_label, snap.desc);
}

static void banner(const char *title, uint32_t color, const char *line1, const char *line2) {
  lv_label_set_text(banner_label, title);
  lv_obj_set_style_text_color(banner_label, lv_color_hex(color), 0);
  lv_obj_clear_flag(banner_label, LV_OBJ_FLAG_HIDDEN);
  if (line1) {
    lv_label_set_text(status_label, line1);
    lv_obj_set_style_text_color(status_label, lv_color_hex(color), 0);
  }
  if (line2) lv_label_set_text(desc_label, line2);
  banner_until = millis() + BANNER_MS;
}

static void show_overview() {
  editing = -1;
  lv_obj_add_flag(edit_arc, LV_OBJ_FLAG_HIDDEN);
  lv_obj_add_flag(forbid_lo, LV_OBJ_FLAG_HIDDEN);
  lv_obj_add_flag(forbid_hi, LV_OBJ_FLAG_HIDDEN);
  lv_obj_add_flag(edit_panel, LV_OBJ_FLAG_HIDDEN);
  for (int i = 0; i < NUM_REGLER; i++) lv_obj_clear_flag(seg[i], LV_OBJ_FLAG_HIDDEN);
  lv_obj_clear_flag(creature, LV_OBJ_FLAG_HIDDEN);
  lv_obj_clear_flag(status_label, LV_OBJ_FLAG_HIDDEN);
  lv_obj_clear_flag(desc_label, LV_OBJ_FLAG_HIDDEN);
  refresh_segments();
  update_status_line();
}

// ======================================================================== Bearbeiten

static int value_to_angle(float v) { return norm360(EDIT_START + int(v * EDIT_SWEEP + 0.5f)); }

static void update_edit_labels() {
  const int p = lv_arc_get_value(edit_arc);
  lv_label_set_text(edit_name, REGLER[editing].name);
  lv_label_set_text_fmt(edit_value, "%d %%", p);
  int world = p;
  if (have_snap) {
    Environment a = snap.envActual;
    world = pct(*env_field(a, editing));
  }
  if (abs(world - p) >= 2)
    lv_label_set_text_fmt(edit_hint, "%s · Welt jetzt %d %%", word_for(editing, p), world);
  else
    lv_label_set_text(edit_hint, word_for(editing, p));
}

static void update_forbidden() {
  const int ch = have_snap ? snap.challenge : -1;
  if (ch < 0) {
    lv_obj_add_flag(forbid_lo, LV_OBJ_FLAG_HIDDEN);
    lv_obj_add_flag(forbid_hi, LV_OBJ_FLAG_HIDDEN);
    return;
  }
  const Challenge &c = CHALLENGES[ch];
  if (c.lo[editing] > 0.005f) {
    lv_arc_set_bg_angles(forbid_lo, EDIT_START, value_to_angle(c.lo[editing]));
    lv_obj_clear_flag(forbid_lo, LV_OBJ_FLAG_HIDDEN);
  } else {
    lv_obj_add_flag(forbid_lo, LV_OBJ_FLAG_HIDDEN);
  }
  if (c.hi[editing] < 0.995f) {
    lv_arc_set_bg_angles(forbid_hi, value_to_angle(c.hi[editing]), value_to_angle(1));
    lv_obj_clear_flag(forbid_hi, LV_OBJ_FLAG_HIDDEN);
  } else {
    lv_obj_add_flag(forbid_hi, LV_OBJ_FLAG_HIDDEN);
  }
}

static void show_edit(int i) {
  editing = (i + NUM_REGLER) % NUM_REGLER;
  last_touch_ms = millis();
  const lv_color_t c = lv_color_hex(REGLER[editing].color);
  lv_obj_set_style_arc_color(edit_arc, c, LV_PART_INDICATOR);
  lv_obj_set_style_bg_color(edit_arc, c, LV_PART_KNOB);
  lv_obj_set_style_text_color(edit_name, c, 0);
  lv_arc_set_value(edit_arc, target_pct(editing));
  update_edit_labels();
  for (int k = 0; k < NUM_REGLER; k++) lv_obj_add_flag(seg[k], LV_OBJ_FLAG_HIDDEN);
  lv_obj_add_flag(creature, LV_OBJ_FLAG_HIDDEN);
  lv_obj_add_flag(status_label, LV_OBJ_FLAG_HIDDEN);
  lv_obj_add_flag(desc_label, LV_OBJ_FLAG_HIDDEN);
  lv_obj_add_flag(banner_label, LV_OBJ_FLAG_HIDDEN);
  lv_obj_clear_flag(edit_arc, LV_OBJ_FLAG_HIDDEN);
  lv_obj_clear_flag(edit_panel, LV_OBJ_FLAG_HIDDEN);
  update_forbidden();
}

static void arc_changed(lv_event_t *) {
  last_touch_ms = millis();
  Environment e = sim_get_env();
  *env_field(e, editing) = real(lv_arc_get_value(edit_arc)) / real(100);
  sim_set_env(e);
  // Herausforderung: der Regler bleibt im Rahmen – Knopf auf den erlaubten Wert zurück
  const int clamped = target_pct(editing);
  if (clamped != lv_arc_get_value(edit_arc)) lv_arc_set_value(edit_arc, clamped);
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

// ======================================================================== Eingabe Übersicht

static bool in_center(lv_point_t &p) {
  lv_indev_get_point(lv_indev_get_act(), &p);
  const int dx = p.x - LCD_W / 2, dy = p.y - LCD_H / 2;
  return dx * dx + dy * dy < RING_TOUCH_R * RING_TOUCH_R;
}

static void screen_event(lv_event_t *e) {
  if (editing >= 0 || card != CARD_NONE) return;
  const lv_event_code_t code = lv_event_get_code(e);
  lv_point_t p;
  const bool center = in_center(p);
  if (code == LV_EVENT_LONG_PRESSED && center) {
    creature_hop(1);
    open_menu();
    return;
  }
  if (code != LV_EVENT_SHORT_CLICKED) return;
  if (center) {
    // erst hüpfen, dann erklären
    creature_hop(1);
    lv_timer_t *t = lv_timer_create([](lv_timer_t *) { if (card == CARD_NONE && editing < 0) open_info(); }, 380,
                                    nullptr);
    lv_timer_set_repeat_count(t, 1);
    return;
  }
  const int deg = int(lroundf(atan2f(float(p.y - LCD_H / 2), float(p.x - LCD_W / 2)) * 180.0f / float(M_PI)));
  for (int i = 0; i < NUM_REGLER; i++) {
    int d = norm360(deg - seg_center(i));
    if (d > 180) d -= 360;
    if (abs(d) <= SEG_SPAN / 2) {
      show_edit(i);
      return;
    }
  }
}

// ======================================================================== Ereignisse

static void handle_event(const GameEvent &ev) {
  char t[96];
  switch (ev.type) {
    case EV_EVOLVED:
      if (asleep) break;  // erzählt der Rückblick beim Aufwachen
      creature_hop(2);
      ring_flash_until = millis() + 2500;
      snprintf(t, sizeof t, "vorher: %s", ev.a);
      banner("Evolution!", 0xFFD54F, ev.b, t);
      break;
    case EV_CH_RUNNING:
      if (!asleep) banner("Die Uhr läuft!", 0xFFD54F, nullptr, nullptr);
      break;
    case EV_PERIL_WARN:
      if (!asleep) banner("Gefahr!", 0xFF6B6B, nullptr, nullptr);
      break;
    case EV_CH_WON:
    case EV_CH_EXPIRED:
    case EV_CH_LEFT: {
      if (editing >= 0) show_overview();
      const bool won = ev.type == EV_CH_WON;
      if (ev.challenge >= 0) last_challenge = ev.challenge;
      snprintf(card_text, sizeof card_text, "%s\n%s", ev.challenge >= 0 ? CHALLENGES[ev.challenge].title : ev.a,
               won ? ev.b
                   : ev.type == EV_CH_EXPIRED ? "Das Generationen-Budget ist um. Jederzeit erneut versuchbar."
                                              : "Die Welt hat den Rahmen verlassen. Jederzeit erneut versuchbar.");
      card = CARD_NONE;
      card_set_text(won ? "Geschafft!" : "Nicht geschafft", card_text);
      if (won) {
        card_set_buttons("Weiter");
        creature_hop(2);
      } else {
        card_set_buttons("Schließen", "Nochmal");
      }
      card_show(CARD_RESULT, "");
      break;
    }
    case EV_EXTINCT:
      if (editing >= 0) show_overview();
      snprintf(card_text, sizeof card_text,
               "%s ist %s.\nDie Welt war zu lebensfeindlich – keine Form konnte sich mehr halten.\n"
               "Die Chronik erinnert an die Linie. Eine neue beginnt mit gestreuten Gründern.",
               ev.a, ev.b);
      card = CARD_NONE;
      card_set_text("Ausgestorben", card_text);
      card_set_buttons("Neues Leben");
      card_show(CARD_EXTINCT, "");
      break;
    default:
      break;
  }
}

// ======================================================================== Takt

static void anim_tick(lv_timer_t *) {
  if (asleep) return;
  const uint32_t now = millis();
  if (card == CARD_NONE && editing < 0) creature_tick(creature, now);

  // Ringfarbe: golden nach Formwechsel, rot pulsierend bei Aussterbe-Gefahr
  static int ring_state = -1;
  int want = 0;
  if (now < ring_flash_until) want = 1;
  else if (have_snap && snap.perilWarn && (now / 400) % 2 == 0) want = 2;
  if (want != ring_state) {
    ring_state = want;
    for (int i = 0; i < NUM_REGLER; i++)
      lv_obj_set_style_arc_color(seg[i], lv_color_hex(want == 1 ? 0xFFD54F : want == 2 ? 0xFF3B3B : REGLER[i].color),
                                 LV_PART_INDICATOR);
  }

  if (banner_until && now >= banner_until) {
    banner_until = 0;
    lv_obj_add_flag(banner_label, LV_OBJ_FLAG_HIDDEN);
    update_status_line();
  }
  if (editing >= 0 && now - last_touch_ms > EDIT_TIMEOUT_MS) show_overview();
  if ((card == CARD_INFO || card == CARD_MENU || card == CARD_CHALLENGE || card == CARD_CHRONICLE ||
       card == CARD_REVEAL) &&
      now - last_touch_ms > CARD_TIMEOUT_MS)
    card_close();
}

void ui_tick() {
  GameEvent ev;
  bool fresh = false;
  static uint32_t shown = UINT32_MAX;
  if (sim_snapshot(snap)) {
    have_snap = true;
    fresh = snap.generation != shown;
    shown = snap.generation;
  }
  while (sim_pop_event(ev)) handle_event(ev);
  if (!fresh) return;
  creature_set_genome(creature, snap.rep);
  if (editing < 0) refresh_segments();
  else update_edit_labels();
  update_status_line();
}

// ======================================================================== Aufbau

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

static lv_obj_t *forbid_arc(lv_obj_t *scr) {
  lv_obj_t *a = lv_arc_create(scr);
  lv_obj_set_size(a, RING, RING);
  lv_obj_center(a);
  lv_obj_set_style_arc_width(a, 18, LV_PART_MAIN);
  lv_obj_set_style_arc_color(a, lv_color_hex(0x401818), LV_PART_MAIN);
  lv_obj_set_style_arc_opa(a, LV_OPA_80, LV_PART_MAIN);
  lv_obj_set_style_arc_opa(a, LV_OPA_TRANSP, LV_PART_INDICATOR);
  lv_obj_remove_style(a, nullptr, LV_PART_KNOB);
  lv_obj_clear_flag(a, LV_OBJ_FLAG_CLICKABLE);
  lv_obj_add_flag(a, LV_OBJ_FLAG_HIDDEN);
  return a;
}

static lv_obj_t *button(lv_obj_t *parent, const char *text, lv_obj_t **label_out) {
  lv_obj_t *b = lv_btn_create(parent);
  lv_obj_set_size(b, lv_pct(100), 40);  // Touch-Ziel ≥ 40 px
  lv_obj_set_style_bg_color(b, lv_color_hex(0x2E5E44), 0);
  lv_obj_set_style_bg_color(b, lv_color_hex(0x4C8F6A), LV_STATE_PRESSED);
  lv_obj_set_style_radius(b, 20, 0);
  lv_obj_set_style_shadow_width(b, 0, 0);
  lv_obj_t *l = lv_label_create(b);
  lv_label_set_text(l, text);
  lv_obj_set_style_text_font(l, &font_de_14, 0);
  lv_obj_center(l);
  if (label_out) *label_out = l;
  return b;
}

void ui_build() {
  lv_obj_t *scr = lv_scr_act();
  lv_obj_set_style_bg_color(scr, lv_color_hex(0x0B1A12), 0);
  lv_obj_clear_flag(scr, LV_OBJ_FLAG_SCROLLABLE);
  lv_obj_add_event_cb(scr, screen_event, LV_EVENT_SHORT_CLICKED, nullptr);
  lv_obj_add_event_cb(scr, screen_event, LV_EVENT_LONG_PRESSED, nullptr);

  // Übersicht: ein kurzer Bogen je Regler, Füllung = wie die Welt gerade ist
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

  banner_label = label(scr, &font_de_20, 0xFFD54F, -86);
  lv_obj_add_flag(banner_label, LV_OBJ_FLAG_HIDDEN);
  status_label = label(scr, &font_de_14, 0xFFFFFF, 50);
  lv_obj_set_width(status_label, 160);
  lv_label_set_long_mode(status_label, LV_LABEL_LONG_DOT);
  desc_label = label(scr, &font_de_14, 0x9FB4A8, 68);
  lv_obj_set_width(desc_label, 140);
  lv_label_set_long_mode(desc_label, LV_LABEL_LONG_SCROLL_CIRCULAR);
  // Langsame Laufschrift: jedes Pixel Versatz ist ein Neuzeichnen, das dem Sim-Task CPU nimmt
  lv_obj_set_style_anim_speed(desc_label, 18, 0);

  // Bearbeiten: ein großer Bogen über 270°, Knopf am Finger; darüber die Sperrbereiche
  edit_arc = lv_arc_create(scr);
  style_ring_arc(edit_arc, 18);
  lv_arc_set_bg_angles(edit_arc, EDIT_START, norm360(EDIT_START + EDIT_SWEEP));
  lv_obj_set_style_pad_all(edit_arc, 4, LV_PART_KNOB);
  lv_obj_add_event_cb(edit_arc, arc_changed, LV_EVENT_VALUE_CHANGED, nullptr);
  lv_obj_add_event_cb(edit_arc, arc_released, LV_EVENT_RELEASED, nullptr);
  forbid_lo = forbid_arc(scr);
  forbid_hi = forbid_arc(scr);

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
  lv_obj_set_width(edit_hint, 150);
  lv_obj_t *nav = label(edit_panel, &font_de_14, 0x5F7468, 52);
  lv_label_set_text(nav, "< wischen >");

  // Karte: deckende Fläche über allem, Inhalt scrollt, Tippen daneben schließt.
  // Bewusst eckig (das Panel ist ohnehin rund): nur ein deckendes Rechteck erkennt
  // LVGL als „verdeckt alles dahinter“ – mit Radius zeichnete es bei jedem Scrollbild
  // Wesen und Ringbögen unter der Fläche mit.
  card_panel = lv_obj_create(scr);
  lv_obj_remove_style_all(card_panel);
  lv_obj_set_size(card_panel, LCD_W, LCD_H);
  lv_obj_set_style_bg_color(card_panel, lv_color_hex(0x0B1A12), 0);
  lv_obj_set_style_bg_opa(card_panel, LV_OPA_COVER, 0);
  lv_obj_clear_flag(card_panel, LV_OBJ_FLAG_SCROLLABLE);
  lv_obj_add_flag(card_panel, LV_OBJ_FLAG_CLICKABLE);
  lv_obj_add_event_cb(card_panel, [](lv_event_t *) { card_close(); }, LV_EVENT_CLICKED, nullptr);

  card_scroll = lv_obj_create(card_panel);
  lv_obj_remove_style_all(card_scroll);
  lv_obj_set_size(card_scroll, 164, 212);
  lv_obj_center(card_scroll);
  lv_obj_set_style_pad_ver(card_scroll, 26, 0);
  lv_obj_set_style_pad_row(card_scroll, 8, 0);
  lv_obj_set_flex_flow(card_scroll, LV_FLEX_FLOW_COLUMN);
  lv_obj_set_scroll_dir(card_scroll, LV_DIR_VER);
  lv_obj_set_scrollbar_mode(card_scroll, LV_SCROLLBAR_MODE_OFF);
  lv_obj_add_flag(card_scroll, LV_OBJ_FLAG_EVENT_BUBBLE);  // Tippen ohne Scrollen schließt
  lv_obj_add_event_cb(card_scroll, [](lv_event_t *) { last_touch_ms = millis(); }, LV_EVENT_SCROLL, nullptr);

  card_title = lv_label_create(card_scroll);
  lv_obj_set_width(card_title, lv_pct(100));
  lv_obj_set_style_text_font(card_title, &font_de_20, 0);
  lv_obj_set_style_text_color(card_title, lv_color_hex(0xFFFFFF), 0);
  lv_obj_set_style_text_align(card_title, LV_TEXT_ALIGN_CENTER, 0);
  lv_label_set_long_mode(card_title, LV_LABEL_LONG_WRAP);
  for (auto &l : card_line) {
    l = lv_label_create(card_scroll);
    lv_obj_set_width(l, lv_pct(100));
    lv_obj_set_style_text_font(l, &font_de_14, 0);
    lv_label_set_long_mode(l, LV_LABEL_LONG_WRAP);
  }
  for (int i = 0; i < CARD_BTNS; i++) {
    card_btn[i] = button(card_scroll, "", &card_btn_label[i]);
    lv_obj_add_event_cb(card_btn[i], card_button, LV_EVENT_CLICKED, (void *)intptr_t(i));
  }
  card_hint = lv_label_create(card_scroll);
  lv_obj_set_width(card_hint, lv_pct(100));
  lv_obj_set_style_text_color(card_hint, lv_color_hex(0x5F7468), 0);
  lv_obj_set_style_text_align(card_hint, LV_TEXT_ALIGN_CENTER, 0);
  lv_label_set_long_mode(card_hint, LV_LABEL_LONG_WRAP);

  // Blättern bei den Herausforderungen
  card_prev = button(card_panel, "<", nullptr);
  lv_obj_set_size(card_prev, 34, 48);
  lv_obj_align(card_prev, LV_ALIGN_LEFT_MID, 4, 0);
  lv_obj_add_event_cb(card_prev, [](lv_event_t *) { show_challenge(ch_view - 1); }, LV_EVENT_CLICKED, nullptr);
  card_next = button(card_panel, ">", nullptr);
  lv_obj_set_size(card_next, 34, 48);
  lv_obj_align(card_next, LV_ALIGN_RIGHT_MID, -4, 0);
  lv_obj_add_event_cb(card_next, [](lv_event_t *) { show_challenge(ch_view + 1); }, LV_EVENT_CLICKED, nullptr);

  lv_obj_add_flag(card_panel, LV_OBJ_FLAG_HIDDEN);
  lv_timer_create(anim_tick, 50, nullptr);
  show_overview();
}

void ui_env_changed() {
  if (editing >= 0) {
    lv_arc_set_value(edit_arc, target_pct(editing));
    update_edit_labels();
  }
}

// ======================================================================== Schlaf

void ui_sleep() {
  asleep = true;
  sleep_gen = have_snap ? snap.generation : 0;
  if (editing >= 0) show_overview();
  if (card != CARD_EXTINCT && card != CARD_RESULT) card_close();
}

void ui_wake() {
  asleep = false;
  last_touch_ms = millis();
  if (!have_snap || card == CARD_EXTINCT || card == CARD_RESULT) return;
  const uint32_t passed = snap.generation - sleep_gen;
  if (passed < 10) return;
  // „Was ist passiert, während ich weg war?“ (docs/plan-A-lebender-begleiter.md)
  static ChronicleEntry ch[CHRONICLE_LEN];
  const int n = sim_chronicle(ch, CHRONICLE_LEN);
  snprintf(card_text, sizeof card_text, "Seit du zuletzt geschaut hast: %u Generationen.", unsigned(passed));
  int changes = 0;
  for (int i = 0; i < n; i++) {
    if (ch[i].gen <= sleep_gen) continue;
    char l[80];
    snprintf(l, sizeof l, "\nGen. %u: %s", unsigned(ch[i].gen), ch[i].desc);
    strncat(card_text, l, sizeof card_text - strlen(card_text) - 1);
    changes++;
  }
  char l[96];
  if (changes == 0)
    snprintf(l, sizeof l, "\n%s ist sich treu geblieben und %s.", snap.name, STATUS_TEXT[snap.status]);
  else
    snprintf(l, sizeof l, "\nJetzt: %s – %s.", snap.desc, STATUS_TEXT[snap.status]);
  strncat(card_text, l, sizeof card_text - strlen(card_text) - 1);
  card_set_text("Willkommen zurück!", card_text);
  card_set_buttons(nullptr);
  card_show(CARD_REVEAL, "tippen = weiter");
  if (changes) creature_hop(2);
}

// ======================================================================== Messlauf

void ui_info_open() { open_info(); }
void ui_info_scroll(int dy) {
  last_touch_ms = millis();
  lv_obj_scroll_by_bounded(card_scroll, 0, -dy, LV_ANIM_OFF);
}
void ui_info_close() { card_close(); }
void ui_info_invalidate() { lv_obj_invalidate(card_panel); }
void ui_info_text_visible(bool on) {
  // Nur für den Messlauf: Text weg, um Text- von Flächenkosten zu trennen
  if (on)
    lv_obj_clear_flag(card_scroll, LV_OBJ_FLAG_HIDDEN);
  else
    lv_obj_add_flag(card_scroll, LV_OBJ_FLAG_HIDDEN);
}
