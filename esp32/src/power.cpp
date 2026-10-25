#include "power.h"

#include <Arduino.h>
#include <Wire.h>

#include "board.h"

// Register laut Injoinic „IP5306 I2C Register“ V1.21 (Bitbedeutung wie in der
// M5Stack-Bibliothek, die den Chip am ESP32 betreibt)
static constexpr uint8_t ADDR = 0x75;
static constexpr uint8_t SYS_CTL0 = 0x00;
static constexpr uint8_t CHG_DIG_CTL0 = 0x24;  // Ladestrom (am Eingang gemessen)
static constexpr uint8_t READ0 = 0x70;         // Bit 3: lädt
static constexpr uint8_t READ1 = 0x71;         // Bit 3: voll

static constexpr uint8_t CTL0_LIGHT_LOAD_OFF = 0x20;  // Bit 5: 1 = bei wenig Last abschalten
static constexpr uint8_t CTL0_BOOST_KEEP_ON = 0x02;   // Bit 1: 5-V-Ausgang dauerhaft an

// Ladestrom: I = 0,05 + b0·0,1 + b1·0,2 + b2·0,4 + b3·0,8 + b4·1,6 A, gemessen am
// USB-Eingang (Board-Verbrauch inklusive). 0b00101 = 0,55 A am Eingang ergibt im Akku
// rund 0,5 A – unter 1C für den runden 1160-mAh-Akku (docs/akku.md).
static constexpr uint8_t CHARGE_CURRENT_BITS = 0b00101;

static bool managed = false;

static int read_reg(uint8_t reg) {
  Wire.beginTransmission(ADDR);
  Wire.write(reg);
  if (Wire.endTransmission(false) != 0) return -1;
  if (Wire.requestFrom(ADDR, uint8_t(1)) != 1) return -1;
  return Wire.read();
}

static bool write_reg(uint8_t reg, uint8_t v) {
  Wire.beginTransmission(ADDR);
  Wire.write(reg);
  Wire.write(v);
  return Wire.endTransmission() == 0;
}

void power_init() {
  Wire.begin(PIN_TP_SDA, PIN_TP_SCL, 100000);  // der Chip empfiehlt 100 kHz
  const int ctl0 = read_reg(SYS_CTL0);
  if (ctl0 < 0) {
    Serial.println("Akku-Lader: IP5306-I2C nicht gefunden (Standard-Chip, keine Einstellung)");
    Wire.end();
    return;
  }
  // Nur die eigenen Bits ändern – reservierte Bits müssen laut Hersteller bleiben
  const uint8_t new0 = (uint8_t(ctl0) & ~CTL0_LIGHT_LOAD_OFF) | CTL0_BOOST_KEEP_ON;
  const int dig = read_reg(CHG_DIG_CTL0);
  const bool ok = write_reg(SYS_CTL0, new0) && dig >= 0 &&
                  write_reg(CHG_DIG_CTL0, (uint8_t(dig) & ~0x1F) | CHARGE_CURRENT_BITS);
  const int check0 = read_reg(SYS_CTL0), check24 = read_reg(CHG_DIG_CTL0);
  managed = ok && check0 == new0 && (check24 & 0x1F) == CHARGE_CURRENT_BITS;
  const int r0 = read_reg(READ0), r1 = read_reg(READ1);
  Serial.printf("Akku-Lader: IP5306-I2C %s (CTL0 0x%02X->0x%02X, Ladestrom-Bits 0x%02X), %s\n",
                managed ? "eingestellt" : "FEHLER beim Einstellen", ctl0, check0, check24 & 0x1F,
                r1 >= 0 && (r1 & 0x08) ? "Akku voll" : r0 >= 0 && (r0 & 0x08) ? "lädt" : "entlädt");
  Wire.end();
}

bool power_managed() { return managed; }
