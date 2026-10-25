// Gleitkomma-Typ des Kerns. Board: float (C3 hat keine FPU, float ist deutlich
// billiger als double). Nativer Paritätstest: double -> bit-nah an der TS-Engine.
#pragma once

#ifndef EVO_REAL
#define EVO_REAL float
#endif

typedef EVO_REAL real;
