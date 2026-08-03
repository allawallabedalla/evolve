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
    "sense",
    "desicc",
    "radres",
    "fireres",
    "frostres",
    "windres",
    "nfix",
    "resprout",
]
INSULATION, SIZE, LIMB, METABOLISM, ARMOR, PHOTO, MOBILITY, STRUCTURE, WING, BIOLUM, DETOX, OXYEFF, OSMO, BURROW, PIGMENT, FILTER, CAMO, BARO, SENSE, DESICC, RADRES, FIRERES, FROSTRES, WINDRES, NFIX, RESPROUT = 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25


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
    sense = traits[SENSE] if len(traits) > SENSE else 0.0
    desicc = traits[DESICC] if len(traits) > DESICC else 0.0
    radres = traits[RADRES] if len(traits) > RADRES else 0.0
    fireres = traits[FIRERES] if len(traits) > FIRERES else 0.0
    frostres = traits[FROSTRES] if len(traits) > FROSTRES else 0.0
    windres = traits[WINDRES] if len(traits) > WINDRES else 0.0
    nfix = traits[NFIX] if len(traits) > NFIX else 0.0
    resprout = traits[RESPROUT] if len(traits) > RESPROUT else 0.0

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
    # Wiederaustrieb (AXIS-25, resprout): zweiter, billigerer Weg ins Licht - s.
    # engine/fitness.ts fuer den vollen Kommentar. Skaliert mit (1-size) UND mit
    # disturbance (Feuer/Frost) - ohne Stoerung gibt es nichts wiederherzustellen.
    disturbance = _clamp01(max(env.get("fire", 0.0), env.get("frost", 0.0)))
    light_access = _clamp01(
        phys["lightAccessBase"] + (1.0 - phys["lightAccessBase"]) * structure * structure_light
        + phys["resproutReach"] * resprout * disturbance * (1.0 - size)
    )
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
    # Sinne (AXIS-13): hebt die WAHRGENOMMENE Nahrungsdichte an (findet Beute, die
    # sonst unentdeckt bliebe) statt als Multiplikator auf ein durch Mangel bereits
    # kollabiertes Grundeinkommen zu wirken (Bugfix, s. engine/fitness.ts). Nur bei
    # echter Knappheit wirksam (1-foodAbundance), im Ueberfluss ohne Effekt.
    food_perceived = env["foodAbundance"] + phys["senseForage"] * sense * (1.0 - env["foodAbundance"])
    energy_forage = (
        mobility
        * food_perceived
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
    # d.2) Amphibische Nische (AXIS-21, zweiter Anlauf, 2026-07-30): Dreieck-Gate auf water
    #    (Zentrum amphibiousWaterCenter=0.65, NICHT aquaticWaterFloor=0.5 - bei water=0.5
    #    exakt null, s. engine/fitness.ts fuer den vollen Befund) UND auf limb (mittlerer
    #    Bauplan). Braucht Mobilitaet + Nahrung, heterotroph (schliesst Photo aus).
    amph_water_tri = _clamp01(1.0 - abs(env["water"] - phys["amphibiousWaterCenter"]) / phys["amphibiousBandWidth"])
    amph_limb_tri = _clamp01(1.0 - abs(limb - phys["amphibiousLimbOpt"]) / phys["amphibiousLimbWidth"])
    energy_amphibious = (
        phys["amphibiousYield"]
        * amph_water_tri
        * amph_limb_tri
        * mobility
        * env["foodAbundance"]
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
    # g) Stickstoff-Fixierung/Chemosynthese (AXIS-19): naehrstoff-unabhaengige Energie,
    #    zaehlt v.a. bei knappen Naehrstoffen; sessil (schliesst Mobilitaet aus).
    energy_nfix = (
        phys["nfixYield"]
        * nfix
        * (phys["nfixBase"] + (1.0 - phys["nfixBase"]) * (1.0 - env["foodAbundance"]))
        * (1.0 - phys["exclusion"] * mobility)
    )
    # h) Gliedmassen-Substrat-Traktion (AXIS-20, Stufe 3.5): viele/lange Gliedmassen an einem
    #    KLEINEN Koerper erschliessen ein eigenes, kleines Einkommen aus zerstreuter Boden-/
    #    Unterholz-Nahrung (Laubstreu, Rindenritzen, Kleinstbeute) - Wendigkeit im ENGEN
    #    Substrat, nicht Reichweite nach oben (das leistet reach_from_size). Ein GROSSER
    #    Koerper kann das nicht ueber Groesse nachbilden: (1-size) macht den Bonus exklusiv
    #    fuer kleine Baupläne. Braucht Mobilitaet, nur an LAND (land_factor), heterotroph.
    #    BEWUSST ein eigener, kleiner additiver Kanal statt eines Multiplikators auf die
    #    gesamte energy_forage (wie sense_boost, urspruenglich versucht): ein Multiplikator
    #    auf die volle Jagd-Einkommensbasis wirkt fuer JEDES Landtier mit etwas Gliedmasse
    #    und kippt schon bei kleinen Werten die Reich-Balance (Oekologie-Check C4: Tier >
    #    55 %), lange bevor Insekt 2 % erreicht - gemessen und verworfen. Als eigener Kanal
    #    (Praezedenz: energy_filter/energy_nfix/energy_absorb) bleibt der Vorteil schmal.
    #    Zusaetzlich exklusiv fuer den wirklich insektoiden Bauplan: (1-armor)*(1-insulation)
    #    schliesst gepanzerte (Krebstier/Koloss) und pelzige (Fell-Warmblueter) Baupläne aus -
    #    ohne diese Exklusivitaet floss der Bonus in jedes kleine, gliedmaßenreiche Landtier
    #    (auch gepanzert/pelzig) und blaehte die gesamte Tier-Nische auf (gemessen, verworfen).
    # insect_shape wird quadriert: schaerft den Peak auf Baupläne, die ALLE VIER Bedingungen
    # zugleich GUT erfuellen statt nur maessig - reduziert den Streueffekt auf generische
    # kleine/mobile Tiere (z. B. in der Raeuber-Beute-Koevolution, s.u.), die insect_shape nur
    # maessig erfuellen.
    # Umwelt-Gate als ECHTE Schwellen (analog aquaticWaterFloor/biolumDarkFloor), NICHT linear:
    # nur in WIRKLICHER Hitze (oberhalb tractionHeatFloor) UND WIRKLICHER Nahrungsknappheit
    # (unterhalb tractionScarcityCeiling) aktiv - die reale Nische der Landgliederfuesser
    # (Wueste/Trockensavanne, docs Messung 3 "Hitze-Duerre": temperature .92, foodAbundance
    # .3), NICHT jede gemaessigt-warme oder leicht knappe Umwelt. Noetig (gemessen): eine
    # LINEARE Kopplung an env["temperature"] (mit/ohne (1-foodAbundance)) trennte die
    # Ziel-Nische nicht ausreichend von (a) der Reich-Balance ueber den vollen Umwelt-Wuerfel
    # (Oekologie-Check C4: Tier > 55 %) und (b) der Test-Umwelt der endogenen Raeuber-Beute-
    # Koevolution (Rote Koenigin, P5/coevolution-check: temperature=0.5, foodAbundance=0.75 -
    # deutlich unterhalb beider Schwellen, daher mit den Schwellen exakt 0 statt nur "klein").
    hot = _clamp01((env["temperature"] - phys["tractionHeatFloor"]) / (1.0 - phys["tractionHeatFloor"]))
    dry = _clamp01((phys["tractionScarcityCeiling"] - env["foodAbundance"]) / phys["tractionScarcityCeiling"])
    insect_shape = limb * _clamp01(1.0 - size) * _clamp01(1.0 - armor) * _clamp01(1.0 - insulation)
    traction = insect_shape * insect_shape * land_factor * hot * dry
    energy_traction = phys["tractionYield"] * mobility * traction * (1.0 - phys["exclusion"] * photo)
    total_energy = (
        energy_photo
        + energy_forage
        + energy_absorb
        + energy_aquatic
        + energy_amphibious
        + energy_glow
        + energy_filter
        + energy_nfix
        + energy_traction
    )

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
        + sense * m["sense"]
        + desicc * m["desicc"]
        + radres * m["radres"]
        + fireres * m["fireres"]
        + frostres * m["frostres"]
        + windres * m["windres"]
        + nfix * m["nfix"]
        + metabolism * metabolism * mq["metabolism"] * kleiber
        + mobility * mobility * mq["mobility"]
        + armor * armor * mq["armor"]
    )
    # Wiederaustrieb-Steuer (AXIS-25): jaehrlicher Wiederaufbau kostet einen Anteil der
    # Gesamtenergie statt eines festen Unterhalts (kein m["resprout"]) - skaliert wie
    # der lightAccess-Bonus oben mit disturbance.
    total_energy_after_resprout = total_energy * (1.0 - phys["resproutCost"] * resprout * disturbance)
    raw_nutrition = _sigmoid((total_energy_after_resprout - maintenance) * phys["energyScale"])
    nutrition = phys["nutritionFloor"] + (1.0 - phys["nutritionFloor"]) * raw_nutrition

    # 3) Praedation
    defense = _clamp01(
        armor * phys["defenseFromArmor"]
        + structure * phys["defenseFromStructure"]
        + size * phys["defenseFromSize"]
        + mobility * phys["defenseFromMobility"]
        + flight * phys["defenseFromFlight"]
        + biolum * dark * phys["biolumDefense"]
        + burrow * phys["defenseFromBurrow"] * land_factor * mobility  # AXIS-9: fossoriale Flucht, nur an Land + Bewegung in den Bau
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

    # 9) Austrocknung (AXIS-14): extreme Trockenheit ohne Austrocknungs-Toleranz toedlich.
    aridity = env.get("aridity", 0.0)
    desicc_survival = _clamp01(1.0 - aridity * (1.0 - desicc) * phys["desiccLethality"])

    # 10) Ionisierende Strahlung (AXIS-15): radioaktive Milieus ohne Strahlungsresistenz toedlich.
    radiation = env.get("radiation", 0.0)
    rad_survival = _clamp01(1.0 - radiation * (1.0 - radres) * phys["radLethality"])

    # 11) Feuer (AXIS-16): wiederkehrende Braende ohne Feuer-Anpassung toedlich.
    fire = env.get("fire", 0.0)
    fire_survival = _clamp01(1.0 - fire * (1.0 - fireres) * phys["fireLethality"])

    # 12) Frost (AXIS-17): tiefer Frost ohne Kryoprotektion toedlich (Eiskristall-Schaden).
    frost = env.get("frost", 0.0)
    frost_survival = _clamp01(1.0 - frost * (1.0 - frostres) * phys["frostLethality"])

    # 13) Wind/Exposition (AXIS-18): mechanischer Dauerstress ohne Windhaerte toedlich.
    wind = env.get("wind", 0.0)
    wind_survival = _clamp01(1.0 - wind * (1.0 - windres) * phys["windLethality"])

    # 14) Stoerungs-Ueberleben / Wiederaustrieb (AXIS-25): s. engine/fitness.ts fuer den
    #     vollen Kommentar. BEWUSST OHNE predation (anders als der urspruengliche Vorschlag) -
    #     predation ist bereits durch den endogenen Raeuber-Beute-Mechanismus belegt
    #     (world/coevolution.ts) und gab dort eine vom echten Verteidigungs-Handel geloeste
    #     Flucht (gemessen: distribution-check B4 ausserhalb Zielband). `disturbance` wurde
    #     bereits oben bei light_access berechnet, hier nur wiederverwendet.
    regrowth_survival = _clamp01(
        1.0 - disturbance * (1.0 - max(fireres, resprout)) * phys["resproutSeverity"]
    )

    fit = (
        (thermal ** phys["wThermal"])
        * (pred_survival ** phys["wPred"])
        * (nutrition ** phys["wNutrition"])
        * (tox_survival ** phys["wTox"])
        * (oxy_survival ** phys["wOxy"])
        * (osmo_survival ** phys["wOsmo"])
        * (uv_survival ** phys["wUv"])
        * (baro_survival ** phys["wBaro"])
        * (desicc_survival ** phys["wDesicc"])
        * (rad_survival ** phys["wRad"])
        * (fire_survival ** phys["wFire"])
        * (frost_survival ** phys["wFrost"])
        * (wind_survival ** phys["wWind"])
        * (regrowth_survival ** phys["wResprout"])
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


# ===========================================================================
# NISCHEN-SCHWARM: das Orakel als STATISTISCHER PRUEFSTAND (Migrations-Stufe 6)
# ===========================================================================
#
# Warum es das oben Stehende NICHT ersetzt, sondern ergaenzt:
#
# `run_oracle_once`/`run_oracle` sind das DESTILLATIONS-Orakel. Sie kollabieren jede
# Generation auf `_mean_vector` und mitteln zusaetzlich ueber 24 Seeds - genau richtig
# fuer ihren Zweck (eine glatte Mittelwert-Trajektorie als Fit-Ziel fuer die
# Mittelfeld-Engine, oracle/generate_benchmark.py -> training/fit.ts) und genau falsch
# fuer die Frage dieser Stufe. Ein Schwarm, der sich in zwei Formen aufspaltet, hat
# einen Mittelwert im leeren Tal dazwischen (spike/FINDINGS.md); eine multimodale
# Verteilung laesst sich nicht in ihren Mittelwert destillieren
# (docs/engine-forschungsergebnis.md, "Ist das Zwei-Motoren-Prinzip noch richtig?").
# Beide Funktionen bleiben deshalb Zeile fuer Zeile unangetastet - `npm run parity`,
# `npm run oracle` und der Mittelfeld-Pfad haengen daran.
#
# Die neue Frage ist eine ANDERE: erzeugt der Browser-Schwarm mit N=200 dasselbe
# Arten-Frequenzspektrum wie ein Orakel-Schwarm mit sehr grossem N? Dafuer braucht der
# Pruefstand (a) die END-POPULATION statt eines Mittelwerts und (b) dieselbe Dynamik wie
# die Live-App, inklusive frequenzabhaengiger Nischen-Konkurrenz - sonst vergleicht man
# zwei verschiedene Modelle statt zweier Populationsgroessen desselben Modells.
#
# Das ist damit auch keine "Ground Truth" mehr im alten Sinn, sondern die
# GROSS-N-GRENZE des Modells, das die App bei N=200 laeuft, in einer unabhaengigen
# zweiten Implementierung (Python vs. TypeScript, eigener RNG). Zwei Fehlerarten
# fallen gleichzeitig auf: ein N=200, das zu klein ist (endliche Population verzerrt das
# Spektrum), und ein Implementierungsfehler auf einer der beiden Seiten.
#
# Spiegel von world/population.ts (Population.weights/reproduceWith) - bewusst
# NICHT bitgleich: die RNG-Stroeme sind verschieden, der Vergleich ist statistisch
# (Formhaeufigkeiten), nicht deterministisch. Was uebereinstimmen MUSS, ist die
# Rechenvorschrift.

# Defaults spiegeln app/index.html's SWARM-Objekt (die Live-Konfiguration seit
# Migrations-Stufe 4) - nur `size` ist hier bewusst gross, das ist der Zweck.
DEFAULT_SWARM: Dict = {
    "size": 2000,
    "mutationSd": 0.05,
    "selPower": 2.0,
    "recombProb": 0.5,
    # size, limb, photo, mobility, armor, wing, biolum, filter (Indizes in TRAITS)
    "niche": [1, 2, 5, 6, 4, 8, 9, 15],
    "sigmaC": 0.22,
    "sigmaK": 50.0,
    "kCenter": 0.5,
    "founderSpread": "uniform",
    "startSpread": 0.03,
}


def _swarm_weights(
    pop: List[List[float]],
    env: Dict[str, float],
    phys: Dict,
    cfg: Dict,
) -> List[float]:
    """Reproduktions-Gewichte: Fitness^selPower * K(x) / Konkurrenzdichte.

    Zeile fuer Zeile dieselbe Vorschrift wie Population.weights() in
    world/population.ts (mehrdimensionaler Kernel, Migrations-Stufe 3): die Dichte
    aehnlich gelegener Konkurrenten wird ueber die euklidische Distanz UEBER ALLE
    Nischen-Achsen gemessen, inklusive des Selbst-Terms exp(0)=1, und auf N normiert -
    dadurch ist der Term N-unabhaengig und der Vergleich zweier Populationsgroessen
    ueberhaupt sinnvoll.
    """
    sel_power = cfg["selPower"]
    base = [fitness(ind, env, phys) ** sel_power for ind in pop]
    axes = cfg.get("niche") or []
    if not axes:
        return base

    n = len(pop)
    sigma_c = cfg["sigmaC"]
    sigma_k = cfg["sigmaK"]
    k_center = cfg["kCenter"]
    inv2c2 = 1.0 / (2.0 * sigma_c * sigma_c)
    inv2k2 = 1.0 / (2.0 * sigma_k * sigma_k)

    # Nur die Nischen-Achsen extrahieren: math.dist() rechnet die 8-dimensionale
    # Distanz in C statt in einer Python-Schleife (gemessen 2.25x schneller als die
    # ausgeschriebene Schleife, bitgleiches Ergebnis) - bei O(N^2) Paaren je Generation
    # ist das der Unterschied zwischen 2.6 min und 6 min je Lauf bei N=2000.
    cols = [[ind[a] for a in axes] for ind in pop]
    center = [k_center] * len(axes)

    dens = [1.0] * n  # Selbst-Term exp(0) = 1
    for i in range(n):
        ci = cols[i]
        for j in range(i + 1, n):
            d = math.dist(ci, cols[j])
            e = math.exp(-d * d * inv2c2)
            dens[i] += e
            dens[j] += e

    out = [0.0] * n
    for i in range(n):
        dk = math.dist(cols[i], center)
        k = math.exp(-dk * dk * inv2k2)
        out[i] = base[i] * k / (dens[i] / n + 1e-9)
    return out


def run_swarm_once(
    env: Dict[str, float],
    generations: int,
    phys: Dict,
    rng: random.Random,
    cfg: Dict | None = None,
    start: float = 0.5,
) -> List[List[float]]:
    """Ein Schwarm-Lauf. Gibt die END-POPULATION (alle Genome) zurueck, NICHT deren
    Mittelwert - das ist der ganze Punkt dieser Funktion."""
    c = dict(DEFAULT_SWARM)
    if cfg:
        c.update(cfg)
    n_genes = len(TRAITS)
    size = c["size"]
    mut_sd = c["mutationSd"]
    recomb = c["recombProb"]

    if c["founderSpread"] == "uniform":
        # Gestreute Gruender (Migrations-Stufe 3): oeffnet alle Einzugsgebiete
        # gleichzeitig statt nur das um `start`.
        pop = [[rng.random() for _ in range(n_genes)] for _ in range(size)]
    else:
        spread = c["startSpread"]
        pop = [
            [_clamp01(start + rng.gauss(0, spread)) for _ in range(n_genes)]
            for _ in range(size)
        ]

    gauss = rng.gauss
    rand = rng.random
    for _ in range(generations):
        w = _swarm_weights(pop, env, phys, c)
        total = sum(w)
        if total > 0:
            parents_a = rng.choices(pop, weights=w, k=size)
            parents_b = rng.choices(pop, weights=w, k=size)
        else:
            # Spiegel des Fallbacks in Population.reproduceWith(): ohne Gewicht wird
            # gleichverteilt gezogen (sonst stirbt der Lauf an einer Division).
            parents_a = [pop[int(rand() * size)] for _ in range(size)]
            parents_b = [pop[int(rand() * size)] for _ in range(size)]
        new_pop: List[List[float]] = []
        for pa, pb in zip(parents_a, parents_b):
            child = [0.0] * n_genes
            for g in range(n_genes):
                base = pb[g] if rand() < recomb else pa[g]
                child[g] = _clamp01(base + gauss(0, mut_sd))
            new_pop.append(child)
        pop = new_pop

    return pop


def run_swarm(
    env: Dict[str, float],
    generations: int,
    phys: Dict,
    seeds: int = 5,
    base_seed: int = 12345,
    cfg: Dict | None = None,
) -> List[List[List[float]]]:
    """Mehrere unabhaengige Schwarm-Laeufe derselben Umwelt.

    Gibt eine LISTE von End-Populationen zurueck (eine je Seed) und mittelt bewusst
    NICHT: die Streuung ueber Seeds ist Teil des zu vergleichenden Signals (welche
    Formen entstehen wie oft?), kein Rauschen, das man wegmitteln will.
    """
    return [
        run_swarm_once(env, generations, phys, random.Random(base_seed + s * 7919), cfg)
        for s in range(seeds)
    ]
