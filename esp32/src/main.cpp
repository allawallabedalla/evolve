// Phase 3 – Simulation auf dem Board: Testbild + Touch über Serial, darunter
// Generation und Kurzbeschreibung aus dem Sim-Task.
#include <Arduino.h>
#include <Wire.h>
#define LGFX_USE_V1
#include <LovyanGFX.hpp>
#include <lvgl.h>

#include "board.h"
#include "sim.h"

class LGFX : public lgfx::LGFX_Device {
  lgfx::Panel_GC9A01 panel;
  lgfx::Bus_SPI bus;
  lgfx::Light_PWM light;
  lgfx::Touch_CST816S tp;

 public:
  LGFX() {
    {
      auto cfg = bus.config();
      cfg.spi_host = SPI2_HOST;
      cfg.spi_mode = 0;
      cfg.freq_write = 80000000;
      cfg.freq_read = 20000000;
      cfg.spi_3wire = true;
      cfg.use_lock = true;
      cfg.dma_channel = SPI_DMA_CH_AUTO;
      cfg.pin_sclk = PIN_LCD_SCLK;
      cfg.pin_mosi = PIN_LCD_MOSI;
      cfg.pin_miso = -1;
      cfg.pin_dc = PIN_LCD_DC;
      bus.config(cfg);
      panel.setBus(&bus);
    }
    {
      auto cfg = panel.config();
      cfg.pin_cs = PIN_LCD_CS;
      cfg.pin_rst = PIN_LCD_RST;
      cfg.pin_busy = -1;
      cfg.panel_width = LCD_W;
      cfg.panel_height = LCD_H;
      cfg.invert = true;  // IPS
      cfg.rgb_order = false;
      cfg.readable = false;
      cfg.bus_shared = false;
      panel.config(cfg);
    }
    {
      auto cfg = light.config();
      cfg.pin_bl = PIN_LCD_BL;
      cfg.freq = 44100;
      cfg.pwm_channel = 0;
      light.config(cfg);
      panel.setLight(&light);
    }
    {
      auto cfg = tp.config();
      cfg.i2c_port = 0;
      cfg.i2c_addr = TP_I2C_ADDR;
      cfg.pin_sda = PIN_TP_SDA;
      cfg.pin_scl = PIN_TP_SCL;
      cfg.pin_int = PIN_TP_INT;
      cfg.pin_rst = PIN_TP_RST;
      cfg.freq = 400000;
      cfg.x_min = 0;
      cfg.x_max = LCD_W - 1;
      cfg.y_min = 0;
      cfg.y_max = LCD_H - 1;
      tp.config(cfg);
      panel.setTouch(&tp);
    }
    setPanel(&panel);
  }
};

static LGFX lcd;

// 240 × 24 Zeilen, einfach gepuffert (kein PSRAM)
static constexpr int BUF_LINES = 24;
static lv_color_t buf[LCD_W * BUF_LINES];
static lv_disp_draw_buf_t draw_buf;
static lv_disp_drv_t disp_drv;
static lv_indev_drv_t indev_drv;
static lv_obj_t *touch_dot;
static lv_obj_t *coord_label;
static lv_obj_t *gen_label;
static lv_obj_t *desc_label;

static void flush_cb(lv_disp_drv_t *drv, const lv_area_t *a, lv_color_t *px) {
  uint32_t w = a->x2 - a->x1 + 1;
  uint32_t h = a->y2 - a->y1 + 1;
  lcd.startWrite();
  lcd.setAddrWindow(a->x1, a->y1, w, h);
  lcd.writePixels((lgfx::rgb565_t *)&px->full, w * h);
  lcd.endWrite();
  lv_disp_flush_ready(drv);
}

static void touch_cb(lv_indev_drv_t *, lv_indev_data_t *data) {
  static uint32_t last_log = 0;
  uint16_t x, y;
  if (lcd.getTouch(&x, &y)) {
    data->state = LV_INDEV_STATE_PR;
    data->point.x = x;
    data->point.y = y;
    if (millis() - last_log > 100) {
      last_log = millis();
      const char *q = (y < LCD_H / 2) ? (x < LCD_W / 2 ? "oben-links" : "oben-rechts")
                                      : (x < LCD_W / 2 ? "unten-links" : "unten-rechts");
      Serial.printf("touch x=%3u y=%3u  %s\n", x, y, q);
      lv_obj_set_pos(touch_dot, x - 6, y - 6);
      lv_label_set_text_fmt(coord_label, "%u, %u", x, y);
    }
  } else {
    data->state = LV_INDEV_STATE_REL;
  }
}

// Touch-Controller zurücksetzen und I2C-Bus scannen, bevor LovyanGFX ihn übernimmt.
// Der CST816 schläft ohne Berührung – nach dem Reset antwortet er kurz.
static void i2c_scan() {
  pinMode(PIN_TP_RST, OUTPUT);
  digitalWrite(PIN_TP_RST, LOW);
  delay(10);
  digitalWrite(PIN_TP_RST, HIGH);
  delay(50);
  Wire.begin(PIN_TP_SDA, PIN_TP_SCL, 400000);
  Serial.print("I2C-Scan:");
  int found = 0;
  for (uint8_t addr = 1; addr < 127; addr++) {
    Wire.beginTransmission(addr);
    if (Wire.endTransmission() == 0) {
      Serial.printf(" 0x%02X", addr);
      found++;
    }
  }
  Serial.println(found ? "" : " nichts gefunden (Touch berühren und neu starten)");
  Wire.end();
}

static lv_obj_t *corner_label(const char *txt, lv_align_t align, int dx, int dy) {
  lv_obj_t *l = lv_label_create(lv_scr_act());
  lv_label_set_text(l, txt);
  lv_obj_set_style_text_color(l, lv_color_hex(0x8899AA), 0);
  lv_obj_align(l, align, dx, dy);
  return l;
}

static void build_test_screen() {
  lv_obj_t *scr = lv_scr_act();
  lv_obj_set_style_bg_color(scr, lv_color_hex(0x0B1A12), 0);
  lv_obj_clear_flag(scr, LV_OBJ_FLAG_SCROLLABLE);

  // Kreis am Rand: zeigt, ob das runde Panel voll ausgeleuchtet und zentriert ist
  lv_obj_t *ring = lv_obj_create(scr);
  lv_obj_set_size(ring, 232, 232);
  lv_obj_center(ring);
  lv_obj_set_style_radius(ring, LV_RADIUS_CIRCLE, 0);
  lv_obj_set_style_bg_opa(ring, LV_OPA_TRANSP, 0);
  lv_obj_set_style_border_color(ring, lv_color_hex(0x3DDC84), 0);
  lv_obj_set_style_border_width(ring, 3, 0);
  lv_obj_clear_flag(ring, LV_OBJ_FLAG_CLICKABLE | LV_OBJ_FLAG_SCROLLABLE);

  lv_obj_t *title = lv_label_create(scr);
  lv_label_set_text(title, "Evolve");
  lv_obj_set_style_text_font(title, &lv_font_montserrat_28, 0);
  lv_obj_set_style_text_color(title, lv_color_hex(0xFFFFFF), 0);
  lv_obj_align(title, LV_ALIGN_CENTER, 0, -14);

  coord_label = lv_label_create(scr);
  lv_label_set_text(coord_label, "beruehren");
  lv_obj_set_style_text_color(coord_label, lv_color_hex(0x3DDC84), 0);
  lv_obj_align(coord_label, LV_ALIGN_CENTER, 0, 20);

  // Quadranten-Marken (rund: nicht in die Ecken, sondern auf die Diagonalen nach innen)
  corner_label("OL", LV_ALIGN_TOP_LEFT, 52, 52);
  corner_label("OR", LV_ALIGN_TOP_RIGHT, -52, 52);
  corner_label("UL", LV_ALIGN_BOTTOM_LEFT, 52, -52);
  corner_label("UR", LV_ALIGN_BOTTOM_RIGHT, -52, -52);

  gen_label = lv_label_create(scr);
  lv_label_set_text(gen_label, "Gen 0");
  lv_obj_set_style_text_color(gen_label, lv_color_hex(0xFFFFFF), 0);
  lv_obj_align(gen_label, LV_ALIGN_CENTER, 0, 44);

  desc_label = lv_label_create(scr);
  lv_label_set_text(desc_label, "");
  lv_obj_set_width(desc_label, 170);
  lv_label_set_long_mode(desc_label, LV_LABEL_LONG_WRAP);
  lv_obj_set_style_text_align(desc_label, LV_TEXT_ALIGN_CENTER, 0);
  lv_obj_set_style_text_color(desc_label, lv_color_hex(0x8899AA), 0);
  lv_obj_align(desc_label, LV_ALIGN_CENTER, 0, 74);

  touch_dot = lv_obj_create(scr);
  lv_obj_set_size(touch_dot, 12, 12);
  lv_obj_set_style_radius(touch_dot, LV_RADIUS_CIRCLE, 0);
  lv_obj_set_style_bg_color(touch_dot, lv_color_hex(0xFF5050), 0);
  lv_obj_set_style_border_width(touch_dot, 0, 0);
  lv_obj_clear_flag(touch_dot, LV_OBJ_FLAG_CLICKABLE);
  lv_obj_set_pos(touch_dot, -20, -20);
}

void setup() {
  Serial.begin(115200);
  delay(1500);  // USB-CDC Zeit zum Verbinden geben
  Serial.println("\nEvolve ESP32 – Phase 1");

  i2c_scan();

  lcd.init();
  lcd.setBrightness(200);
  lcd.fillScreen(TFT_BLACK);
  Serial.printf("Touch-Treiber: %s\n", lcd.touch() ? "aktiv" : "FEHLT");

  lv_init();
  lv_disp_draw_buf_init(&draw_buf, buf, nullptr, LCD_W * BUF_LINES);
  lv_disp_drv_init(&disp_drv);
  disp_drv.hor_res = LCD_W;
  disp_drv.ver_res = LCD_H;
  disp_drv.flush_cb = flush_cb;
  disp_drv.draw_buf = &draw_buf;
  lv_disp_drv_register(&disp_drv);

  lv_indev_drv_init(&indev_drv);
  indev_drv.type = LV_INDEV_TYPE_POINTER;
  indev_drv.read_cb = touch_cb;
  lv_indev_drv_register(&indev_drv);

  build_test_screen();
  Serial.printf("Freier Heap: %u Byte\n", ESP.getFreeHeap());
  sim_start(esp_random());
}

// Die eingebauten Montserrat-Schriften haben nur ASCII – Umlaute bis Phase 4 umschreiben
static void ascii_fold(const char *in, char *out, size_t len) {
  static const struct { const char *from, *to; } MAP[] = {
      {"ß", "ss"}, {"ä", "ae"}, {"ö", "oe"}, {"ü", "ue"}, {"·", "-"}};
  size_t o = 0;
  while (*in && o + 3 < len) {
    bool hit = false;
    for (const auto &m : MAP) {
      size_t n = strlen(m.from);
      if (!strncmp(in, m.from, n)) {
        for (const char *t = m.to; *t && o + 1 < len; t++) out[o++] = *t;
        in += n;
        hit = true;
        break;
      }
    }
    if (!hit) out[o++] = *in++;
  }
  out[o] = 0;
}

static void update_sim_labels() {
  static uint32_t shown = 0;
  SimSnapshot s;
  if (!sim_snapshot(s) || s.generation == shown) return;
  shown = s.generation;
  // lv_snprintf kann kein %f
  const int f = int(s.meanFitness * 100 + 0.5f);
  lv_label_set_text_fmt(gen_label, "Gen %u  -  Fitness 0.%02d", s.generation, f > 99 ? 99 : f);
  char d[sizeof s.desc];
  ascii_fold(s.desc, d, sizeof d);
  lv_label_set_text(desc_label, d);
}

void loop() {
  update_sim_labels();
  lv_timer_handler();
  delay(5);
}
