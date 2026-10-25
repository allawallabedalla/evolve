# Akku für Evolve auf dem ESP32-2424S012C

Stand 2026-10-25. Gemessen ist noch nichts – Laufzeiten sind Schätzungen.

## Ausgangslage

Auf dem Board sitzt ein **IP5306** (Injoinic, ohne „I2C“ im Aufdruck), der den Akku
an der JST-Buchse „BAT+“ lädt und daraus 5 V macht. Zwei Eigenschaften passen nicht
zu einem kleinen Akku:

| Eigenschaft | Problem |
|---|---|
| Ladestrom fest bis **~2,1 A** (regelt nur bei Hitze oder schwachem Netzteil herunter) | Kleine LiPos vertragen meist nur **1C** (1000 mAh → 1 A) |
| Schaltet ab, wenn **< ~45–50 mA für 32 s** fließen | Im Bildschirm-Schlaf braucht das Board geschätzt nur ~25 mA → es ginge aus |

Beim Standard-IP5306 lässt sich beides weder per Software noch per Widerstand ändern.

## Entscheidung

1. **Akku:** runder LiPo **Topwell TWE0102** (Typ LP553535-580-1S2P) –
   Ø 35,5 × 11,8 mm, 1160 mAh, 3,7 V, zwei gestapelte Zellen.
   - passt komplett **unter** die runde Platine (Ø ≈ 38 mm) → rundes Gerät wie das Display
   - Laden max. 1C (≈ 1,16 A), Entladen max. 1C, ≥ 800 Zyklen
   - UN38.3, IEC 62133, CE (wichtig für Versand und Sicherheit)
   - nur direkt beim Hersteller, Muster ca. 14–15 Tage
2. **Lader:** den IP5306 gegen den baugleichen **IP5306-I2C** tauschen
   (LCSC C488349, eSOP-8, ab 5 Stück je 0,35 $, Stand 25.10.2026: 2475 auf Lager).
   Damit stellt die Firmware beim Start ein (`src/power.cpp`):
   - Ladestrom 0,55 A am USB-Eingang → rund 0,5 A in den Akku (≈ 0,43C, schonend)
   - **keine** Abschaltung bei wenig Last, 5 V dauerhaft an
   - Ohne Umbau erkennt sie den Standard-Chip und lässt alles, wie es ist.

### Warum nicht anders

- **Größere eckige Akkus** (2000 mAh, 1C = 2 A) würden den Ladestrom vertragen, passen aber
  nicht in ein rundes Gehäuse.
- **Runde Hochstromzelle Ø 44 × 6,5 mm, 1000 mAh** (VRP654442/LPR654442): Ladegrenze nirgends
  angegeben, ragt über die Platine hinaus, keine Zulassungen genannt.
- **Ohne Umbau, nur mit schwachem Netzteil laden** (≤ 1 A, z. B. PC-USB): der IP5306 passt den
  Ladestrom an die Quelle an, damit bliebe der Topwell-Akku im 1C-Rahmen. Funktioniert, hängt
  aber an Disziplin – ein starkes Netzteil, und der Akku wird überfordert. Und das Abschalten bei
  wenig Last bliebe. Als Übergang brauchbar, nicht als Dauerlösung.

## Laufzeit (Schätzung)

| Bildschirm | Verbrauch (geschätzt) | Laufzeit mit 1160 mAh |
|---|---|---|
| dauernd an | 55–70 mA | ~14 h |
| meist dunkel (30-s-Schlaf) | 25–35 mA | ~25 h |

Messen: USB-C-Messgerät zwischen Netzteil und Board, einmal mit hellem, einmal mit dunklem
Bildschirm (Serial `sleep`).

## Umbau IP5306 → IP5306-I2C

**Schwierigkeit:** mittel. eSOP-8 mit Massepad auf der Unterseite → Heißluft oder Vorheizplatte.

Pinbelegung (eSOP-8, Pin 1 an der Punktmarkierung, gegen den Uhrzeigersinn):

| Pin | Standard-IP5306 | IP5306-I2C |
|---|---|---|
| 1 | VIN | VIN |
| 2 | LED1 / L1 | **SCL** |
| 3 | LED2 / L2 | **SDA** |
| 4 | LED3 / L3 | IRQ (hoch = aktiv, unbenutzt) |
| 5 | KEY | KEY |
| 6 | BAT | BAT |
| 7 | SW | SW |
| 8 | VOUT | VOUT |
| Pad | GND | GND |

Pinzuordnung L1 = SCL, L2 = SDA, L3 = IRQ laut Herstellerdokument „IP5306 I2C Register“ V1.21
(Anschlussplan) und done.land. **Vor dem Einlöten am Datenblatt C488349 gegenprüfen.**

Verdrahtung:

1. Prüfen, ob an Pin 2–4 auf dem Board LEDs oder Widerstände hängen – falls ja, Leiterbahn
   trennen, sonst stören sie den Bus.
2. Pin 2 (SCL) → **GPIO 5** (Touch-SCL), Pin 3 (SDA) → **GPIO 4** (Touch-SDA). Der Chip teilt sich
   den Bus mit dem Touch-Controller (CST816D @ 0x15), der IP5306 hört auf **0x75**.
3. Je **2,2 kΩ** von SCL und SDA nach **3,3 V** – *nicht* nach BAT wie im Hersteller-Anschlussplan,
   der ESP32 verträgt an seinen Pins höchstens 3,6 V. (M5Stack betreibt den Chip genauso am ESP32.)
4. Kurze, gelötete Drähte (der Bus ist laut Quelle störempfindlich).

Wo GPIO 4/5 auf der Platine gut erreichbar sind, ist noch offen – ein Foto der Rückseite mit dem
Display-Flexkabel hilft.

Nach dem Umbau zeigt der Serial-Monitor beim Start:
`Akku-Lader: IP5306-I2C eingestellt (…), lädt / entlädt / Akku voll`.

### Register (Injoinic „IP5306 I2C Register“ V1.21)

| Register | Bit | Bedeutung | Firmware setzt |
|---|---|---|---|
| 0x00 SYS_CTL0 | 5 | 1 = bei wenig Last abschalten | 0 |
| 0x00 SYS_CTL0 | 1 | 5-V-Ausgang dauerhaft an | 1 |
| 0x24 CHG_DIG_CTL0 | 4:0 | I = 0,05 + b0·0,1 + b1·0,2 + b2·0,4 + b3·0,8 + b4·1,6 A (am Eingang) | 0b00101 = 0,55 A |
| 0x70 READ0 | 3 | lädt | lesen |
| 0x71 READ1 | 3 | voll | lesen |

Der Chip hat keinen Speicher – die Firmware setzt alles bei jedem Start neu.

## Anfrage an Topwell (Entwurf)

> Subject: Sample request – TWE0102 round LiPo (LP553535-580-1S2P)
>
> Hello,
>
> I would like to order **2 samples** of your round LiPo battery **TWE0102 / LP553535-580-1S2P**
> (3.7 V, 1160 mAh, 35.5 × 35.5 × 11.8 mm) for a small handheld device. Shipping to Germany.
>
> Please confirm or offer:
> 1. Protection circuit (PCM) included – overcharge, over-discharge, overcurrent and short-circuit
>    thresholds?
> 2. Lead wires about **50 mm** with a **JST 1.25 mm 2-pin** connector (red = +, black = –).
> 3. Maximum continuous charge current and the full datasheet.
> 4. Optional: 10 kΩ NTC (third wire) – price difference?
> 5. UN38.3 test summary and MSDS for air shipping.
> 6. Price for 2 and for 5 pieces, shipping cost and lead time.
>
> Thank you!

Vor dem Absenden die Polarität an der Board-Buchse prüfen (Aufdruck „BAT+“) und in Punkt 2
eintragen – JST-1,25-Kabel gibt es mit beiden Belegungen.

## Gehäuse (Idee, Maße folgen nach Akku-Lieferung)

Runder **Kiesel**, ähnlich einem klassischen Tamagotchi:

- oben das Display mit schmalem Rand, Ø außen ca. 46 mm
- darunter die Platine, darunter der Akku (Ø 35,5 × 11,8 mm), unten gewölbt
- Höhe grob 25 mm (Display + Platine ≈ 10 mm geschätzt, Akku 11,8 mm, Wände)
- seitlich: Öffnung für USB-C und für die IP5306-Taste
- Druck auf dem MK4 (Wände ≥ 1,8 mm)

Für die Konstruktion nötig: Gesamtdicke Display + Platine, Lage von USB-C und Taste,
genaue Akkumaße samt Kabelabgang.

## Quellen

- [done.land – IP5306](https://done.land/components/power/powersupplies/battery/chargers/charge-discharge/ip5306/)
  und [IP5306 I2C](https://done.land/components/power/powersupplies/battery/chargers/charge-discharge/ip5306/ip5306i2c/)
- [Injoinic „IP5306 I2C Register“ (mikrocontroller.net)](https://www.mikrocontroller.net/attachment/408784/IP5306_I2C_registers.de.pdf)
- [IP5306 Datenblatt (electrokit)](https://electrokit.com/upload/quick/12/91/662c_IP5306.pdf)
- [LCSC C488349 – IP5306-I2C](https://www.lcsc.com/product-detail/C488349.html)
- [Topwell TWE0102](https://www.topwellpower.com/products/small-round-lipo-battery-37v-1160mah-for-internet-of-things)
- [VTC – runde LiPo-Modelle](https://vtcbatt.com/round-lipo-battery/)
