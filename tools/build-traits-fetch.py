"""Laedt die Merkmalsquellen aus Schritt 1.1b (s. tools/build-traits.mjs) herunter und
wandelt sie von R-Serialisierung (.rda) nach CSV um.

Getrennt von build-traits.mjs, weil die .rda-Dekodierung `pyreadr` braucht (kein
R-Interpret in dieser Umgebung) — eine Python-Abhaengigkeit, die NICHT Teil des
normalen npm-Gate-Zyklus werden soll. Deshalb eigene requirements-Datei
(tools/requirements-traits.txt), nicht in oracle/ (das bleibt stdlib-rein) oder in
package.json.

Aufruf:  pip install -r tools/requirements-traits.txt
         python3 tools/build-traits-fetch.py
"""
import os
import urllib.request

UA = "evolve-artenkatalog/0.1 (https://github.com/allawallabedalla/evolve)"
BASE = "https://raw.githubusercontent.com/RS-eco/traitdata/main/data/"
CACHE_DIR = os.path.join(os.path.dirname(__file__), ".traits-cache")
# Datensatz -> (Datei ohne Endung, Spalten die als NICHT-UTF8 bekannt sind und beim
# CSV-Export uebersprungen werden, s. build-traits.mjs Kommentar zur Nicht-Anbindung
# von amphibio/fishmorph/lizard_traits).
DATASETS = ["pantheria", "elton_mammals", "elton_birds"]

os.makedirs(CACHE_DIR, exist_ok=True)


def fetch(name):
    rda = os.path.join(CACHE_DIR, name + ".rda")
    if not os.path.exists(rda):
        req = urllib.request.Request(BASE + name + ".rda", headers={"User-Agent": UA})
        with urllib.request.urlopen(req, timeout=60) as r, open(rda, "wb") as f:
            f.write(r.read())
    return rda


def to_csv(rda_path, csv_path):
    import pyreadr
    result = pyreadr.read_r(rda_path)
    # .rda kann mehrere Objekte enthalten; wir nehmen das (einzige) Daten-Objekt.
    df = next(iter(result.values()))
    df.to_csv(csv_path, index=False)
    return len(df)


for name in DATASETS:
    rda = fetch(name)
    csv = os.path.join(CACHE_DIR, name + ".csv")
    n = to_csv(rda, csv)
    print(f"{name}: {n} Zeilen -> {csv}")
