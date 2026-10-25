// Arten im Schwarm finden – Port von selectionWeights() und clusters() aus
// world/cluster.ts, so wie readSwarm() in app/index.html sie aufruft.
//
// Warum nicht einfach das Mittelwert-Genom: spaltet sich der Schwarm in zwei
// Formen, liegt der Mittelwert im leeren Tal dazwischen („Protist · generalistisch“).
#pragma once
#include "evo_real.h"
#include "fitness.h"
#include "physics.h"
#include "population.h"

struct Species {
  int size;
  real fraction;
  real centroid[phys::NUM_GENES];
};

// Selektions-Gewichte je Gen: |∂fitness/∂g| am Mittelwert, normiert, Boden 0.15
void selectionWeights(const real *mean, const Environment &env, real *w);

// Greedy-Dichte-Clustering im gewichteten Genom-Raum. Liefert die Arten über
// minFraction, größte zuerst; Rückgabe = Anzahl (höchstens maxOut).
// Abstände in Ganzzahlen (Q10) – der C3 hat keine FPU.
int clusters(const Population &pop, const real *weights, real radius, real minFraction, Species *out, int maxOut);
