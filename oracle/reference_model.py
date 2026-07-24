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
    "wing",
    "biolum",
    "detox",
    "oxyEff",
    "osmo",
    "burrow",
    "pigment",
    "filter",
    "camo",
    "baro",
]
INSULATION, SIZE, LIMB, METABOLISM, ARMOR, PHOTO, MOBILITY, STRUCTURE, WING, BIOLUM, DETOX, OXYEFF, OSMO, BURROW, PIGMENT, FILTER, CAMO, BARO = 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17


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
    wing = traits[WING]
    biolum = traits[BIOLUM] if len(traits) > BIOLUM else 0.0
    detox = traits[DETOX] if len(traits) > DETOX else 0.0
    oxy_eff = traits[OXYEFF] if len(traits) > OXYEFF else 0.0
    osmo = traits[OSMO] if len(traits) > OSMO else 0.0
    burrow = traits[BURROW] if len(traits) > BURROW else 0.0
    pigment = traits[PIGMENT] if len(traits) > PIGMENT else 0.0
    filter_ = traits[FILTER] if len(traits) > FILTER else 0.0
    camo = traits[CAMO] if len(traits) > CAMO else 0.0
    baro = traits[BARO] if len(traits) > BARO else 0.0

    # "An Land" (0..1): 1 ausserhalb tiefen Wassers, 0 im offenen Wasserkoerper.
    # Landjagd UND Flug sind terrestrisch/aerisch - unter Wasser jagt man schwimmend.
    land_factor = 1.0 - _clamp01((env["water"] - phys["aquaticWaterFloor"]) / (1.0 - phys["aquaticWaterFloor"]))

    # Flug (AXIS-1): nur leichte, aktive Koerper fliegen. Unter Wasser kein Flug.
    flight = (
        wing
        * _clamp01(1.0 - size * phys["flightSizePenalty"])
        * (phys["flightMetabFloor"] + (1.0 - phys["flightMetabFloor"]) * metabolism)
        * land_factor
    )

    # 1) Thermoregulation (quadratisch, glatter Peak)
    #    Endothermie (Biologie-Audit): Fell haelt Waerme, aber ohne metabolischen
    #    "Ofen" gibt es kaum Koerperwaerme zu halten -> Kaelte braucht Isolation
    #    UND Stoffwechsel (Warmblueter = Fell + hoher Stoffwechsel).
    endo_factor = phys["endothermyMetabFloor"] + (1.0 - phys["endothermyMetabFloor"]) * metabolism
    # Fell wirkt unter Wasser kaum (Luft-Einschluss wird verdraengt) -> keine pelzigen
    # Tiefsee-Warmblueter; die Tiefsee ist Fisch/Kopffuesser-Land.
    eff_insulation = insulation * endo_factor * (1.0 - phys["insulWaterLoss"] * env["water"])
    thermal_ideal = 1.0 - env["temperature"]
    d_t = eff_insulation - thermal_ideal
    thermal = 1.0 - d_t * d_t

    # 2) Energie - zwei sich ausschliessende Strategien
    structure_light = phys["structureLightFloor"] + (1.0 - phys["structureLightFloor"]) * env["foodHeight"]
    light_access = phys["lightAccessBase"] + (1.0 - phys["lightAccessBase"]) * structure * structure_light
    photo_size = phys["photoSizeFloor"] + (1.0 - phys["photoSizeFloor"]) * size
    # Temperatur-Abhaengigkeit (Biologie-Audit): Photosynthese hat ein Optimum;
    # in Kaelte/Hitze sinkt die Enzym-Leistung (milde Glocke).
    dtp = env["temperature"] - phys["photoTempOpt"]
    photo_thermal = _clamp01(1.0 - phys["photoTempStrength"] * dtp * dtp)
    energy_photo = (
        photo * env["light"] * env["water"] * light_access * photo_size * photo_thermal * (1.0 - phys["exclusion"] * mobility)
    )

    # Biologie-Audit: GLIEDMASSEN erschliessen hohes Futter nur an LAND
    # (limb*land_factor). Unter Wasser schwimmt man hinauf (aquatische Jagd) -
    # keine absurden Beine/Fluegel mehr beim Tiefsee-Schwimmer fuers "hohe" Futter.
    reach = _clamp01(limb * phys["reachFromLimb"] * land_factor + size * phys["reachFromSize"] + flight * phys["flightReach"])
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
    # d) Aquatische Jagd (AXIS-4): schwimmende Heterotrophie im Wasserkoerper.
    #    Braucht KEINE Reichweite (Gliedmassen) - Nahrung wird erschwommen. Belohnt
    #    Mobilitaet + STROMLINIENFOERMIGEN Koerper (Gliedmassen/Panzer = Drag), nur
    #    im tiefen Wasser (aquaticWaterFloor), heterotroph (schliesst Photo aus).
    #    Schafft den Gipfel "schlank + mobil im Wasser" = Fisch/Aal, Kopffuesser.
    aqua_habitat = _clamp01(
        (env["water"] - phys["aquaticWaterFloor"]) / (1.0 - phys["aquaticWaterFloor"])
    )
    streamline = _clamp01(1.0 - limb * phys["aquaticLimbDrag"] - armor * phys["aquaticArmorDrag"])
    energy_aquatic = (
        phys["aquaticYield"]
        * mobility
        * env["foodAbundance"]
        * aqua_habitat
        * streamline
        * (phys["aquaticBase"] + (1.0 - phys["aquaticBase"]) * metabolism)
        * (1.0 - phys["exclusion"] * photo)
    )
    # e) Biolumineszenz (AXIS-5): Leuchtorgan lockt/beleuchtet Beute, NUR im Dunkeln
    #    (dark = 1-light). Nahrungs-Einkommen dort, wo Photo tot ist; aktive Koerper
    #    nutzen es besser; heterotroph (schliesst Photo aus). Kosten: maintenance.biolum.
    dark = _clamp01((phys["biolumDarkFloor"] - env["light"]) / phys["biolumDarkFloor"])
    glow = biolum * dark
    energy_glow = (
        phys["biolumYield"]
        * glow
        * (phys["biolumMobFloor"] + (1.0 - phys["biolumMobFloor"]) * mobility)
        * env["foodAbundance"]
        * (1.0 - phys["exclusion"] * photo)
    )
    # f) Filtrieren / Suspensionsfressen (AXIS-3): sessiles Sieben schwebender Partikel
    #    im Wasser, braucht weder Mobilitaet noch Stromlinie; heterotroph.
    energy_filter = (
        phys["filterYield"]
        * filter_
        * aqua_habitat
        * (phys["filterBase"] + (1.0 - phys["filterBase"]) * env["foodAbundance"])
        * (1.0 - phys["exclusion"] * photo)
    )
    total_energy = energy_photo + energy_forage + energy_absorb + energy_aquatic + energy_glow + energy_filter

    m = phys["maintenance"]
    mq = phys["maintenanceQuad"]
    # Kleibersche Allometrie: massenspezifische Stoffwechselkosten ~ Masse^-0.25
    # (Gesamt-Stoffwechsel ~ Masse^0.75). Rabatt nur auf die Stoffwechsel-Kosten.
    kleiber = 10.0 ** (-0.25 * phys["kleiberDecades"] * size)
    maintenance = (
        m["base"]
        + size * m["size"]
        + insulation * m["insulation"]
        + armor * m["armor"]
        + metabolism * m["metabolism"] * kleiber
        + photo * m["photosynthesis"]
        + mobility * m["mobility"]
        + structure * m["structure"]
        + wing * m["wing"]
        + biolum * m["biolum"]
        + detox * m["detox"]
        + oxy_eff * m["oxyEff"]
        + osmo * m["osmo"]
        + burrow * m["burrow"]
        + pigment * m["pigment"]
        + filter_ * m["filter"]
        + camo * m["camo"]
        + baro * m["baro"]
        + metabolism * metabolism * mq["metabolism"] * kleiber
        + mobility * mobility * mq["mobility"]
        + armor * armor * mq["armor"]
    )
    raw_nutrition = _sigmoid((total_energy - maintenance) * phys["energyScale"])
    nutrition = phys["nutritionFloor"] + (1.0 - phys["nutritionFloor"]) * raw_nutrition

    # 3) Praedation
    defense = _clamp01(
        armor * phys["defenseFromArmor"]
        + structure * phys["defenseFromStructure"]
        + size * phys["defenseFromSize"]
        + mobility * phys["defenseFromMobility"]
        + flight * phys["defenseFromFlight"]
        + biolum * dark * phys["biolumDefense"]
        + burrow * phys["defenseFromBurrow"] * land_factor  # AXIS-9: fossoriale Flucht, nur an Land
        + camo * phys["defenseFromCamo"]  # AXIS-11: visuelle Krypsis, drag-frei
    )
    pred_survival = 1.0 - env["predation"] * (1.0 - defense)

    # 4) Chemischer Stress (AXIS-6): giftige Milieus toeten ohne Entgiftung (detox).
    #    toxicity ist eine Umwelt-Dimension jenseits der 6 Regler (Umwelt-Einfluesse).
    toxicity = env.get("toxicity", 0.0)
    tox_survival = _clamp01(1.0 - toxicity * (1.0 - detox) * phys["toxLethality"])

    # 5) Sauerstoffmangel (AXIS-7): duenne Hoehenluft / anoxisches Wasser toeten
    #    hohen Stoffwechsel, es sei denn oxyEff (effiziente Atmung) puffert. oxygen
    #    ist eine Umwelt-Dimension jenseits der 6 Regler (Umwelt-Einfluesse).
    oxygen = env.get("oxygen", 1.0)
    oxy_survival = _clamp01(1.0 - (1.0 - oxygen) * metabolism * (1.0 - oxy_eff) * phys["hypoxiaSeverity"])

    # 6) Osmotischer Stress (AXIS-8): salzige Milieus ziehen osmotisch Wasser aus,
    #    es sei denn osmo (Osmoregulation) puffert. salinity ist eine Umwelt-Dimension
    #    jenseits der 6 Regler (Umwelt-Einfluesse: Salzsee/Brine, Aestuar, Salzboden).
    salinity = env.get("salinity", 0.0)
    osmo_survival = _clamp01(1.0 - salinity * (1.0 - osmo) * phys["salinityLethality"])

    # 7) UV-Stress (AXIS-10): starke UV-Strahlung schädigt DNA ohne Schutzpigment.
    uv = env.get("uv", 0.0)
    uv_survival = _clamp01(1.0 - uv * (1.0 - pigment) * phys["uvLethality"])

    # 8) Druck-Stress (AXIS-12): extremer Tiefsee-Druck ohne Druck-Anpassung toedlich.
    pressure = env.get("pressure", 0.0)
    baro_survival = _clamp01(1.0 - pressure * (1.0 - baro) * phys["baroLethality"])

    fit = (
        (thermal ** phys["wThermal"])
        * (pred_survival ** phys["wPred"])
        * (nutrition ** phys["wNutrition"])
        * (tox_survival ** phys["wTox"])
        * (oxy_survival ** phys["wOxy"])
        * (osmo_survival ** phys["wOsmo"])
        * (uv_survival ** phys["wUv"])
        * (baro_survival ** phys["wBaro"])
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
