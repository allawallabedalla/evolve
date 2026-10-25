// mulberry32 – bit-exakt zu world/population.ts (uint32-Arithmetik statt Math.imul).
#pragma once
#include <stdint.h>

#include "evo_real.h"

struct Mulberry32 {
  uint32_t a;

  explicit Mulberry32(uint32_t seed) : a(seed) {}

  uint32_t next_u32() {
    a += 0x6d2b79f5u;
    uint32_t t = (a ^ (a >> 15)) * (1u | a);
    t = (t + ((t ^ (t >> 7)) * (61u | t))) ^ t;
    return t ^ (t >> 14);
  }

  // [0, 1) wie JS: u32 / 2^32 (Multiplikation mit 2^-32 ist in double exakt).
  // float hat nur 24 Bit Mantisse – u32 würde bis 2^32 aufrunden und 1.0 liefern,
  // darum dort die oberen 24 Bit.
  real next() {
    uint32_t u = next_u32();
    if (sizeof(real) < sizeof(double)) return real(u >> 8) * real(1.0 / 16777216.0);
    return real(u) * real(1.0 / 4294967296.0);
  }
};
