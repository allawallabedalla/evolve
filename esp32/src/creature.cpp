#include "creature.h"

#include <string.h>

#include "describe.h"
#include "physics.h"

namespace P = phys;

static real genome[P::NUM_GENES];
static bool have_genome = false;

static inline float clamp01(float x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
static inline lv_coord_t lerp(float a, float b, float t) { return lv_coord_t(a + (b - a) * t); }

// lv_trigo_sin: Grad -> ±32767
static inline lv_coord_t px(lv_coord_t cx, int r, int deg) { return cx + (r * lv_trigo_sin(deg + 90)) / 32767; }
static inline lv_coord_t py(lv_coord_t cy, int r, int deg) { return cy + (r * lv_trigo_sin(deg)) / 32767; }

static void ellipse(lv_draw_ctx_t *ctx, int cx, int cy, int rw, int rh, lv_color_t c, lv_opa_t opa = LV_OPA_COVER,
                    int border = 0, lv_color_t bc = lv_color_black()) {
  lv_draw_rect_dsc_t d;
  lv_draw_rect_dsc_init(&d);
  d.radius = LV_RADIUS_CIRCLE;
  d.bg_color = c;
  d.bg_opa = opa;
  d.border_width = border;
  d.border_color = bc;
  d.border_opa = LV_OPA_COVER;
  lv_area_t a = {lv_coord_t(cx - rw), lv_coord_t(cy - rh), lv_coord_t(cx + rw), lv_coord_t(cy + rh)};
  lv_draw_rect(ctx, &d, &a);
}

static void rect(lv_draw_ctx_t *ctx, int x1, int y1, int x2, int y2, lv_color_t c, int radius = 2) {
  lv_draw_rect_dsc_t d;
  lv_draw_rect_dsc_init(&d);
  d.radius = radius;
  d.bg_color = c;
  lv_area_t a = {lv_coord_t(x1), lv_coord_t(y1), lv_coord_t(x2), lv_coord_t(y2)};
  lv_draw_rect(ctx, &d, &a);
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

static void tri(lv_draw_ctx_t *ctx, int x1, int y1, int x2, int y2, int x3, int y3, lv_color_t c,
                lv_opa_t opa = LV_OPA_COVER) {
  lv_draw_rect_dsc_t d;
  lv_draw_rect_dsc_init(&d);
  d.bg_color = c;
  d.bg_opa = opa;
  lv_point_t p[3] = {{lv_coord_t(x1), lv_coord_t(y1)}, {lv_coord_t(x2), lv_coord_t(y2)}, {lv_coord_t(x3), lv_coord_t(y3)}};
  lv_draw_polygon(ctx, &d, p, 3);
}

// Leuchten (Biolumineszenz) als Hof hinter dem Körper
static void glow(lv_draw_ctx_t *ctx, int cx, int cy, int r, float biolum) {
  if (biolum < 0.3f) return;
  const lv_opa_t opa = lv_opa_t(clamp01((biolum - 0.3f) / 0.7f) * 140 + 30);
  ellipse(ctx, cx, cy, r + 10, r + 10, lv_color_hex(0x40FFE0), opa / 2);
  ellipse(ctx, cx, cy, r + 5, r + 5, lv_color_hex(0x40FFE0), opa);
}

// Grundfarbe je Reich, Pigment dunkelt, Tarnung zieht Richtung Oliv
static lv_color_t body_color(lv_color_t base, float pigment, float camo) {
  lv_color_t c = lv_color_darken(base, lv_opa_t(clamp01(pigment) * 110));
  return lv_color_mix(lv_color_hex(0x5B6B32), c, lv_opa_t(clamp01(camo) * 150));
}

static void draw_plant(lv_draw_ctx_t *ctx, int cx, int cy, const real *g) {
  const float size = g[P::T_SIZE], photo = g[P::T_PHOTOSYNTHESIS], structure = g[P::T_STRUCTURE];
  const float armor = g[P::T_ARMOR], insul = g[P::T_INSULATION];
  const int base = cy + 46;
  const int stemLen = structure > 0.25f ? lerp(10, 44, structure) : 6;
  const int stemW = lerp(2, 7, structure) + lerp(0, 3, size);
  const int r = lerp(12, 30, size);
  const int crownY = base - stemLen - r;
  const lv_color_t wood = lv_color_hex(0x7A5230);
  const lv_color_t green = body_color(lv_color_hex(0x4CAF50), g[P::T_PIGMENT], g[P::T_CAMO]);

  glow(ctx, cx, crownY, r, g[P::T_BIOLUM]);
  // Wurzeln ab merklichem Stützgewebe (development.ts: structure > 0.4)
  if (structure > 0.4f) {
    const int n = 2 + int(structure * 3 + 0.5f);
    for (int i = 0; i < n; i++) {
      const int dx = (i - (n - 1) / 2.0f) * 6;
      line(ctx, cx, base, cx + dx, base + 9, 2, wood);
    }
  }
  rect(ctx, cx - stemW / 2, base - stemLen - 2, cx + stemW / 2, base, wood, stemW / 2);
  // Dornen am Stamm
  if (armor > 0.6f)
    for (int i = 1; i <= 3; i++) {
      const int y = base - stemLen * i / 4;
      const int s = i % 2 ? 1 : -1;
      tri(ctx, cx + s * stemW / 2, y - 3, cx + s * stemW / 2, y + 3, cx + s * (stemW / 2 + 6), y, wood);
    }
  // Blätter rund um die Krone, Anzahl wie development.ts (photo * 8)
  const int leaves = int(photo * 8 + 0.5f);
  const lv_color_t leaf = lv_color_lighten(green, 60);
  for (int i = 0; i < leaves; i++) {
    const int deg = 270 + (i - (leaves - 1) / 2.0f) * (300 / (leaves > 1 ? leaves - 1 : 1)) * 0.9f;
    const int lr = lerp(4, 9, photo);
    ellipse(ctx, px(cx, r, deg), py(crownY, r, deg), lr, lr, leaf);
  }
  ellipse(ctx, cx, crownY, r, r, green);
  if (insul > 0.5f)
    for (int deg = 0; deg < 360; deg += 24)
      line(ctx, px(cx, r, deg), py(crownY, r, deg), px(cx, r + 4, deg), py(crownY, r + 4, deg), 1,
           lv_color_hex(0xDDEEDD));
}

static void draw_fungus(lv_draw_ctx_t *ctx, int cx, int cy, const real *g) {
  const float size = g[P::T_SIZE];
  const int capR = lerp(14, 36, size);
  const int stalkH = lerp(14, 34, size);
  const int stalkW = lerp(5, 12, size);
  const int base = cy + 44;
  const int capY = base - stalkH;
  const lv_color_t cap = body_color(lv_color_hex(0xB0805A), g[P::T_PIGMENT], g[P::T_CAMO]);
  glow(ctx, cx, capY, capR, g[P::T_BIOLUM]);
  rect(ctx, cx - stalkW, capY, cx + stalkW, base, lv_color_hex(0xE8DCC8), stalkW / 2);
  ellipse(ctx, cx, capY, capR, capR * 6 / 10, cap, LV_OPA_COVER, int(g[P::T_ARMOR] * 4),
          lv_color_darken(cap, 80));
  const lv_color_t spot = lv_color_lighten(cap, 120);
  ellipse(ctx, cx - capR / 2, capY - capR / 5, 3, 3, spot);
  ellipse(ctx, cx + capR / 3, capY - capR / 3, 4, 4, spot);
  ellipse(ctx, cx + capR / 8, capY + capR / 8, 2, 2, spot);
}

static void cell(lv_draw_ctx_t *ctx, int cx, int cy, int r, lv_color_t c, bool cilia) {
  if (cilia)
    for (int deg = 0; deg < 360; deg += 30)
      line(ctx, px(cx, r, deg), py(cy, r, deg), px(cx, r + 4, deg + 10), py(cy, r + 4, deg + 10), 1, c);
  ellipse(ctx, cx, cy, r, r, c, LV_OPA_80, 1, lv_color_lighten(c, 90));
  ellipse(ctx, cx + r / 4, cy - r / 4, r / 3 + 1, r / 3 + 1, lv_color_darken(c, 90));
}

static void draw_microbe(lv_draw_ctx_t *ctx, int cx, int cy, const real *g) {
  const lv_color_t c = body_color(lv_color_hex(0x9C7BD0), g[P::T_PIGMENT], g[P::T_CAMO]);
  const int r = lerp(7, 12, g[P::T_SIZE] / 0.18f);
  glow(ctx, cx, cy, r * 2, g[P::T_BIOLUM]);
  cell(ctx, cx - r - 4, cy + 4, r, c, true);
  cell(ctx, cx + r + 2, cy + 8, r - 2, c, true);
  cell(ctx, cx, cy - r - 2, r + 1, c, true);
}

static void draw_protist(lv_draw_ctx_t *ctx, int cx, int cy, const real *g) {
  const float size = g[P::T_SIZE];
  const int r = lerp(12, 30, size);
  const lv_color_t c = body_color(lv_color_hex(0x3FB8A8), g[P::T_PIGMENT], g[P::T_CAMO]);
  glow(ctx, cx, cy, r, g[P::T_BIOLUM]);
  // Geißel als Wellenlinie, Länge mit Mobilität
  const int len = lerp(10, 40, g[P::T_MOBILITY]);
  int x0 = cx + r - 2, y0 = cy;
  for (int i = 1; i <= 8; i++) {
    const int x1 = cx + r - 2 + len * i / 8;
    const int y1 = cy + (lv_trigo_sin(i * 70) * 5) / 32767;
    line(ctx, x0, y0, x1, y1, 2, c);
    x0 = x1;
    y0 = y1;
  }
  ellipse(ctx, cx, cy, r, r * 8 / 10, c, LV_OPA_90, int(g[P::T_ARMOR] * 4), lv_color_darken(c, 100));
  // Chloroplasten, wenn halb Pflanze
  const int chl = int(g[P::T_PHOTOSYNTHESIS] * 5 + 0.5f);
  for (int i = 0; i < chl; i++)
    ellipse(ctx, px(cx, r / 2, i * 72 + 20), py(cy, r / 2, i * 72 + 20), 3, 2, lv_color_hex(0x2E7D32));
  ellipse(ctx, cx - r / 4, cy, r / 4 + 1, r / 4 + 1, lv_color_darken(c, 120));
}

static void draw_animal(lv_draw_ctx_t *ctx, int cx, int cy, const real *g) {
  const float size = g[P::T_SIZE], limb = g[P::T_LIMBLENGTH], mob = g[P::T_MOBILITY];
  const float armor = g[P::T_ARMOR], insul = g[P::T_INSULATION], wing = g[P::T_WING];
  const float sense = g[P::T_SENSE];
  const int rw = lerp(14, 34, size);
  const int rh = rw * 3 / 4;
  const int by = cy - 10;
  const lv_color_t body = body_color(lv_color_hex(0xE0874A), g[P::T_PIGMENT], g[P::T_CAMO]);
  const lv_color_t dark = lv_color_darken(body, 110);

  glow(ctx, cx, by, rw, g[P::T_BIOLUM]);

  // Flügel hinter dem Körper
  if (wing > 0.3f) {
    int span = lerp(8, 36, (wing - 0.3f) / 0.7f);
    if (rw + span > 60) span = 60 - rw;
    const lv_color_t wc = lv_color_hex(0xDDE8F0);
    for (int s = -1; s <= 1; s += 2)
      tri(ctx, cx + s * rw / 2, by - rh / 2, cx + s * (rw + span), by - rh - span / 3, cx + s * (rw + span * 2 / 3),
          by + rh / 4, wc, LV_OPA_70);
  }

  // Beine: Anzahl wie development.ts, gerade, Länge aus limb
  int legs = int(clamp01(0.6f * mob + 0.4f * limb) * 8 + 0.5f);
  legs &= ~1;
  if (legs == 0 && mob > 0.3f) legs = 2;
  const int L = lerp(6, 30, limb);
  for (int i = 0; i < legs; i++) {
    const int x = cx + (legs > 1 ? (-rw * 7 / 10) + (rw * 14 / 10) * i / (legs - 1) : 0);
    const int s = x < cx ? -1 : 1;
    const int y = by + rh * 6 / 10;
    const int kx = x + s * L * 3 / 10, ky = y + L / 2;
    line(ctx, x, y, kx, ky, 3, dark);
    line(ctx, kx, ky, kx - s * L / 6, y + L, 3, dark);
  }

  // Fell als kurze Strahlen
  if (insul > 0.45f) {
    const int fl = lerp(2, 7, (insul - 0.45f) / 0.55f);
    const lv_color_t fur = lv_color_lighten(body, 70);
    for (int deg = 0; deg < 360; deg += 15) {
      const int x1 = cx + (rw * lv_trigo_sin(deg + 90)) / 32767, y1 = by + (rh * lv_trigo_sin(deg)) / 32767;
      const int x2 = cx + ((rw + fl) * lv_trigo_sin(deg + 90)) / 32767,
                y2 = by + ((rh + fl) * lv_trigo_sin(deg)) / 32767;
      line(ctx, x1, y1, x2, y2, 2, fur);
    }
  }

  // Stacheln ab armor > 0.6 (development.ts: Verteidigungsstruktur)
  const lv_color_t plate = lv_color_hex(0x455A64);
  if (armor > 0.6f) {
    const int n = 1 + int(armor * 3 + 0.5f);
    for (int i = 0; i < n; i++) {
      const int x = cx + (n > 1 ? (-rw / 2) + rw * i / (n - 1) : 0);
      tri(ctx, x - 4, by - rh + 3, x + 4, by - rh + 3, x, by - rh - 8, plate);
    }
  }

  // Körper, Panzer als Rand
  ellipse(ctx, cx, by, rw, rh, body, LV_OPA_COVER, int(armor * 6 + 0.5f), plate);

  // Augen, Größe aus Sinnen
  const int e = lerp(2, 6, sense);
  for (int s = -1; s <= 1; s += 2) {
    const int ex = cx + s * rw * 35 / 100, ey = by - rh / 4;
    ellipse(ctx, ex, ey, e + 2, e + 2, lv_color_white());
    ellipse(ctx, ex, ey + 1, e * 6 / 10 + 1, e * 6 / 10 + 1, lv_color_black());
  }
}

static void draw_cb(lv_event_t *e) {
  if (!have_genome) return;
  lv_obj_t *obj = lv_event_get_target(e);
  lv_draw_ctx_t *ctx = lv_event_get_draw_ctx(e);
  lv_area_t a;
  lv_obj_get_coords(obj, &a);
  const int cx = (a.x1 + a.x2) / 2, cy = (a.y1 + a.y2) / 2;
  const char *k = kingdomOf(genome);
  if (!strcmp(k, "Pflanze"))
    draw_plant(ctx, cx, cy, genome);
  else if (!strcmp(k, "Tier"))
    draw_animal(ctx, cx, cy, genome);
  else if (!strcmp(k, "Pilz"))
    draw_fungus(ctx, cx, cy, genome);
  else if (!strcmp(k, "Mikrobe"))
    draw_microbe(ctx, cx, cy, genome);
  else
    draw_protist(ctx, cx, cy, genome);
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
