// Tabla de ponderación para 3 bandas
export const WEIGHTING_TABLE: Record<number, number> = {
  28: 1.00,
  26: 1.08,
  24: 1.17,
  22: 1.27,
  20: 1.40,
  18: 1.56
};

export const CATEGORY_TARGETS: Record<string, number> = {
  MASTER: 28,
  FIRST: 26,
  SECOND: 24,
  THIRD: 22,
  FOURTH: 20,
  FIFTH_A: 18,
  FIFTH_B: 18
};

export const CATEGORY_AVERAGE_RANGES: Record<string, { min: number, max: number }> = {
  MASTER: { min: 0.901, max: 2.500 },
  FIRST: { min: 0.751, max: 0.900 },
  SECOND: { min: 0.601, max: 0.750 },
  THIRD: { min: 0.451, max: 0.600 },
  FOURTH: { min: 0.351, max: 0.450 },
  FIFTH_A: { min: 0.000, max: 0.350 },
  FIFTH_B: { min: 0.000, max: 0.350 }
};
