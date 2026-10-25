// Gleitkomma-Typ des Kerns. Board: float (C3 hat keine FPU, float ist deutlich
// billiger als double). Nativer Paritätstest: double -> bit-nah an der TS-Engine.
#pragma once

#ifndef EVO_REAL
#define EVO_REAL float
#endif

typedef EVO_REAL real;

// 1 = Konkurrenz-Kernel in Ganzzahlen + exp-Tabelle (Board), 0 = exakte Form wie TS
#ifndef EVO_FAST_KERNEL
#define EVO_FAST_KERNEL 0
#endif
