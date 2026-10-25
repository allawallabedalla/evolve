// Evolve auf dem ESP32-2424S012C: Display/Touch-Treiber, LVGL, Sim-Task, Oberfläche.
#include <Arduino.h>
#define LGFX_USE_V1
#include <LovyanGFX.hpp>
#include <lvgl.h>

#include "board.h"
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

// 240 × 24 Zeilen, einfach gepuffert (kein PSRAM)
static constexpr int BUF_LINES = 24;
static lv_color_t buf[LCD_W * BUF_LINES];
static lv_disp_draw_buf_t draw_buf;
static lv_disp_drv_t disp_drv;
static lv_indev_drv_t indev_drv;

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

  sim_start(esp_random());
  ui_build();
  Serial.printf("Freier Heap: %u Byte\n", ESP.getFreeHeap());
}

void loop() {
  serial_commands();
  ui_tick();
  lv_timer_handler();
  delay(5);
}
