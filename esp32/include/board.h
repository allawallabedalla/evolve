// Pinbelegung ESP32-2424S012C.
// Quelle: rzeldent/platformio-espressif32-sunton, esp32-2424S012C.json
// Strapping-Pins GPIO 2/8/9 nicht anderweitig belegen (2 = Display-DC).
#pragma once

// Display GC9A01, SPI2
#define PIN_LCD_SCLK 6
#define PIN_LCD_MOSI 7
#define PIN_LCD_DC   2
#define PIN_LCD_CS   10
#define PIN_LCD_BL   3
#define PIN_LCD_RST  -1  // hängt an EN

// Touch CST816D, I2C0 @ 0x15
#define PIN_TP_SDA 4
#define PIN_TP_SCL 5
#define PIN_TP_INT 0
#define PIN_TP_RST 1
#define TP_I2C_ADDR 0x15

#define LCD_W 240
#define LCD_H 240
