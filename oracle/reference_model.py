"""Referenz-Orakel: agentenbasiertes Populationsmodell.

Das ist die "Ground Truth", gegen die die schlanke Engine kalibriert wird.
Bewusst ANDERE Mechanik als die Engine:
  - explizite Population einzelner Individuen (nicht ein Mittelwert)
  - stochastische Fortpflanzung proportional zur Fitness (Selektion)
  - Rekombination + gaussche Mutation der Nachkommen
  - endliche Populationsgroesse -> Drift

Die Fitness-Funktion ist IDENTISCH zu engine/fitness.ts und liest dieselben
Konstanten aus physics.json. Nur die *Dynamik* unterscheidet sich - genau das
soll die Engine im Training nachbilden.

Reine Standardbibliothek (kein numpy noetig), damit es ueberall laeuft.
"""

from __future__ import annotations

import math
import random
from typing import Dict, List, Sequence

# Trait-Reihenfolge muss zu engine/types.ts passen:
TRAITS = [
    "insulation",
    "size",
    "limbLength",
    "metabolism",
    "armor",
    "photosynthesis",
    "mobility",
    "structure",
]
INSULATION, SIZE, LIMB, METABOLISM, ARMOR, PHOTO, MOBILITY, STRUCTURE = 0, 1, 2, 3, 4, 5, 6, 7


def _clamp01(x: float) -> float:
    return 0.0 if x < 0 else 1.0 if x > 1 else x


def _sigmoid(x: float) -> float:
    return 1.0 / (1.0 + math.exp(-x))


def fitness(traits: Sequence[float], env: Dict[str, float], phys: Dict) -> float:
    """Spiegel von engine/fitness.ts - muss Zeile fuer Zeile aequivalent bleiben."""
    insulation = traits[INSULATION]
    size = traits[SIZE]
    limb = traits[LIMB]
    metabolism = traits[METABOLISM]
    armor = traits[ARMOR]
    photo = traits[PHOTO]
    mobility = traits[MOBILITY]
    structure = traits[STRUCTURE]

    # 1) Thermoregulation (quadratisch, glatter Peak)
    thermal_ideal = 1.0 - env["temperature"]
    d_t = insulation - thermal_ideal
    thermal = 1.0 - d_t * d_t

    # 2) Energie - zwei sich ausschliessende Strategien
    structure_light = phys["structureLightFloor"] + (1.0 - phys["structureLightFloor"]) * env["foodHeight"]
    light_access = phys["lightAccessBase"] + (1.0 - phys["lightAccessBase"]) * structure * structure_light
    photo_size = phys["photoSizeFloor"] + (1.0 - phys["photoSizeFloor"]) * size
    energy_photo = (
        photo * env["light"] * env["water"] * light_access * photo_size * (1.0 - phys["exclusion"] * mobility)
    )

    reach = _clamp01(limb * phys["reachFromLimb"] + size * phys["reachFromSize"])
    if env["foodHeight"] <= reach:
        access = 1.0
    else:
        access = _clamp01(1.0 - (env["foodHeight"] - reach) * phys["heightPenalty"])
    energy_forage = (
        mobility
        * env["foodAbundance"]
        * access
        * (phys["forageBase"] + phys["forageMetabolism"] * metabolism)
        * (1.0 - phys["exclusion"] * photo)
    )

    # c) Absorption / Zersetzung (Osmotrophie): SESSILE Heterotrophie.
    #    Waechst in sein Substrat (Totholz/Detritus), verdaut extrazellulaer ->
    #    braucht KEINE Mobilitaet. heterotroph (schliesst Photo aus) + sessil
    #    (schliesst Mobilitaet aus) + Enzyme (Stoffwechsel) + Feuchte (Nass-Prozess).
    #    Ohne diesen Term hatten sessile Heterotrophe (Pilze) null Nahrungsenergie.
    substrate = env["foodAbundance"] * (
        phys["absorbWaterFloor"] + (1.0 - phys["absorbWaterFloor"]) * env["water"]
    )
    energy_absorb = (
        phys["absorbYield"]
        * (phys["absorbBase"] + phys["absorbMetabolism"] * metabolism)
        * substrate
        * (1.0 - phys["exclusion"] * photo)
        * (1.0 - phys["exclusion"] * mobility)
    )
    total_energy = energy_photo + energy_forage + energy_absorb

    m = phys["maintenance"]
    mq = phys["maintenanceQuad"]
    maintenance = (
        m["base"]
        + size * m["size"]
        + insulation * m["insulation"]
        + armor * m["armor"]
        + metabolism * m["metabolism"]
        + photo * m["photosynthesis"]
        + mobility * m["mobility"]
        + structure * m["structure"]
        + metabolism * metabolism * mq["metabolism"]
        + mobility * mobility * mq["mobility"]
    )
    raw_nutrition = _sigmoid((total_energy - maintenance) * phys["energyScale"])
    nutrition = phys["nutritionFloor"] + (1.0 - phys["nutritionFloor"]) * raw_nutrition

    # 3) Praedation
    defense = _clamp01(
        armor * phys["defenseFromArmor"]
        + structure * phys["defenseFromStructure"]
        + size * phys["defenseFromSize"]
        + mobility * phys["defenseFromMobility"]
    )
    pred_survival = 1.0 - env["predation"] * (1.0 - defense)

    fit = (
        (thermal ** phys["wThermal"])
        * (pred_survival ** phys["wPred"])
        * (nutrition ** phys["wNutrition"])
    )
    return max(fit, phys["floor"])


# --- Orakel-eigene (feste) Dynamik-Parameter: das ist "die Wahrheit" ---
ORACLE_POP = 300
ORACLE_MUT_SD = 0.06
ORACLE_SEL_POWER = 2.0  # Fitness^power -> schaerfere Selektion
ORACLE_RECOMB_PROB = 0.5


def _mean_vector(pop: List[List[float]]) -> List[float]:
    n = len(pop)
    return [sum(ind[g] for ind in pop) / n for g in range(len(TRAITS))]


def run_oracle_once(
    env: Dict[str, float],
    generations: int,
    phys: Dict,
    rng: random.Random,
    start: float = 0.5,
) -> List[List[float]]:
    """Ein stochastischer Lauf. Gibt den Merkmals-Mittelwert je Generation zurueck
    (Laenge generations + 1)."""
    n = len(TRAITS)
    pop: List[List[float]] = [
        [_clamp01(start + rng.gauss(0, 0.03)) for _ in range(n)] for _ in range(ORACLE_POP)
    ]
    trajectory: List[List[float]] = [_mean_vector(pop)]

    for _ in range(generations):
        fits = [fitness(ind, env, phys) ** ORACLE_SEL_POWER for ind in pop]
        total = sum(fits)
        if total <= 0:
            weights = [1.0 / ORACLE_POP] * ORACLE_POP
        else:
            weights = [f / total for f in fits]

        # Fitness-proportionale Fortpflanzung mit Rekombination + Mutation
        new_pop: List[List[float]] = []
        parents_a = rng.choices(pop, weights=weights, k=ORACLE_POP)
        parents_b = rng.choices(pop, weights=weights, k=ORACLE_POP)
        for pa, pb in zip(parents_a, parents_b):
            child: List[float] = []
            for g in range(n):
                if rng.random() < ORACLE_RECOMB_PROB:
                    base = pb[g]
                else:
                    base = pa[g]
                child.append(_clamp01(base + rng.gauss(0, ORACLE_MUT_SD)))
            new_pop.append(child)
        pop = new_pop
        trajectory.append(_mean_vector(pop))

    return trajectory


def run_oracle(
    env: Dict[str, float],
    generations: int,
    phys: Dict,
    seeds: int = 24,
    base_seed: int = 12345,
) -> List[List[float]]:
    """Mittelt mehrere stochastische Laeufe -> glatte, robuste Referenzkurve.

    Mehr Seeds glaetten die neutrale Drift (Merkmale ohne Selektionsdruck) heraus,
    sodass die Ground Truth naeher an ihrem unverzerrten Erwartungswert liegt.
    """
    n = len(TRAITS)
    acc = [[0.0] * n for _ in range(generations + 1)]
    for s in range(seeds):
        rng = random.Random(base_seed + s * 7919)
        traj = run_oracle_once(env, generations, phys, rng)
        for t in range(generations + 1):
            for g in range(n):
                acc[t][g] += traj[t][g]
    return [[acc[t][g] / seeds for g in range(n)] for t in range(generations + 1)]
