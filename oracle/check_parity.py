"""Paritaets-Pruefung Teil 2 (Python): liest die von tools/parity.mjs erzeugten
Stichproben, rechnet die Python-Fitness (oracle/reference_model.py) und vergleicht
mit der TS-Fitness. Weicht irgendeine Stichprobe um mehr als die Toleranz ab,
schlaegt die Pruefung fehl (Exit 1) - dann sind Engine und Orakel NICHT mehr
physikalisch identisch und die gesamte Validierung waere wertlos.

Aufruf ueber:  npm run parity
"""

from __future__ import annotations

import json
import os
import sys

from reference_model import fitness

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TOLERANCE = 1e-9


def main() -> None:
    with open(os.path.join(ROOT, "physics.json"), encoding="utf-8") as f:
        phys = json.load(f)
    with open(os.path.join(ROOT, ".parity.json"), encoding="utf-8") as f:
        samples = json.load(f)["samples"]

    max_diff = 0.0
    worst = None
    for s in samples:
        py_fit = fitness(s["traits"], s["env"], phys)
        diff = abs(py_fit - s["tsFit"])
        if diff > max_diff:
            max_diff = diff
            worst = s
    n = len(samples)
    print(f"[parity] {n} Stichproben verglichen. Max |TS - Python| = {max_diff:.3e}")
    if max_diff > TOLERANCE:
        print(f"[parity] FEHLER: Abweichung ueber Toleranz {TOLERANCE:.0e}.")
        print(f"[parity] Schlechteste Stichprobe: {worst}")
        sys.exit(1)
    print(f"[parity] OK - Engine und Orakel sind physikalisch identisch (< {TOLERANCE:.0e}).")


if __name__ == "__main__":
    main()
