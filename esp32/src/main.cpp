// Evolve auf dem ESP32-2424S012C: Display/Touch-Treiber, LVGL, Sim-Task, Oberfläche.
#include <Arduino.h>
#define LGFX_USE_V1
#include <LovyanGFX.hpp>
#include <lvgl.h>

#include "board.h"
#include "explain.h"
#include "sim.h"
#include "ui.h"

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

// Zwei Puffer à 240 × 40 Zeilen (2 × 19 KB, kein PSRAM nötig): während DMA den
// einen Streifen zum Display schiebt, zeichnet LVGL schon in den anderen.
static constexpr int BUF_LINES = 40;
static lv_color_t buf1[LCD_W * BUF_LINES];
static lv_color_t buf2[LCD_W * BUF_LINES];
static lv_disp_draw_buf_t draw_buf;
static lv_disp_drv_t disp_drv;
static lv_indev_drv_t indev_drv;

// Scroll-Messlauf (Serial "bench"): Erklärung 4 s lang automatisch scrollen und
// die Bildwiederholung protokollieren – Renderzeit je Bild und längste Lücke.
static struct {
  bool active;
  uint32_t start, last_scroll, last_frame;
  uint32_t frames, render_sum, render_max, gap_max;
  uint32_t flush_us, px;
  int dir;
  char mode;
} bench;

static void flush_cb(lv_disp_drv_t *drv, const lv_area_t *a, lv_color_t *px) {
  uint32_t w = a->x2 - a->x1 + 1;
  uint32_t h = a->y2 - a->y1 + 1;
  const uint32_t t0 = micros();
  // Bus bleibt dauerhaft offen; pushImageDMA wartet selbst, bis der vorige Streifen
  // draußen ist – danach ist dessen Puffer frei, LVGL darf sofort weiterzeichnen.
  // LV_COLOR_16_SWAP = 1 liefert die Bytes schon in Display-Reihenfolge (kein Umkopieren).
  if (lcd.getStartCount() == 0) lcd.startWrite();
  lcd.pushImageDMA(a->x1, a->y1, w, h, (lgfx::swap565_t *)&px->full);
  bench.flush_us += micros() - t0;
  lv_disp_flush_ready(drv);
}


static void monitor_cb(lv_disp_drv_t *, uint32_t time_ms, uint32_t px) {
  if (!bench.active) return;
  bench.px += px;
  const uint32_t now = millis();
  if (bench.frames) {
    const uint32_t gap = now - bench.last_frame;
    if (gap > bench.gap_max) bench.gap_max = gap;
  }
  bench.last_frame = now;
  bench.frames++;
  bench.render_sum += time_ms;
  if (time_ms > bench.render_max) bench.render_max = time_ms;
}

static void bench_tick() {
  if (!bench.active) return;
  const uint32_t now = millis();
  if (now - bench.last_scroll >= 16) {
    bench.last_scroll = now;
    if ((now - bench.start) % 2000 < 16) bench.dir = -bench.dir;  // alle 2 s Richtung wechseln
    if (bench.mode == 's')
      ui_info_scroll(4 * bench.dir);
    else
      ui_info_invalidate();
  }
  if (now - bench.start >= 4000) {
    bench.active = false;
    ui_info_text_visible(true);
    ui_info_close();
    const uint32_t f = bench.frames ? bench.frames : 1;
    Serial.printf("bench: %u Bilder, Render Ø %u ms / max %u ms, davon SPI Ø %u ms, Ø %u px/Bild, CPU %u MHz\n",
                  bench.frames, bench.render_sum / f, bench.render_max, bench.flush_us / 1000 / f, bench.px / f,
                  getCpuFrequencyMhz());
  }
}

static void touch_cb(lv_indev_drv_t *, lv_indev_data_t *data) {
  uint16_t x, y;
  if (lcd.getTouch(&x, &y)) {
    data->state = LV_INDEV_STATE_PR;
    data->point.x = x;
    data->point.y = y;
  } else {
    data->state = LV_INDEV_STATE_REL;
  }
}

// Serielle Befehle zum Testen ohne Finger:
//   env                  aktuelle Umwelt ausgeben
//   env <feld> <0..1>    Feld setzen, z. B. "env temperature 0.9"
//   forget               Speicherstand löschen, Neustart mit frischer Welt
//   info                 Erklärtext zum aktuellen Wesen (wie beim Antippen)
//   bench                Erklärung 4 s automatisch scrollen, Bildrate messen
static void serial_commands() {
  static char line[64];
  static size_t n = 0;
  while (Serial.available()) {
    const char c = Serial.read();
    if (c != '\n' && c != '\r') {
      if (n + 1 < sizeof line) line[n++] = c;
      continue;
    }
    line[n] = 0;
    n = 0;
    if (!strcmp(line, "forget")) sim_forget();
    // bench = scrollen, bench r = ohne Scrollen neu zeichnen, bench e = dasselbe ohne Text
    if (!strncmp(line, "bench", 5)) {
      bench = {};
      bench.dir = -1;
      bench.mode = line[5] == ' ' ? line[6] : 's';
      ui_info_text_visible(bench.mode != 'e');
      ui_info_open();
      bench.start = bench.last_scroll = millis();
      bench.active = true;
      continue;
    }
    if (!strcmp(line, "info")) {
      static char text[1024];
      SimSnapshot s;
      if (sim_snapshot(s)) {
        explain_creature(s, sim_get_env(), text, sizeof text);
        Serial.printf("--- %s ---\n%s\n---\n", s.desc, text);
      }
      continue;
    }
    if (strncmp(line, "env", 3)) continue;
    Environment e = sim_get_env();
    struct { const char *name; real *v; } F[] = {
        {"temperature", &e.temperature}, {"predation", &e.predation}, {"foodAbundance", &e.foodAbundance},
        {"foodHeight", &e.foodHeight},   {"light", &e.light},         {"water", &e.water}};
    char key[24];
    float val;
    if (sscanf(line + 3, "%23s %f", key, &val) == 2) {
      for (auto &f : F)
        if (!strcmp(key, f.name)) {
          *f.v = real(val < 0 ? 0 : val > 1 ? 1 : val);
          sim_set_env(e);
          ui_env_changed();
        }
    }
    Serial.print("env:");
    for (auto &f : F) Serial.printf(" %s=%.2f", f.name, double(*f.v));
    Serial.println();
  }
}

void setup() {
  Serial.begin(115200);
  delay(1500);  // USB-CDC Zeit zum Verbinden geben
  Serial.println("\nEvolve ESP32");

  lcd.init();
  lcd.setBrightness(200);
  lcd.fillScreen(TFT_BLACK);
  Serial.printf("Touch-Treiber: %s\n", lcd.touch() ? "aktiv" : "FEHLT");

  lv_init();
  lv_disp_draw_buf_init(&draw_buf, buf1, buf2, LCD_W * BUF_LINES);
  lv_disp_drv_init(&disp_drv);
  disp_drv.hor_res = LCD_W;
  disp_drv.ver_res = LCD_H;
  disp_drv.flush_cb = flush_cb;
  disp_drv.draw_buf = &draw_buf;
  disp_drv.monitor_cb = monitor_cb;
  lv_disp_drv_register(&disp_drv);

  lv_indev_drv_init(&indev_drv);
  indev_drv.type = LV_INDEV_TYPE_POINTER;
  indev_drv.read_cb = touch_cb;
  lv_indev_drv_register(&indev_drv);

  vTaskPrioritySet(nullptr, 2);  // Oberfläche vor Simulation (s. sim_start)
  sim_start(esp_random());
  ui_build();
  Serial.printf("Freier Heap: %u Byte\n", ESP.getFreeHeap());
}

void loop() {
  serial_commands();
  bench_tick();
  ui_tick();
  // So lange schlafen, wie LVGL nichts zu tun hat (höchstens 5 ms) – die Zeit
  // bekommt der Sim-Task, der unter loop() läuft.
  const uint32_t idle = lv_timer_handler();
  delay(idle > 5 ? 5 : idle ? idle : 1);
}
