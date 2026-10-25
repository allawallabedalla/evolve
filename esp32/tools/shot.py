"""Bildschirmfotos vom Board holen (Serial-Befehl "shot") und als PNG speichern.

    python esp32/tools/shot.py COM7 bild.png                 # ein Foto vom aktuellen Bildschirm
    python esp32/tools/shot.py COM7 bogen.png --poses 0-9    # Kontaktbogen aller Vorschau-Posen

Das Board schickt "SHOT <w> <h> <bytes>" und danach RGB565 in Display-Byte-Reihenfolge
(LV_COLOR_16_SWAP = 1, also big endian). Der runde Bildausschnitt wird maskiert.
Braucht pyserial und Pillow.
"""
import sys
import time

import serial
from PIL import Image, ImageDraw


def read_shot(s):
    s.reset_input_buffer()
    s.write(b"shot\n")
    end = time.time() + 10
    line = b""
    while time.time() < end:
        c = s.read(1)
        if not c:
            continue
        if c == b"\n":
            if line.startswith(b"SHOT "):
                w, h, n = map(int, line.split()[1:4])
                data = b""
                while len(data) < n and time.time() < end:
                    data += s.read(n - len(data))
                if len(data) < n:
                    raise RuntimeError(f"nur {len(data)} von {n} Byte empfangen")
                return to_image(w, h, data)
            line = b""
        else:
            line += c
    raise RuntimeError("keine Antwort auf 'shot'")


def to_image(w, h, data):
    img = Image.new("RGB", (w, h))
    px = img.load()
    for y in range(h):
        for x in range(w):
            i = 2 * (y * w + x)
            v = (data[i] << 8) | data[i + 1]
            r, g, b = (v >> 11) & 31, (v >> 5) & 63, v & 31
            px[x, y] = (r * 255 // 31, g * 255 // 63, b * 255 // 31)
    # wie das runde Panel: außerhalb des Kreises schwarz
    mask = Image.new("L", (w, h), 0)
    ImageDraw.Draw(mask).ellipse((0, 0, w - 1, h - 1), fill=255)
    out = Image.new("RGB", (w, h), (0, 0, 0))
    out.paste(img, (0, 0), mask)
    return out


def shot_with_retry(s, tries=3):
    for k in range(tries):
        try:
            return read_shot(s)
        except RuntimeError as e:
            if k == tries - 1:
                raise
            print("Wiederholung:", e)
            time.sleep(1.5)


def main():
    port, path = sys.argv[1], sys.argv[2]
    # DTR/RTS nicht anfassen: beim C3 setzt RTS das Board zurück
    s = serial.Serial()
    s.port, s.baudrate, s.timeout = port, 115200, 0.3
    s.dtr = False
    s.rts = False
    s.open()
    time.sleep(0.3)
    if "--poses" in sys.argv:
        a, b = map(int, sys.argv[sys.argv.index("--poses") + 1].split("-"))
        shots = []
        for i in range(a, b + 1):
            s.write(f"pose {i}\n".encode())
            time.sleep(0.6)
            shots.append(shot_with_retry(s))
        s.write(b"pose off\n")
        cols = 5
        rows = (len(shots) + cols - 1) // cols
        sheet = Image.new("RGB", (cols * 244, rows * 244), (40, 40, 40))
        for k, im in enumerate(shots):
            sheet.paste(im, ((k % cols) * 244 + 2, (k // cols) * 244 + 2))
        sheet.save(path)
    else:
        shot_with_retry(s).save(path)
    print("gespeichert:", path)


if __name__ == "__main__":
    main()
