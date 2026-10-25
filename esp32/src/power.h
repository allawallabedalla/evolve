// Akku-Lader IP5306 – nur die I2C-Variante (IP5306-I2C, LCSC C488349) lässt sich
// einstellen. Ab Werk sitzt auf dem ESP32-2424S012C die Standard-Variante: dann
// meldet power_init() „nicht gefunden“ und es passiert nichts.
//
// Mit I2C-Chip (Umbau, s. docs/akku.md):
//   - Ladestrom begrenzt (kleiner runder Akku, max. 1C)
//   - keine Abschaltung bei wenig Last (sonst geht das Board im Bildschirm-Schlaf aus)
//   - 5-V-Ausgang dauerhaft an
// Der IP5306 hat keinen Speicher – die Einstellungen werden bei jedem Start neu gesetzt.
#pragma once

// Vor lcd.init() aufrufen: nutzt kurz den I2C-Bus des Touch-Controllers (SDA 4, SCL 5)
void power_init();

// true, wenn der I2C-Chip gefunden und eingestellt wurde
bool power_managed();
