# Playtest — Persona "neugieriger Laie"

Getestet am 2026-07-22. Rund 45 Läufe: alle fertigen Szenarien + viele freie Umwelten
(Extreme, feine Unterschiede, kaputt-machen-Versuche). Keine Biologie-, keine Spiel-Vorkenntnisse.

## Spieleindruck

Es macht überraschend Spaß, an den Reglern zu drehen und zu sehen, was für ein Vieh dabei
rauskommt — das kleine Emoji + der Archetyp-Name ("🐺 Aktiver Grossjaeger", "🐢 Gepanzertes
Beutetier") sind der Moment, auf den ich jedes Mal warte. Die "Ursache"-Sätze machen aus einer
Tabelle plötzlich eine kleine Geschichte, das mochte ich sehr. ABER: es fühlt sich eher wie ein
sehr charmantes Kommandozeilen-Werkzeug an als wie ein Spiel — ohne Anleitung, ohne Ziel, ohne
Fortschritt, und beim ersten Start weiß ich gar nicht, dass ich frei herumbasteln darf.

## Konkrete Beobachtungen

- **Das große Aha-Erlebnis war der Wolf.** `"" 0.6 0.05 1 0.9 0.5 0.5 80` (warm, kaum Räuber,
  Nahrung voll, hoch gelegen) → 🐺 **Aktiver Grossjaeger**, "riesig", lange Laufbeine, Fress-/
  Greifwerkzeuge, Körpergröße 0.50→0.86. Den musste ich richtig SUCHEN — vorher kam gefühlt
  immer nur die 🐢 Schildkröte. Als er endlich da war, habe ich mich gefreut. Das ist der beste
  Moment im ganzen Spiel, aber er ist reiner Zufall/Glück, weil mir keiner sagt, wie ich dahin komme.
- **Extrem "alles auf max"** (`1 1 1 1 1 1`) → 🌳 **Verholzter Baum** mit Rinde + Dornen,
  Photosynthese 0.97, Stützgewebe 0.98. Fand ich cool und logisch (viel Licht → Pflanze).
- **Extrem "alles auf null"** (`0 0 0 0 0 0`) → 🦠 Mischotroph, ALLE acht Balken exakt auf 0.50,
  Text: "Kaum Veraenderung". Fühlt sich an wie ein kaputter/leerer Lauf — ich dachte kurz, ich
  hätte was falsch gemacht. Antiklimaktisch.
- **Die Schildkröte dominiert.** In meinem 3×3×3-Durchlauf (Temp/Räuber/Nahrung) kam bei
  mittlerer bis hoher Nahrung + mittleren/vielen Räubern fast immer 🐢 "Gepanzertes Beutetier".
  Nur wenig Räuber → 🐭 "Kleines flinkes Tier", Kälte → 🦊 "Fell-Warmblueter". Insgesamt fand
  ich trotzdem 9 verschiedene Wesen (🦊🐭🐢 Generalist 🦠 🌳🪴🐺 + 🦣 "Gepanzerter Koloss" bei
  Höhe 0.9). Das ist mehr Vielfalt als ich erst dachte — nur die Verteilung ist schief.
- **Kipppunkte sind unsichtbar, aber cool wenn man sie findet.** Bei sonst identischen Reglern:
  Nahrung 0.55 → 🐭 flinkes Tier, Nahrung 0.60 → 🐢 Schildkröte. So ein kleiner Sprung kippt das
  ganze Wesen — das ist eigentlich ein toller Spielmoment, aber ich stolpere nur zufällig drüber.
- **Kaputt machen ging nicht wirklich** (im guten Sinn robust): `gens 0` und `gens 1` laufen
  durch (Wesen bleibt Mischotroph), `temp 5` und `temp -1` stürzen nicht ab. ABER: die krummen
  Werte werden roh angezeigt ("Temp 5.00", "Temp -1.00" → trotzdem "kalt") statt begrenzt oder
  mit Hinweis — das sieht nach Fehler aus.
- **Generationen wirken langsam.** Gleiche Umwelt mit 5 vs 500 Generationen gibt spürbar andere
  Werte (bei 500 ist Panzerung noch 0.81, wo sie sonst abgebaut wird). Interessant, aber nirgends
  erklärt, dass die Generationenzahl so viel ausmacht.

## Was verwirrt / fehlt

- **Kein Einstieg.** `node dist/cli/demo.js` ohne Argumente, `... help` und sogar ein Tippfehler
  im Szenarionamen (`"Eiszet"`) starten ALLE stillschweigend die "Eiszeit". Kein Menü, keine
  Hilfe, keine Fehlermeldung. Als Laie hätte ich nie erfahren, dass ich sieben Zahlen selbst
  eingeben darf — das steht nur im Code, nicht im Spiel.
- **Der Validitäts-Balken verwirrt am meisten.** Er steht bei JEDEM Lauf auf exakt 80.0%, egal
  was ich einstelle (min, max, Wolf, alles getestet — immer 80.0%). Als Laie lese ich das als
  "mein Wesen ist zu 80% gültig/gut" und wundere mich, dass ich es nie verbessern kann. Es ist
  in Wahrheit eine Qualitätsnote des Modells, nicht meines Tieres — das gehört nicht in die
  Ergebnisansicht des Spielers oder muss ganz anders beschriftet werden.
- **Widersprüchliche Ursachen beim Wolf.** Gleichzeitig: "Gliedmassenlaenge steigt — schwer
  erreichbare Nahrung" UND "Mobilitaet steigt — erreichbares Futter". Erst schwer erreichbar,
  dann erreichbar? Für mich als Laie klingt das, als würde sich das Spiel selbst widersprechen.
- **"Hitze" schon bei Temp 0.6.** Da hieß es "Hitze macht Isolation zur Last" — 0.6 fühlt sich
  für mich nicht nach "heiß" an, eher nach lauwarm. Die Wortwahl passt nicht immer zur Zahl.
- **Textfehler:** Bei Mischotroph/Übergangsform steht im Bauplan "asymmetrischsymmetrisch"
  (z.B. "alles auf null", "Karge Hoehe"). Das liest sich wie ein Bug und untergräbt Vertrauen.
- **Keine Bindung übers Wesen hinaus.** Jeder Lauf ist eigenständig, mein Tier hat keinen Namen,
  keine Historie, ich kann es nicht "behalten" oder zwei nebeneinander vergleichen. Ich mochte
  den Wolf — aber im nächsten Befehl ist er einfach weg.
- **Keine Regler-Erinnerung.** Ich muss mir die sieben Zahlen + Reihenfolge (Temp, Räuber,
  Nahrung, Höhe, Licht, Wasser, Gen) selbst merken. Beim Basteln habe ich ständig verrutscht.

## Ideen fürs Backlog

1. **Startbildschirm/Hilfe bei fehlenden Argumenten.** Ohne Args (oder bei `help`) ein kurzes
   Menü zeigen: Liste der Szenarien + die freie Syntax mit Regler-Reihenfolge + 1 Beispiel.
   Nicht stillschweigend "Eiszeit" starten.
2. **Unbekannten Szenarionamen abfangen.** `"Eiszet"` → "Kenne ich nicht. Meintest du 'Eiszeit'?
   Verfügbar: ...". Nie kommentarlos etwas anderes ausführen.
3. **Validitäts-Balken aus der Spieleransicht entfernen** oder klar umbenennen (z.B. in eine
   `--debug`-Ausgabe). Für den Spieler wirkt eine fixe 80%-Note wie ein Bewertungssystem, das
   er nie beeinflussen kann. Wenn eine Bewertung gewünscht ist, dann eine, die sich pro Wesen ändert.
4. **Ursachen entkoppeln / entwidersprechen.** Wenn Reichweite (lange Gliedmaßen wegen "schwer
   erreichbar") und Mobilität (wegen "erreichbar") zusammen auftreten, die Begründungen
   zusammenfassen statt sich widersprechen zu lassen ("Nahrung ist reichlich, aber hoch gelegen
   → längere Beine + aktive Jagd").
5. **"asymmetrischsymmetrisch" fixen** — vermutlich wird ein Suffix doppelt angehängt.
6. **Kipppunkte sichtbar/spielbar machen.** Nach einem Lauf ein Hinweis wie: "Schon bei Nahrung
   0.60 statt 0.55 wäre aus dem flinken Tier eine Schildkröte geworden." Das macht aus der
   unsichtbaren Mechanik einen Grund für den nächsten Klick.
7. **Tier benennen & sammeln.** Jedem Ergebnis einen zufälligen Namen geben und optional 2 Läufe
   nebeneinander anzeigen (Vergleich). Das würde die Bindung enorm erhöhen — ich wollte "meinen
   Wolf" behalten.
8. **Regler-Werte klemmen + Hinweis.** Eingaben außerhalb 0..1 auf den gültigen Bereich begrenzen
   und das sagen ("Temp auf 1.00 begrenzt"), statt "Temp 5.00 / -1.00" roh anzuzeigen.
9. **Kurz-Tipp bei "Kaum Veraenderung".** Statt eines leeren, ratlosen Ergebnisses ein Satz wie
   "Diese Umwelt ist zu ausgeglichen — dreh einen Regler stärker auf, um Druck zu erzeugen."
10. **Wort-Skala an die Zahl koppeln.** "heiss" erst ab ~0.75, dazwischen "warm/mild", damit
    Begründungstexte ("Hitze") und angezeigte Zahl (0.6) zusammenpassen.
