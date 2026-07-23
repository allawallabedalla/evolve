"""Faehrt das Orakel offline auf allen Benchmark-Szenarien und schreibt die
'wahren' Merkmals-Trajektorien nach oracle/benchmark/.

Diese Dateien sind der Trainingsdatensatz fuer die Kalibrierung der schlanken
Engine (training/fit.ts liest sie). Das schwere Rechnen passiert HIER, offline -
nie im Browser.

Aufruf:  python3 oracle/generate_benchmark.py   (oder: npm run oracle)
"""

from __future__ import annotations

import json
import os
import time

from reference_model import TRAITS, run_oracle

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BENCH_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "benchmark")


def main() -> None:
    with open(os.path.join(ROOT, "physics.json"), encoding="utf-8") as f:
        phys = json.load(f)
    with open(os.path.join(ROOT, "scenarios.json"), encoding="utf-8") as f:
        scenarios = json.load(f)["scenarios"]

    os.makedirs(BENCH_DIR, exist_ok=True)
    index = []
    print(f"Orakel laeuft ueber {len(scenarios)} Szenarien ...")

    for sc in scenarios:
        t0 = time.time()
        traj = run_oracle(sc["env"], sc["generations"], phys)
        out = {
            "name": sc["name"],
            "split": sc["split"],
            "env": sc["env"],
            "generations": sc["generations"],
            "traits": TRAITS,
            "trajectory": traj,
            "final": traj[-1],
        }
        fname = sc["name"].replace(" ", "_") + ".json"
        with open(os.path.join(BENCH_DIR, fname), "w", encoding="utf-8") as f:
            json.dump(out, f, ensure_ascii=False, indent=1)
        index.append({"name": sc["name"], "split": sc["split"], "file": fname})
        dt = time.time() - t0
        final_str = ", ".join(f"{TRAITS[g]}={traj[-1][g]:.2f}" for g in range(len(TRAITS)))
        print(f"  [{sc['split']:5}] {sc['name']:20} ({dt:.1f}s)  -> {final_str}")

    with open(os.path.join(BENCH_DIR, "index.json"), "w", encoding="utf-8") as f:
        json.dump(index, f, ensure_ascii=False, indent=1)
    print(f"Fertig. Benchmark-Daten in {BENCH_DIR}")


if __name__ == "__main__":
    main()
