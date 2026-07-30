"""Orakel-Pruefstand (Migrations-Stufe 6): faehrt den NISCHEN-SCHWARM mit grossem N
ueber eine Liste von Testumwelten und schreibt die END-POPULATIONEN heraus.

Bewusst ein reiner Rechenknecht: Zahlen rein (Umwelten + PopulationConfig), Zahlen
raus (Genome). Klassifikation, Formhaeufigkeits-Spektrum und Jensen-Shannon-Divergenz
passieren NICHT hier, sondern in tools/spectrum-check.mjs - dort liegt der kanonische
Klassifikator (`matchArchetype()` aus app/index.html + app/archetypes.js, seit
Migrations-Stufe 2) und die Cluster-Infrastruktur (world/cluster.ts). Eine zweite,
python-eigene Formklassifikation waere eine DRITTE Kopie derselben Regeln und damit
genau die Paritaets-Falle, die docs/engine-forschungsergebnis.md fuer die Physik
beschreibt ("die Physik existiert derzeit in drei Kopien").

Der Aufrufer (tools/spectrum-check.mjs) schreibt die Auftragsdatei; die Liste der
Testumwelten und die PopulationConfig existieren deshalb nur EINMAL, dort.

Aufruf:  python3 oracle/swarm_reference.py <auftrag.json> <ergebnis.json> [--workers N]
         (normalerweise nicht direkt, sondern ueber: npm run oracle-swarm)

Auftrag (JSON):
  { "generations": 250, "seeds": 5, "baseSeed": 12345,
    "config": { "size": 2000, "mutationSd": 0.05, "selPower": 2.0, "recombProb": 0.5,
                "niche": [1,2,5,6,4,8,9,15], "sigmaC": 0.22, "sigmaK": 50,
                "kCenter": 0.5, "founderSpread": "uniform" },
    "envs": [ { "name": "Eiszeit", "env": { ... } }, ... ] }

Ergebnis (JSON): dieselben Felder + "runs": [ { name, seedIndex, seed, genomes } ].
Genome auf 5 Dezimalstellen gerundet - das ist 4 Groessenordnungen feiner als jede
Prototyp-Schwelle und halbiert die Dateigroesse.
"""

from __future__ import annotations

import json
import os
import random
import sys
import time
from multiprocessing import Pool

from reference_model import TRAITS, DEFAULT_SWARM, run_swarm_once

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Prozess-lokaler Zustand der Worker (wird EINMAL je Prozess gesetzt statt je Auftrag
# durchgereicht - phys ist ein grosses dict, das sonst fuer jeden der 55 Laeufe neu
# gepickelt wuerde).
_W: dict = {}


def _init_worker(phys: dict, cfg: dict, generations: int) -> None:
    _W["phys"] = phys
    _W["cfg"] = cfg
    _W["generations"] = generations


def _run_job(job: dict) -> dict:
    t0 = time.time()
    pop = run_swarm_once(
        job["env"],
        _W["generations"],
        _W["phys"],
        random.Random(job["seed"]),
        _W["cfg"],
    )
    return {
        "name": job["name"],
        "seedIndex": job["seedIndex"],
        "seed": job["seed"],
        "seconds": round(time.time() - t0, 1),
        "genomes": [[round(v, 5) for v in ind] for ind in pop],
    }


def main() -> None:
    if len(sys.argv) < 3:
        print(__doc__)
        sys.exit(2)
    job_path, out_path = sys.argv[1], sys.argv[2]
    workers = 3
    for i, a in enumerate(sys.argv):
        if a == "--workers" and i + 1 < len(sys.argv):
            workers = max(1, int(sys.argv[i + 1]))

    with open(job_path, encoding="utf-8") as f:
        spec = json.load(f)
    with open(os.path.join(ROOT, "physics.json"), encoding="utf-8") as f:
        phys = json.load(f)

    cfg = dict(DEFAULT_SWARM)
    cfg.update(spec.get("config") or {})
    generations = spec["generations"]
    seeds = spec.get("seeds", 5)
    base_seed = spec.get("baseSeed", 12345)
    envs = spec["envs"]

    # Seeds muessen ueber Umwelten UND Laeufe hinweg eindeutig sein - sonst laufen
    # zwei Biome mit identischem Zufallsstrom (und identischen Gruender-Genomen).
    jobs = []
    for ei, e in enumerate(envs):
        for s in range(seeds):
            jobs.append(
                {
                    "name": e["name"],
                    "env": e["env"],
                    "seedIndex": s,
                    "seed": base_seed + ei * 1000003 + s * 7919,
                }
            )

    print(
        f"[orakel-schwarm] {len(envs)} Umwelten x {seeds} Laeufe = {len(jobs)} Laeufe, "
        f"N={cfg['size']}, {generations} Generationen, {workers} Prozess(e)",
        flush=True,
    )
    t0 = time.time()
    runs = []
    with Pool(processes=workers, initializer=_init_worker, initargs=(phys, cfg, generations)) as pool:
        for r in pool.imap_unordered(_run_job, jobs):
            runs.append(r)
            done = len(runs)
            el = time.time() - t0
            eta = el / done * (len(jobs) - done)
            print(
                f"  [{done:3}/{len(jobs)}] {r['name']:20} Lauf {r['seedIndex']}  "
                f"{r['seconds']:6.1f}s   (verstrichen {el/60:.1f} min, ETA {eta/60:.1f} min)",
                flush=True,
            )

    runs.sort(key=lambda r: (r["name"], r["seedIndex"]))
    out = {
        "_comment": (
            "Erzeugt von oracle/swarm_reference.py (Migrations-Stufe 6). End-Populationen "
            "des Nischen-Schwarms bei grossem N - die Gross-N-Grenze des Modells, das die "
            "Live-App bei N=200 laeuft. Gelesen von tools/spectrum-check.mjs."
        ),
        "generatedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "traits": TRAITS,
        "generations": generations,
        "seeds": seeds,
        "baseSeed": base_seed,
        "config": cfg,
        "envs": envs,
        "wallClockMinutes": round((time.time() - t0) / 60, 2),
        "runs": runs,
    }
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False)
    mb = os.path.getsize(out_path) / 1e6
    print(
        f"[orakel-schwarm] Fertig in {(time.time()-t0)/60:.1f} min -> {out_path} ({mb:.1f} MB)",
        flush=True,
    )


if __name__ == "__main__":
    main()
