export interface CategoryAccent {
  source: string;
  light: string;
  dark: string;
}

/**
 * Curriculum colors identify a category, but the source color is not
 * guaranteed to be a usable UI accent in both appearances. Keep the source
 * untouched and use these appearance-specific display values for stripes,
 * swatches, and progress fills.
 */
const CATEGORY_ACCENTS: Record<string, Omit<CategoryAccent, "source">> = {
  "#1a237e": {
    light: "oklch(0.33 0.12 264)",
    dark: "oklch(0.74 0.13 264)",
  },
  "#00bcd4": {
    light: "oklch(0.5 0.14 195)",
    dark: "oklch(0.76 0.14 195)",
  },
  "#78909c": {
    light: "oklch(0.58 0.07 220)",
    dark: "oklch(0.72 0.06 220)",
  },
  "#5c6bc0": {
    light: "oklch(0.5 0.12 275)",
    dark: "oklch(0.74 0.12 275)",
  },
  "#1565c0": {
    light: "oklch(0.48 0.14 255)",
    dark: "oklch(0.72 0.14 255)",
  },
  "#b0bec5": {
    light: "oklch(0.5 0.05 220)",
    dark: "oklch(0.78 0.04 220)",
  },
};

export function getCategoryAccentPair(hex: string): CategoryAccent {
  const source = hex.startsWith("#") ? hex : `#${hex}`;
  const normalized = source.toLowerCase();
  const known = CATEGORY_ACCENTS[normalized];

  return {
    source,
    light: known?.light ?? source,
    dark:
      known?.dark ??
      `color-mix(in oklch, ${source} 65%, oklch(0.94 0.01 250))`,
  };
}
