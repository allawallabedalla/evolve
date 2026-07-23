# Umbau-Roadmap — vom Einzel-Pet zur lebenden, emergenten Welt

**Ziel (Vision).** Eine lebende Welt aus vielen Orten, in der Evolution in jedem Ort
ihren eigenen offenen Weg geht. Der Spieler gestaltet mit **Isolation, Verbindung,
Lebensräumen und Katastrophen** (der „Veränderung"-Knopf) und *provoziert* oder
*resettet* Entwicklungen. Ein sich ständig verzweigender Baum des Lebens entsteht
**von selbst** — glaubwürdig genug, um Staunen über die Natur zu wecken. Reinzoomen =
dein Tamagotchi (eine Linie, die du benennst und liebst); rauszoomen = der emergente
Baum des Lebens.

**Kern-Prinzip.** *Emergenz statt Autorenschaft.* Arten/Formen/Rarität sind **Cluster**
in einer evolvierenden Population — nicht handgeschriebene `classify()`-Schwellen.
Vielfalt *entsteht aus Mechanik*, nicht aus Code. (Begründung + Beweis: `spike/FINDINGS.md`.)

---

## Eiserne Leitplanken (gelten für JEDEN Schritt)

1. **Die Live-App bleibt unangetastet.** `app/index.html` (das ausgelieferte Spiel)
   wird in diesem Umbau NICHT verändert. Der neue Kern wächst **daneben** (headless,
   testbar), bis er reif ist. Kein Deploy von Prototyp-Code.
2. **Der Prüfstand bleibt das Gewissen.** Zwei Ebenen: **Dynamik-Treue** (die
   TS-Population muss sich wie das Python-Orakel verhalten) und **Realitäts-Treue**
   (emergente Muster gegen reale Makro-Muster: Arten-Areal, Radiation-nach-Aussterben).
3. **Jeder Schritt ist testbar & committet.** Kein Schritt ohne Test + kurze Doku.
4. **Emergenz vor Autorenschaft.** Bei jedem Feature: *entsteht es aus den Mechanismen,
   oder schreibe ich es hin?* Ersteres bauen, Letzteres meiden.
5. **Zurückhaltung.** Nicht die ~800 Katalog-Faktoren bauen — den kleinsten
   generativen Kern, dessen Wechselwirkung sie hervorbringt (`docs/faktoren-katalog.md`).

---

## „Veränderung"-Informationsarchitektur (fürs spätere UI, jetzt als Backend-Leitbild)

Drei Dinge sauber getrennt — nur das erste ist „Veränderung":

- **🔧 Veränderung** = was der Spieler der Welt *antut* (Hebel). Ein ruhiger Knopf,
  darunter Kategorien (Spieler-Verben), darunter Details (die Faktoren).
  - **Zustand ändern** = *Regler* (dauerhaft; „provozieren") — z. B. Temperatur, Feuchte.
  - **Ereignis auslösen** = *Knopf* (einmalig; „resetten") — z. B. Vulkan, Flut, Bottleneck.
  - Startet **winzig**, Tiefe wird **progressiv freigeschaltet** (Neugier, kein Zwang).
- **👁️ Chronik / Baum des Lebens** = was *entsteht* (Arten, Verzweigungen, Aussterben) —
  wird *beobachtet*, nicht geschaltet. (Das Genbuch, erwachsen geworden.)
- **⚙️ Welt-Gesetze** = Konstanten des Universums (Mutationsrate, gibt es Sex?, …) —
  einmal bei Welt-Erschaffung gesetzt.

Die Backend-API dieses Umbaus spiegelt das: `setPlaceParam()` (Zustand),
`triggerEvent()` (Ereignis), `connect()/isolate()` (Raum) — Beobachtung = Cluster/Chronik.

---

## Der nachhaltige Pfad — Stufen (jede für sich ein fertiges Stück)

| Stufe | Was | Ebene (Katalog) | Status |
|---|---|---|---|
| **1** | **Population unter der Haube** — N-Agenten statt *einem* Mittelwert; Art = Cluster | Mechanik | **dieser Umbau** |
| **2** | **Frequenzabhängige Konkurrenz** — Koexistenz & Branching (Spike produktiv) | Mechanik/Biotik | **dieser Umbau** |
| **3** | **Metapopulation** — mehrere Orte, Isolation/Migration, Founder | Raum | **dieser Umbau** |
| **4** | **Veränderung-API** — Regler + Ereignisse + Katastrophen; Realitäts-Check | Ort/Welt-Event | **dieser Umbau** |
| 5 | Biotische Interaktionen zwischen koexistierenden Arten (Räuber emergent) | Biotik | später |
| 6 | Emergente Benennung/Darstellung; `classify()`/Handkunst ablösen | — | später |
| 7 | UI: „Veränderung"-Knopf, Zoom Pet↔Welt, Chronik | — | später |
| 8 | Anthropogene Spät-Ebene (optional) | Anthropogen | später |

Diese Roadmap deckt **Stufen 1–4** ab — das headless Fundament. UI (7) und
Biotik/Emergenz-Feinschliff (5–6) kommen darauf, wenn der Kern trägt.

---

## Arbeitspakete (das arbeite ich sukzessive ab)

### Phase 0 — Roadmap + Architektur *(dieses Dokument + `architecture-v2.md`)*
- **DoD:** Plan, Leitplanken, IA und Population-first-Design schriftlich fixiert.

### Phase 1 — Populations-Kern (`world/population.ts`, TS)
- N-Agenten-Population; `step(env)` = Fitness-proportionale Selektion (`fitness^selPower`)
  + Rekombination + gaußsche Mutation + Drift (endliche Größe). Seed-bar/deterministisch.
- Nutzt die **validierte** `engine/fitness` (gleiche Physik).
- **Test (Dynamik-Treue):** ohne Konkurrenz konvergiert die Population auf denselben
  Attraktor wie die Mean-Field-Engine / das Orakel (± Toleranz) über mehrere Umwelten.
- **DoD:** grüner `pop-check`, kurze Doku.

### Phase 2 — Frequenzabhängige Konkurrenz + Cluster
- Konkurrenz-Kernel `w_i = f_i^s · K(x_i) / n_i` (aus `spike/FINDINGS.md`), Achse + σ_c + σ_K
  konfigurierbar. Cluster-Erkennung auf der Population → **emergente Arten-Zahl**.
- **Test (Emergenz):** ohne Konkurrenz → 1 Cluster; σ_c < σ_K → Aufspaltung (≥2 Cluster).
- **DoD:** grüner `branching-check`, Doku.

### Phase 3 — Metapopulation (`world/world.ts`)
- Mehrere `Place` (Population + Umwelt); Migrations-/Isolations-Matrix; Founder-Kolonisation.
- **Test (Raum):** isolierte Orte mit verschiedenen Umwelten *divergieren*; verbundene
  Orte *homogenisieren*; Katastrophe + Wieder-Besiedlung = Founder-Effekt (Diversität↓).
- **DoD:** grüner `world-check`, Doku.

### Phase 4 — Veränderung-Hebel + Ereignisse + Demo + Realitäts-Check
- API: `setPlaceParam` (Zustand), `triggerEvent` (Vulkan/Dürre/Bottleneck/Klimawandel),
  `connect`/`isolate`. CLI `world-demo` zeigt eine kleine Welt über Zeit inkl. Katastrophe.
- **Realitäts-Check (v2):** emergente Makro-Muster plausibel? (Arten-Areal: größere/mehr
  verbundene Welt → mehr Arten; Radiation nach Katastrophe: Arten-Zahl erholt/steigt.)
- **DoD:** `world-demo` läuft, `ecology-v2`-Check grün, `resume.md` + Roadmap-Status aktualisiert.

---

## Fortschritt

- [x] **Phase 0** — Roadmap + Architektur (`docs/rebuild-roadmap.md`, `architecture-v2.md`)
- [x] **Phase 1** — Populations-Kern (`world/population.ts`) · `npm run pop-check` (|TS−Orakel| = 0,013)
- [x] **Phase 2** — Frequenzabh. Konkurrenz + Cluster (`world/cluster.ts`) · `npm run branching-check` (Kontrolle 1 Modus, Konkurrenz 2 Modi, 2,9× Varianz)
- [x] **Phase 3** — Metapopulation (`world/world.ts`) · `npm run world-check` (Divergenz 0,87 vs. Homogenisierung 0,31; Founder/Katastrophe → 0)
- [x] **Phase 4** — Veränderung-Hebel + Demo + Realitäts-Check · `npm run world-demo`, `node tools/world-ecology-check.mjs` (C1 Arten-Areal, C2 Homogenisierung, C3 Gelegenheit ✓)

**Fundament (Stufen 1–4) steht — headless, getestet, dokumentiert. Live-App unberührt.**

Prototyp-Dateien: `world/{population,cluster,world,describe}.ts`, `cli/world-demo.ts`,
`tools/{pop,branching,world}-check.mjs`, `tools/world-ecology-check.mjs`.

### Weitere Stufen
- [x] **Stufe 5** — biotische Interaktion: Räuber-Beute-Koevolution (`world/coevolution.ts`).
  `npm run coevolution-check`: mit Räubern **Red Queen** (kein Stillstand, zeitl. SD 10× höher
  als ohne), endogener Räuberdruck 0,28. Praedation ist jetzt *emergent*, kein Regler mehr.
- [ ] Stufe 6: emergente Benennung/Darstellung; `describe.ts` → volles prozedurales Naming; `classify()` ablösen.
- Stufe 7: UI — „Veränderung"-Knopf (Zustand-Regler vs. Ereignis-Knopf), Zoom Pet↔Welt, Chronik.
- Anschluss an die Live-App: den Kern hinter die bestehende UX schieben (ein Ort = die heutige Ansicht), dann Karte aufmachen.
