import type { Categories, Course, Period } from "@malla-udd/shared";

export interface YearBand {
  label: string;
  startColumn: number;
  columnCount: number;
}

export interface GridColumn {
  period: Period;
  headerLabel: string;
  semester: number;
}

const ROMAN = [
  "",
  "I",
  "II",
  "III",
  "IV",
  "V",
  "VI",
  "VII",
  "VIII",
  "IX",
  "X",
  "XI",
  "XII",
];

export function toRoman(n: number): string {
  return ROMAN[n] ?? String(n);
}

export function buildGridColumns(periods: Period[]): GridColumn[] {
  return [...periods]
    .sort((a, b) => a.order - b.order)
    .map((period) => ({
      period,
      semester: period.semester,
      headerLabel: formatPeriodHeader(period),
    }));
}

function formatPeriodHeader(period: Period): string {
  if (period.type === "semester") {
    return toRoman(period.semester);
  }

  return String(period.trimester);
}

/** Franjas anuales: pares de semestres (1–2, 3–4) o tríos de trimestres por semestre académico. */
export function buildYearBands(columns: GridColumn[]): YearBand[] {
  const bands: YearBand[] = [];
  let index = 0;

  while (index < columns.length) {
    const column = columns[index]!;
    const year = Math.ceil(column.semester / 2);

    if (column.period.type === "semester") {
      const next = columns[index + 1];
      const paired =
        next?.period.type === "semester" &&
        next.semester === column.semester + 1;

      if (paired) {
        bands.push({
          label: `Año ${year}`,
          startColumn: index,
          columnCount: 2,
        });
        index += 2;
      } else {
        bands.push({
          label: `Año ${year} ½`,
          startColumn: index,
          columnCount: 1,
        });
        index += 1;
      }
      continue;
    }

    let count = 0;
    while (
      index + count < columns.length &&
      columns[index + count]!.period.type === "trimester" &&
      columns[index + count]!.semester === column.semester
    ) {
      count++;
    }
    bands.push({
      label: `Año ${year}`,
      startColumn: index,
      columnCount: count,
    });
    index += count;
  }

  return bands;
}

export function maxCoursesInColumn(columns: GridColumn[]): number {
  return Math.max(1, ...columns.map((col) => col.period.courses.length));
}

export function getCategoryColor(
  categories: Categories,
  categoryCode: string,
): string {
  return categories[categoryCode]?.color ?? "#607d8b";
}

export type { Course, Period, Categories };
