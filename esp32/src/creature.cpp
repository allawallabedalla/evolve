#include "creature.h"

#include <stdlib.h>
#include <string.h>

#include "describe.h"
#include "physics.h"

namespace P = phys;

static real genome[P::NUM_GENES];
static bool have_genome = false;

// Animationszustand, von creature_tick() je Bild gesetzt
static float breath = 0;          // relative Größenänderung des Körpers (Atmen)
static int off_x = 0, off_y = 0;  // Wiegen, Wippen, Hüpfen
static float flap = 1;            // Flügelspannweite 0.7..1
static float glow_k = 1;          // Puls des Leuchtens
static bool blinking = false;
static float jiggle = 0;  // Zellen zittern, Geißel schlägt
static uint32_t hop_start = 0, hop_len = 0;
static int hop_height = 0, hop_count = 1;

// Streicheln
static bool petting = false;
static float look_x = 0, look_y = 0;  // Blick zum Finger
static float lean_x = 0;              // Neigung zum Finger
static int pet_dist = 0;              // gestrichene Strecke seit dem letzten Herz
static int pet_last_x = -1, pet_last_y = -1;
struct Spark {
  uint32_t t0;
  int16_t dx;
};
static Spark sparks[6];
static int spark_next = 0;
static constexpr uint32_t SPARK_MS = 1400;

static inline int breathe(int r) { return int(r * (1 + breath) + 0.5f); }
static inline float clamp01(float x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
static inline int lerp(float a, float b, float t) { return int(a + (b - a) * clamp01(t) + 0.5f); }

// Punkt auf Kreis/Ellipse; lv_trigo_sin: Grad 0..359 -> ±32767
static inline int16_t nd(int d) { return int16_t(((d % 360) + 360) % 360); }
static inline int px(int cx, int r, int deg) { return cx + (r * lv_trigo_sin(nd(deg + 90))) / 32767; }
static inline int py(int cy, int r, int deg) { return cy + (r * lv_trigo_sin(nd(deg))) / 32767; }

// ---------------------------------------------------------------- Pinsel

static void ellipse(lv_draw_ctx_t *ctx, int cx, int cy, int rw, int rh, lv_color_t c, lv_opa_t opa = LV_OPA_COVER) {
  if (rw < 1 || rh < 1) return;
  lv_draw_rect_dsc_t d;
  lv_draw_rect_dsc_init(&d);
  d.radius = LV_RADIUS_CIRCLE;
  d.bg_color = c;
  d.bg_opa = opa;
  lv_area_t a = {lv_coord_t(cx - rw), lv_coord_t(cy - rh), lv_coord_t(cx + rw), lv_coord_t(cy + rh)};
  lv_draw_rect(ctx, &d, &a);
}

// Körper mit Licht von oben links: Verlauf hell -> dunkel, feine Kontur, Glanzpunkt
static void shaded(lv_draw_ctx_t *ctx, int cx, int cy, int rw, int rh, lv_color_t c, lv_opa_t opa = LV_OPA_COVER,
                   bool gloss = true) {
  if (rw < 1 || rh < 1) return;
  lv_draw_rect_dsc_t d;
  lv_draw_rect_dsc_init(&d);
  d.radius = LV_RADIUS_CIRCLE;
  d.bg_opa = opa;
  d.bg_grad.dir = LV_GRAD_DIR_VER;
  d.bg_grad.stops_count = 2;
  d.bg_grad.stops[0].color = lv_color_lighten(c, 45);
  d.bg_grad.stops[0].frac = 0;
  d.bg_grad.stops[1].color = lv_color_darken(c, 70);
  d.bg_grad.stops[1].frac = 255;
  d.border_width = 1;
  d.border_color = lv_color_darken(c, 130);
  d.border_opa = LV_OPA_60;
  lv_area_t a = {lv_coord_t(cx - rw), lv_coord_t(cy - rh), lv_coord_t(cx + rw), lv_coord_t(cy + rh)};
  lv_draw_rect(ctx, &d, &a);
  if (gloss && rw > 5) ellipse(ctx, cx - rw * 35 / 100, cy - rh * 45 / 100, rw * 26 / 100, rh * 16 / 100, lv_color_white(), 70);
}

static void line(lv_draw_ctx_t *ctx, int x1, int y1, int x2, int y2, int w, lv_color_t c, lv_opa_t opa = LV_OPA_COVER) {
  lv_draw_line_dsc_t d;
  lv_draw_line_dsc_init(&d);
  d.color = c;
  d.width = w;
  d.opa = opa;
  d.round_start = 1;
  d.round_end = 1;
  lv_point_t a = {lv_coord_t(x1), lv_coord_t(y1)}, b = {lv_coord_t(x2), lv_coord_t(y2)};
  lv_draw_line(ctx, &d, &a, &b);
}

static void poly(lv_draw_ctx_t *ctx, const lv_point_t *p, int n, lv_color_t c, lv_opa_t opa = LV_OPA_COVER) {
  lv_draw_rect_dsc_t d;
  lv_draw_rect_dsc_init(&d);
  d.bg_color = c;
  d.bg_opa = opa;
  lv_draw_polygon(ctx, &d, p, uint16_t(n));
}

static void tri(lv_draw_ctx_t *ctx, int x1, int y1, int x2, int y2, int x3, int y3, lv_color_t c,
                lv_opa_t opa = LV_OPA_COVER) {
  lv_point_t p[3] = {{lv_coord_t(x1), lv_coord_t(y1)}, {lv_coord_t(x2), lv_coord_t(y2)}, {lv_coord_t(x3), lv_coord_t(y3)}};
  poly(ctx, p, 3, c, opa);
}

// Blatt: spitz zulaufende Raute von (x,y) in Richtung deg, mit Mittelrippe
static void leaf(lv_draw_ctx_t *ctx, int x, int y, int deg, int len, int wid, lv_color_t c) {
  const int mx = px(x, len * 45 / 100, deg), my = py(y, len * 45 / 100, deg);
  lv_point_t p[4] = {{lv_coord_t(x), lv_coord_t(y)},
                     {lv_coord_t(px(mx, wid, deg - 90)), lv_coord_t(py(my, wid, deg - 90))},
                     {lv_coord_t(px(x, len, deg)), lv_coord_t(py(y, len, deg))},
                     {lv_coord_t(px(mx, wid, deg + 90)), lv_coord_t(py(my, wid, deg + 90))}};
  poly(ctx, p, 4, c);
  // die dem Licht abgewandte Hälfte etwas dunkler
  lv_point_t h[3] = {p[0], p[2], p[3]};
  poly(ctx, h, 3, lv_color_darken(c, 40), 120);
  line(ctx, x, y, px(x, len * 85 / 100, deg), py(y, len * 85 / 100, deg), 1, lv_color_darken(c, 90), 150);
}

// Weicher Schein statt Scheibe: zwei Ringe zunehmender Deckkraft, pulsierend
static void glow(lv_draw_ctx_t *ctx, int cx, int cy, int r, float biolum, lv_color_t c = lv_color_hex(0x40FFE0)) {
  if (biolum < 0.5f) return;  // wie „leuchtend“ in describe()
  const float k = clamp01((biolum - 0.5f) / 0.5f) * glow_k;
  ellipse(ctx, cx, cy, r + 13, r + 13, c, lv_opa_t(16 + 22 * k));
  ellipse(ctx, cx, cy, r + 5, r + 5, c, lv_opa_t(24 + 40 * k));
}

static void ground_shadow(lv_draw_ctx_t *ctx, int cx, int y, int rw) {
  // flache Ellipsen zeichnet LVGL als Kapseln – drei schmaler und höher werdende
  // Schichten ergeben zusammen einen weichen, ovalen Schatten
  ellipse(ctx, cx, y, rw, 2, lv_color_black(), 22);
  ellipse(ctx, cx, y, rw * 75 / 100, 3, lv_color_black(), 24);
  ellipse(ctx, cx, y, rw * 45 / 100, 4, lv_color_black(), 28);
}

// Grundfarbe je Reich, Pigment dunkelt, Tarnung zieht Richtung Oliv
static lv_color_t body_color(lv_color_t base, float pigment, float camo) {
  lv_color_t c = lv_color_darken(base, lv_opa_t(clamp01(pigment - 0.12f) * 120));
  return lv_color_mix(lv_color_hex(0x5B6B32), c, lv_opa_t(clamp01(camo - 0.12f) * 170));
}

// ---------------------------------------------------------------- Pflanze

static void flower(lv_draw_ctx_t *ctx, int x, int y, int r, lv_color_t petal) {
  for (int k = 0; k < 5; k++) shaded(ctx, px(x, r, k * 72 - 90), py(y, r, k * 72 - 90), r * 7 / 10, r * 7 / 10, petal, LV_OPA_COVER, false);
  ellipse(ctx, x, y, r * 6 / 10, r * 6 / 10, lv_color_hex(0xFFD54F));
}

static void draw_plant(lv_draw_ctx_t *ctx, int cx, int cy, const real *g) {
  const float size = g[P::T_SIZE], photo = g[P::T_PHOTOSYNTHESIS], structure = g[P::T_STRUCTURE];
  const float armor = g[P::T_ARMOR], insul = g[P::T_INSULATION];
  const int ground = cy + 46;
  const lv_color_t green = body_color(lv_color_hex(0x43A047), g[P::T_PIGMENT], g[P::T_CAMO]);
  const lv_color_t wood = lv_color_hex(0x7A5230);
  const int sway = off_x;

  if (structure > 0.62f && size > 0.4f) {
    // Baum: konischer Stamm, Krone aus überlappenden Laubballen
    const int h = lerp(34, 62, size);
    const int w0 = lerp(5, 11, size), w1 = w0 * 55 / 100;
    const int top = ground - h;
    const int r = breathe(lerp(18, 32, size));
    ground_shadow(ctx, cx, ground, r + 6);
    glow(ctx, cx + sway, top - r / 2, r, g[P::T_BIOLUM]);
    lv_point_t trunk[4] = {{lv_coord_t(cx - w0), lv_coord_t(ground)}, {lv_coord_t(cx + w0), lv_coord_t(ground)},
                           {lv_coord_t(cx + sway + w1), lv_coord_t(top)}, {lv_coord_t(cx + sway - w1), lv_coord_t(top)}};
    poly(ctx, trunk, 4, wood);
    line(ctx, cx - w0 / 2, ground - 2, cx + sway - w1 / 2, top + 4, 1, lv_color_darken(wood, 80), 140);  // Rinde
    line(ctx, cx + sway / 2, top + h / 3, cx + sway / 2 + r / 2, top + h / 3 - r / 3, 3, wood);         // Ast
    if (armor > 0.6f)
      for (int i = 1; i <= 3; i++) {
        const int y = ground - h * i / 4, x = cx + sway * i / 4, s = i % 2 ? 1 : -1;
        tri(ctx, x + s * w0 * 7 / 10, y - 3, x + s * w0 * 7 / 10, y + 3, x + s * (w0 + 6), y, lv_color_darken(wood, 60));
      }
    const int ccx = cx + sway, ccy = top - r / 3;
    const lv_color_t dark = lv_color_darken(green, 50), light = lv_color_lighten(green, 30);
    shaded(ctx, ccx - r * 7 / 10, ccy + r / 5, r * 7 / 10, r * 6 / 10, dark, LV_OPA_COVER, false);
    shaded(ctx, ccx + r * 7 / 10, ccy + r / 5, r * 7 / 10, r * 6 / 10, dark, LV_OPA_COVER, false);
    shaded(ctx, ccx, ccy, r, r * 85 / 100, green);
    shaded(ctx, ccx - r / 3, ccy - r / 2, r * 6 / 10, r * 5 / 10, light, LV_OPA_COVER, false);
    // Früchte/Blüten bei viel Photosynthese
    if (photo > 0.7f)
      for (int k = 0; k < 4; k++) ellipse(ctx, px(ccx, r * 6 / 10, 200 + k * 45), py(ccy, r * 5 / 10, 200 + k * 45), 3, 3, lv_color_hex(0xFF7096));
    if (insul > 0.6f)
      for (int deg = 180; deg <= 360; deg += 20)
        line(ctx, px(ccx, r, deg), py(ccy, r * 85 / 100, deg), px(ccx, r + 4, deg), py(ccy, r * 85 / 100 + 4, deg), 1, lv_color_hex(0xDDEEDD));
    return;
  }

  // Kraut: Blattrosette aus dem Boden, bei viel Licht mit Blüte
  const int leaves = 4 + int(photo * 5 + 0.5f);
  const int len = breathe(lerp(34, 58, size));
  const int wid = lerp(7, 11, photo);
  ground_shadow(ctx, cx, ground, len * 7 / 10);
  glow(ctx, cx, ground - len / 2, len / 2, g[P::T_BIOLUM]);
  const int stemH = lerp(len * 6 / 10, len * 6 / 10 + 26, structure);
  {
    line(ctx, cx, ground, cx + sway, ground - stemH, 3, lv_color_darken(green, 40));
    if (armor > 0.6f)
      for (int i = 1; i <= 2; i++) tri(ctx, cx + sway * i / 3 + 1, ground - stemH * i / 3, cx + sway * i / 3 + 1, ground - stemH * i / 3 - 5, cx + sway * i / 3 + 6, ground - stemH * i / 3 - 2, lv_color_darken(green, 60));
  }
  for (int i = 0; i < leaves; i++) {
    const int deg = 215 + (110 * i) / (leaves - 1);  // Fächer nach oben
    const int s = (i % 2) ? 0 : 1;
    const int l = len - s * len / 4 - (abs(deg - 270) * len) / 300;  // seitliche Blätter kürzer
    leaf(ctx, cx, ground - 2, deg + sway, l, wid, s ? green : lv_color_lighten(green, 25));
  }
  if (photo > 0.6f)
    flower(ctx, cx + sway, ground - stemH, lerp(4, 7, size), lv_color_hex(0xF48FB1));
  else
    shaded(ctx, cx + sway, ground - stemH, 4, 5, lv_color_lighten(green, 40), LV_OPA_COVER, false);  // Knospe
  if (insul > 0.6f)
    for (int i = 0; i < leaves; i++) {
      const int deg = 215 + (110 * i) / (leaves - 1);
      ellipse(ctx, px(cx, len * 6 / 10, deg), py(ground - 2, len * 6 / 10, deg), 1, 1, lv_color_hex(0xEEFFEE));
    }
}

// ---------------------------------------------------------------- Pilz

static void mushroom(lv_draw_ctx_t *ctx, int x, int ground, int capR, int stalkH, lv_color_t cap, float armor, float biolum) {
  const int capY = ground - stalkH;
  const int sw = capR * 30 / 100 + 2;
  glow(ctx, x, capY, capR * 8 / 10, biolum, lv_color_hex(0x9CFF6B));
  const lv_color_t cream = lv_color_hex(0xEDE3CF);
  lv_point_t stalk[4] = {{lv_coord_t(x - sw - 2), lv_coord_t(ground)}, {lv_coord_t(x + sw + 2), lv_coord_t(ground)},
                         {lv_coord_t(x + sw - 1), lv_coord_t(capY)}, {lv_coord_t(x - sw + 1), lv_coord_t(capY)}};
  poly(ctx, stalk, 4, cream);
  line(ctx, x + sw / 2, ground - 2, x + sw / 2 - 1, capY + 3, 2, lv_color_darken(cream, 50), 120);
  // Lamellen: schmales, dunkleres Band unter dem Hutrand
  const int gy = capY + capR * 22 / 100;
  ellipse(ctx, x, gy, capR * 80 / 100, capR * 12 / 100 + 1, lv_color_hex(0xA88F6A));
  for (int k = -3; k <= 3; k++) line(ctx, x + k * capR * 8 / 100, gy - 1, x + k * capR * 22 / 100, gy + capR * 9 / 100, 1, lv_color_hex(0x7D6748), 170);
  // Hut als Kuppel: Ellipse, deren Unterkante knapp über den Lamellen endet
  shaded(ctx, x, capY - capR * 18 / 100, capR, capR * 52 / 100, cap);
  // Tupfen; Panzerung macht sie zu harten Warzen
  const lv_color_t spot = armor > 0.55f ? lv_color_darken(cap, 80) : lv_color_hex(0xFFF7E8);
  ellipse(ctx, x - capR * 45 / 100, capY - capR * 25 / 100, capR / 8 + 1, capR / 10 + 1, spot);
  ellipse(ctx, x + capR * 20 / 100, capY - capR * 45 / 100, capR / 7 + 1, capR / 9 + 1, spot);
  ellipse(ctx, x + capR * 55 / 100, capY - capR * 20 / 100, capR / 10 + 1, capR / 12 + 1, spot);
}

static void draw_fungus(lv_draw_ctx_t *ctx, int cx, int cy, const real *g) {
  const float size = g[P::T_SIZE];
  const int ground = cy + 46;
  const int capR = breathe(lerp(18, 40, size));
  lv_color_t cap = body_color(lv_color_hex(0xC0603A), g[P::T_PIGMENT], g[P::T_CAMO]);
  if (g[P::T_BIOLUM] >= 0.5f) cap = lv_color_mix(lv_color_hex(0x7CFFB2), cap, 90);  // Leuchtpilz
  ground_shadow(ctx, cx, ground, capR + 16);
  // kleine Geschwister neben dem großen
  mushroom(ctx, cx - capR - 4, ground, capR * 45 / 100, capR * 50 / 100, lv_color_lighten(cap, 20), g[P::T_ARMOR], g[P::T_BIOLUM]);
  mushroom(ctx, cx + capR + 2, ground, capR * 35 / 100, capR * 40 / 100, lv_color_lighten(cap, 10), g[P::T_ARMOR], g[P::T_BIOLUM]);
  mushroom(ctx, cx + off_x / 2, ground, capR, lerp(16, 40, size), cap, g[P::T_ARMOR], g[P::T_BIOLUM]);
}

// ---------------------------------------------------------------- Einzeller

static void cell(lv_draw_ctx_t *ctx, int cx, int cy, int r, lv_color_t c, bool cilia, int phase) {
  if (cilia)
    for (int deg = 0; deg < 360; deg += 24) {
      const int w = deg + int(jiggle * 12) + phase;
      line(ctx, px(cx, r, deg), py(cy, r, deg), px(cx, r + 4, w + 8), py(cy, r + 4, w + 8), 1, lv_color_lighten(c, 60), 180);
    }
  // Membran: durchscheinend, heller Rand
  ellipse(ctx, cx, cy, r + 1, r + 1, lv_color_lighten(c, 90), 200);
  ellipse(ctx, cx, cy, r - 1, r - 1, c, 170);
  ellipse(ctx, cx - r / 3, cy - r / 3, r / 3, r / 4, lv_color_white(), 60);
  // Zellkern + Organellen
  shaded(ctx, cx + r / 5, cy + r / 6, r * 38 / 100 + 1, r * 34 / 100 + 1, lv_color_darken(c, 80), LV_OPA_COVER, false);
  ellipse(ctx, cx + r / 4, cy + r / 8, 1, 1, lv_color_lighten(c, 120));
  ellipse(ctx, cx - r / 3, cy + r / 3, 2, 1, lv_color_hex(0xFFD54F), 200);
  ellipse(ctx, cx - r / 6, cy - r / 2 + 2, 1, 1, lv_color_hex(0xFF8A65), 220);
}

static void draw_microbe(lv_draw_ctx_t *ctx, int cx, int cy, const real *g) {
  const lv_color_t c = body_color(lv_color_hex(0x9C7BD0), g[P::T_PIGMENT], g[P::T_CAMO]);
  const int r = breathe(lerp(9, 15, g[P::T_SIZE] / 0.18f));
  const int j = int(jiggle * 2);
  glow(ctx, cx, cy + 4, r * 2, g[P::T_BIOLUM]);
  cell(ctx, cx - r - 6 + j, cy + 10, r, lv_color_lighten(c, 15), true, 0);
  cell(ctx, cx + r + 6, cy + 14 - j, r - 2, c, true, 40);
  cell(ctx, cx + 2 - j, cy - r + 2, r + 2, c, true, 80);
  cell(ctx, cx + r + 10 + j, cy - r - 6, r / 2 + 1, lv_color_darken(c, 20), true, 120);
}

static void draw_protist(lv_draw_ctx_t *ctx, int cx, int cy, const real *g) {
  const float size = g[P::T_SIZE];
  const int r = breathe(lerp(16, 34, size));
  const lv_color_t c = body_color(lv_color_hex(0x3FB8A8), g[P::T_PIGMENT], g[P::T_CAMO]);
  glow(ctx, cx, cy, r, g[P::T_BIOLUM]);
  // Geißel: glatte, schlagende Welle, nach hinten dünner
  const int len = lerp(14, 48, g[P::T_MOBILITY]);
  int x0 = cx + r - 3, y0 = cy;
  for (int i = 1; i <= 24; i++) {
    const int x1 = cx + r - 3 + len * i / 24;
    const int y1 = cy + (lv_trigo_sin(nd(i * 24 + int((jiggle + 1) * 180))) * (2 + i / 4)) / 32767;
    line(ctx, x0, y0, x1, y1, i < 12 ? 3 : 2, lv_color_lighten(c, 40));
    x0 = x1;
    y0 = y1;
  }
  // Körper: leicht tropfenförmig (Hauptkörper + Spitze zur Geißel)
  tri(ctx, cx + r * 6 / 10, cy - r * 45 / 100, cx + r * 6 / 10, cy + r * 45 / 100, cx + r + 2, cy, lv_color_darken(c, 20), 200);
  shaded(ctx, cx, cy, r, r * 8 / 10, c, 215);
  // Chloroplasten, wenn halb Pflanze
  const int chl = int(g[P::T_PHOTOSYNTHESIS] * 6 + 0.5f);
  for (int i = 0; i < chl; i++)
    shaded(ctx, px(cx, r * 70 / 100, 110 + i * 32), py(cy, r * 56 / 100, 110 + i * 32), 3, 2, lv_color_hex(0x2E9D3A), LV_OPA_COVER, false);
  // Kern mit Kernkörperchen, pulsierende Vakuole, roter Augenfleck
  shaded(ctx, cx - r / 5, cy + r / 10, r * 30 / 100, r * 28 / 100, lv_color_hex(0x5E35B1), LV_OPA_COVER, false);
  ellipse(ctx, cx - r / 5 + 1, cy + r / 10 - 1, 2, 2, lv_color_hex(0xB39DDB));
  const int vac = 2 + int((jiggle + 1) * 1.5f);
  ellipse(ctx, cx - r * 55 / 100, cy - r * 30 / 100, vac + 1, vac + 1, lv_color_hex(0xE0F7FA), 150);
  ellipse(ctx, cx + r * 55 / 100, cy - r * 25 / 100, 2, 2, lv_color_hex(0xFF5252));
}

// ---------------------------------------------------------------- Tier

static void eyes(lv_draw_ctx_t *ctx, int cx, int ey, int dx, int e, int look, int look_y) {
  for (int s = -1; s <= 1; s += 2) {
    const int ex = cx + s * dx;
    if (blinking) {
      line(ctx, ex - e, ey + 1, ex, ey + 3, 2, lv_color_hex(0x2B1B10));
      line(ctx, ex, ey + 3, ex + e, ey + 1, 2, lv_color_hex(0x2B1B10));
      continue;
    }
    ellipse(ctx, ex, ey, e + 1, e + 2, lv_color_hex(0x2B1B10));  // Lidrand
    ellipse(ctx, ex, ey, e, e + 1, lv_color_white());
    ellipse(ctx, ex + look, ey + 1 + look_y, e * 6 / 10 + 1, e * 65 / 100 + 1, lv_color_hex(0x1A1A2E));
    ellipse(ctx, ex + look - e / 4, ey - e / 4 + look_y, e / 4 + 1, e / 4 + 1, lv_color_white());  // Lichtreflex
  }
}

static void draw_animal(lv_draw_ctx_t *ctx, int cx, int cy, const real *g) {
  const float size = g[P::T_SIZE], limb = g[P::T_LIMBLENGTH], mob = g[P::T_MOBILITY];
  const float armor = g[P::T_ARMOR], insul = g[P::T_INSULATION], wing = g[P::T_WING];
  const float sense = g[P::T_SENSE], biolum = g[P::T_BIOLUM];
  const bool insect = limb > 0.66f && size < 0.35f;
  const int rw = breathe(lerp(18, 40, size));
  const int rh = rw * 82 / 100;
  const int ground = cy + 46;
  const int L = lerp(6, 28, limb);
  const int by = ground - L - rh + 4;
  lv_color_t body = body_color(lv_color_hex(insect ? 0x6D8B3A : 0xE58A4E), g[P::T_PIGMENT], g[P::T_CAMO]);
  const lv_color_t dark = lv_color_darken(body, 110);

  ground_shadow(ctx, cx - off_x / 2, ground + 1 - off_y / 3, rw * 9 / 10);
  glow(ctx, cx, by, rw, biolum);

  // Flügel hinter dem Körper: durchscheinend, mit Adern, schlagend
  if (wing > 0.5f) {
    int span = int(lerp(14, 40, (wing - 0.5f) / 0.5f) * flap);
    if (rw + span > 80) span = 80 - rw;
    const lv_color_t wc = lv_color_hex(0xD8ECFF);
    for (int s = -1; s <= 1; s += 2) {
      const int bx = cx + s * rw / 3, byy = by - rh / 3;
      const int tx = cx + s * (rw + span), ty = by - rh - span / 2;
      lv_point_t w[4] = {{lv_coord_t(bx), lv_coord_t(byy)}, {lv_coord_t(tx), lv_coord_t(ty)},
                         {lv_coord_t(cx + s * (rw + span * 8 / 10)), lv_coord_t(by - rh / 5)},
                         {lv_coord_t(cx + s * (rw * 8 / 10)), lv_coord_t(by + rh / 4)}};
      poly(ctx, w, 4, wc, 150);
      line(ctx, bx, byy, tx, ty, 1, lv_color_hex(0x9FB8D0), 200);
      line(ctx, bx, byy, cx + s * (rw + span * 8 / 10), by - rh / 5, 1, lv_color_hex(0x9FB8D0), 160);
    }
  }

  // Beine (Anzahl wie development.ts), mit Füßen
  int legs = int(clamp01(0.6f * mob + 0.4f * limb) * 8 + 0.5f) & ~1;
  if (legs == 0 && mob > 0.3f) legs = 2;
  if (insect && legs < 6) legs = 6;
  const int lw = insect ? 2 : lerp(4, 7, size);
  for (int i = 0; i < legs; i++) {
    const int x = cx + (legs > 1 ? (-rw * 6 / 10) + (rw * 12 / 10) * i / (legs - 1) : 0);
    const int s = x < cx ? -1 : x > cx ? 1 : 0;
    const int y = by + rh * 6 / 10;
    const int step = (i % 2 ? 1 : -1) * off_y;  // Trippeln im Takt des Wippens
    if (insect) {
      // geknickte, gespreizte Beine: Knie hoch und außen, Fuß noch weiter draußen
      const int sx = s ? s : 1;
      const int kx = x + sx * (L * 7 / 10 + 6), ky = y - L * 3 / 10 + step;
      line(ctx, x, y, kx, ky, lw, dark);
      line(ctx, kx, ky, kx + sx * (L * 4 / 10 + 3), ground, lw, dark);
    } else {
      line(ctx, x, y, x + s * 2, ground - 2 + step / 2, lw, dark);
      ellipse(ctx, x + s * 3, ground - 1 + step / 2, lw * 9 / 10 + 1, lw / 2 + 1, lv_color_darken(body, 140));
    }
  }

  // Fell: Ohren + Büschel am Rand
  if (insul > 0.6f) {
    const lv_color_t fur = lv_color_lighten(body, 35);
    for (int s = -1; s <= 1; s += 2) {
      tri(ctx, cx + s * rw * 35 / 100, by - rh * 75 / 100, cx + s * rw * 80 / 100, by - rh * 55 / 100, cx + s * rw * 75 / 100, by - rh - 9, body);
      tri(ctx, cx + s * rw * 48 / 100, by - rh * 70 / 100, cx + s * rw * 72 / 100, by - rh * 58 / 100, cx + s * rw * 70 / 100, by - rh - 4, lv_color_hex(0xF8BBD0));
    }
    for (int deg = 120; deg <= 420; deg += 22) {
      const int x1 = px(cx, rw - 1, deg), y1 = py(by, rh - 1, deg);
      tri(ctx, x1 - 3, y1, x1 + 3, y1, px(cx, rw + 5, deg), py(by, rh + 5, deg), fur);
    }
  }

  // Fühler bei Insekten, Leuchtköder bei Leuchttieren (wie beim Anglerfisch)
  if (insect)
    for (int s = -1; s <= 1; s += 2) {
      line(ctx, cx + s * 4, by - rh + 3, cx + s * 12 + off_x, by - rh - 14, 1, dark);
      ellipse(ctx, cx + s * 12 + off_x, by - rh - 14, 2, 2, dark);
    }
  if (biolum >= 0.5f) {
    const int lx = cx + rw / 3 + off_x, ly = by - rh - 16;
    line(ctx, cx, by - rh + 2, lx, ly, 2, dark);
    glow(ctx, lx, ly, 3, biolum, lv_color_hex(0xB6FF6A));
    ellipse(ctx, lx, ly, 4, 4, lv_color_hex(0xEAFFB0));
  }

  // Panzer: Rückenschild, das hinter dem Körper hervorschaut (Schildkröte/Gürteltier),
  // ab 0.7 mit Stacheln (development.ts: Verteidigungsstruktur)
  if (armor > 0.55f) {
    const lv_color_t plate = lv_color_hex(0x5C7A8A);
    const int sw = rw * (105 + int(armor * 15)) / 100, sh = rh * 92 / 100;
    const int sy = by - rh * 28 / 100;
    if (armor > 0.7f)
      for (int i = -2; i <= 2; i++) {
        const int deg = 270 + i * 28;
        const int x = px(cx, sw - 2, deg), y = py(sy, sh - 2, deg);
        tri(ctx, px(x, 5, deg - 90), py(y, 5, deg - 90), px(x, 5, deg + 90), py(y, 5, deg + 90), px(x, 10, deg), py(y, 10, deg), lv_color_darken(plate, 70));
      }
    shaded(ctx, cx, sy, sw, sh, plate);
    for (int deg = 200; deg <= 340; deg += 35)  // Schildnähte
      line(ctx, px(cx, sw * 55 / 100, deg), py(sy, sh * 55 / 100, deg), px(cx, sw - 1, deg), py(sy, sh - 1, deg), 1, lv_color_darken(plate, 90), 160);
  }

  // Körper mit hellem Bauch
  shaded(ctx, cx, by, rw, rh, body);
  ellipse(ctx, cx, by + rh * 35 / 100, rw * 55 / 100, rh * 45 / 100, lv_color_mix(lv_color_white(), body, 90), 200);

  // Gesicht: große Augen mit Reflex, Wangen, kleines Lächeln
  const int e = lerp(4, 8, sense) + rw / 14;
  const int ey = by - rh * 12 / 100;
  eyes(ctx, cx, ey, rw * 36 / 100, e, int(look_x) + off_x / 3, int(look_y));
  ellipse(ctx, cx - rw * 55 / 100, ey + e + 3, e * 7 / 10, e * 4 / 10, lv_color_hex(0xFF8A80), 110);
  ellipse(ctx, cx + rw * 55 / 100, ey + e + 3, e * 7 / 10, e * 4 / 10, lv_color_hex(0xFF8A80), 110);
  const int my = ey + e + 5;
  if (petting) {  // Genießen: offenes Lächeln
    ellipse(ctx, cx, my + 2, 5, 3, lv_color_hex(0x3E2723));
    ellipse(ctx, cx, my + 3, 3, 1, lv_color_hex(0xFF8A80));
  } else {
    line(ctx, cx - 4, my, cx, my + 2, 2, lv_color_hex(0x3E2723));
    line(ctx, cx, my + 2, cx + 4, my, 2, lv_color_hex(0x3E2723));
  }
}

// ---------------------------------------------------------------- Rahmen

static void draw_cb(lv_event_t *e) {
  if (!have_genome) return;
  lv_obj_t *obj = lv_event_get_target(e);
  lv_draw_ctx_t *ctx = lv_event_get_draw_ctx(e);
  lv_area_t a;
  lv_obj_get_coords(obj, &a);
  const Kingdom k = kingdomIdOf(genome);
  // Pflanzen und Pilze stehen am Boden (wiegen sich nur), alles andere wippt als Ganzes
  const bool rooted = k == K_PFLANZE || k == K_PILZ;
  const int cx = (a.x1 + a.x2) / 2 + (rooted ? 0 : off_x);
  const int cy = (a.y1 + a.y2) / 2 + (k == K_PFLANZE ? 0 : off_y);
  switch (k) {
    case K_PFLANZE: draw_plant(ctx, cx, cy, genome); break;
    case K_TIER: draw_animal(ctx, cx, cy, genome); break;
    case K_PILZ: draw_fungus(ctx, cx, cy, genome); break;
    case K_MIKROBE: draw_microbe(ctx, cx, cy, genome); break;
    default: draw_protist(ctx, cx, cy, genome); break;
  }
  // Herzen (Tiere) bzw. Funken steigen auf und verblassen
  const uint32_t now = lv_tick_get();
  for (const Spark &sp : sparks) {
    if (!sp.t0 || now - sp.t0 >= SPARK_MS) continue;
    const float p = float(now - sp.t0) / SPARK_MS;
    const int x = (a.x1 + a.x2) / 2 + sp.dx + int(4 * lv_trigo_sin(nd(int(p * 720))) / 32767);
    const int y = (a.y1 + a.y2) / 2 - 20 - int(p * 50);
    const lv_opa_t o = lv_opa_t(255 * (1 - p));
    if (k == K_TIER) {
      const lv_color_t h = lv_color_hex(0xFF5C8A);
      ellipse(ctx, x - 3, y, 3, 3, h, o);
      ellipse(ctx, x + 3, y, 3, 3, h, o);
      tri(ctx, x - 6, y + 1, x + 6, y + 1, x, y + 8, h, o);
    } else {
      const lv_color_t c = lv_color_hex(0xFFE082);
      ellipse(ctx, x, y, 5, 1, c, o);
      ellipse(ctx, x, y, 1, 5, c, o);
      ellipse(ctx, x, y, 2, 2, lv_color_white(), o);
    }
  }
}

lv_obj_t *creature_create(lv_obj_t *parent, lv_coord_t w, lv_coord_t h) {
  lv_obj_t *obj = lv_obj_create(parent);
  lv_obj_remove_style_all(obj);
  lv_obj_set_size(obj, w, h);
  lv_obj_clear_flag(obj, LV_OBJ_FLAG_CLICKABLE | LV_OBJ_FLAG_SCROLLABLE);
  lv_obj_add_event_cb(obj, draw_cb, LV_EVENT_DRAW_MAIN, nullptr);
  return obj;
}

void creature_set_genome(lv_obj_t *obj, const real *g) {
  memcpy(genome, g, sizeof genome);
  have_genome = true;
  lv_obj_invalidate(obj);
}

// sin in Grad, -1..1
static inline float sind(uint32_t deg) { return lv_trigo_sin(int16_t(deg % 360)) / 32767.0f; }

void creature_tick(lv_obj_t *obj, uint32_t t) {
  if (!have_genome) return;
  const float metab = genome[P::T_METABOLISM], mob = genome[P::T_MOBILITY];
  // Atmen: hoher Stoffwechsel atmet schneller (Periode 3,2 s .. 1,2 s)
  const uint32_t breathPeriod = 3200 - uint32_t(2000 * clamp01(metab));
  breath = 0.035f * sind(t * 360 / breathPeriod);
  // Wippen bzw. Wiegen: bewegliche Wesen zappeln mehr, Pflanzen wiegen sich langsam im Wind
  const Kingdom k = kingdomIdOf(genome);
  if (k == K_PFLANZE || k == K_PILZ) {
    off_x = int(3 * sind(t * 360 / 2600));
    off_y = 0;
  } else {
    off_x = int(2.5f * mob * sind(t * 360 / 1700));
    off_y = int(2.0f * mob * sind(t * 360 / 600));
  }
  // Hüpfen (Antippen, Formwechsel)
  if (hop_len && t - hop_start < hop_len) {
    const uint32_t one = hop_len / hop_count;
    const uint32_t p = (t - hop_start) % one;
    off_y -= int(hop_height * sind(p * 180 / one));
  } else {
    hop_len = 0;
  }
  // Streicheln: zum Finger neigen und schnurren; danach langsam zurück
  if (!petting) {
    look_x *= 0.7f;
    look_y *= 0.7f;
    lean_x *= 0.75f;
  }
  off_x += int(lean_x) + (petting ? int(1.5f * sind(t * 360 / 90)) : 0);
  flap = 0.75f + 0.25f * sind(t * 360 / 220);  // ~4,5 Flügelschläge je Sekunde
  glow_k = 0.7f + 0.3f * sind(t * 360 / 1400);
  jiggle = sind(t * 360 / 450);
  // Blinzeln: alle 3–5 s für 140 ms
  static uint32_t next_blink = 0;
  if (t >= next_blink) {
    blinking = true;
    if (t >= next_blink + 140) {
      blinking = false;
      next_blink = t + 3000 + uint32_t(rand() % 2000);
    }
  }
  // Nur neu zeichnen, wenn sich sichtbar etwas bewegt hat: ein Bild kostet ~20 ms,
  // ein langsam wiegender Baum ändert sich aber nur alle paar Ticks um ein Pixel.
  const bool winged = genome[P::T_WING] > real(0.5), glowing = genome[P::T_BIOLUM] >= real(0.5);
  const Kingdom kd = kingdomIdOf(genome);
  const bool cells = kd == K_MIKROBE || kd == K_PROTIST;
  const int parts[] = {int(breath * 120), off_x, off_y, winged ? int(flap * 12) : 0, glowing ? int(glow_k * 5) : 0,
                       blinking, cells ? int((jiggle + 1) * 3) : 0, int(look_x), int(look_y), petting};
  bool sparkling = false;
  for (const Spark &sp : sparks) sparkling |= sp.t0 && t - sp.t0 < SPARK_MS;
  uint32_t state = 17;
  for (int v : parts) state = state * 131 + uint32_t(v + 64);
  static uint32_t last_state = 0;
  if (state == last_state && !sparkling) return;
  last_state = state;
  lv_obj_invalidate(obj);
}

void creature_hop(int strength) {
  hop_start = lv_tick_get();
  hop_count = strength >= 2 ? 3 : 1;
  hop_len = strength >= 2 ? 1200 : 380;
  hop_height = strength >= 2 ? 16 : 10;
}

void creature_pet(lv_obj_t *obj, int x, int y) {
  lv_area_t a;
  lv_obj_get_coords(obj, &a);
  const int cx = (a.x1 + a.x2) / 2, cy = (a.y1 + a.y2) / 2;
  auto clampf = [](float v, float lo, float hi) { return v < lo ? lo : v > hi ? hi : v; };
  look_x = clampf((x - cx) / 12.0f, -3, 3);
  look_y = clampf((y - cy) / 16.0f, -2, 2);
  lean_x = clampf((x - cx) / 8.0f, -5, 5);
  if (pet_last_x >= 0) pet_dist += abs(x - pet_last_x) + abs(y - pet_last_y);
  pet_last_x = x;
  pet_last_y = y;
  petting = true;
  if (pet_dist >= 140) {  // genug gestreichelt -> ein Herz
    pet_dist = 0;
    sparks[spark_next] = {lv_tick_get() | 1, int16_t(rand() % 50 - 25)};
    spark_next = (spark_next + 1) % 6;
  }
}

void creature_pet_end() {
  petting = false;
  pet_last_x = pet_last_y = -1;
}
