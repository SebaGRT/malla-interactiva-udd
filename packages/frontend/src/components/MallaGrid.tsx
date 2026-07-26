import { memo, useMemo, type CSSProperties } from "react";
import type {
  Categories,
  CourseEligibility,
  Period,
  PeriodSelectionState,
} from "@malla-udd/shared";
import { getPeriodSelectionState } from "@malla-udd/shared";
import { CourseCard } from "./CourseCard.js";
import {
  buildGridColumns,
  buildYearBands,
  getCategoryColor,
  maxCoursesInColumn,
  type GridColumn,
} from "../utils/grid.js";
import { textColorForBackground } from "../utils/color.js";

interface MallaGridProps {
  periods: Period[];
  categories: Categories;
  careerName: string;
  approvedCodes: Set<string>;
  eligibilityByCode: Map<string, CourseEligibility>;
  onToggleCourse: (code: string) => void;
  onTogglePeriod: (periodId: string) => void;
}

export function MallaGrid({
  periods,
  categories,
  careerName,
  approvedCodes,
  eligibilityByCode,
  onToggleCourse,
  onTogglePeriod,
}: MallaGridProps) {
  const columns = useMemo(() => buildGridColumns(periods), [periods]);
  const yearBands = useMemo(() => buildYearBands(columns), [columns]);
  const maxRows = useMemo(() => maxCoursesInColumn(columns), [columns]);

  const categoryColors = useMemo(() => {
    const map = new Map<string, { accent: string; foreground: string }>();

    for (const categoryCode of Object.keys(categories)) {
      const accent = getCategoryColor(categories, categoryCode);
      map.set(categoryCode, {
        accent,
        foreground: textColorForBackground(accent),
      });
    }

    return map;
  }, [categories]);

  const periodSelectionById = useMemo(() => {
    const map = new Map<string, PeriodSelectionState>();

    for (const column of columns) {
      map.set(
        column.period.id,
        getPeriodSelectionState(column.period, approvedCodes),
      );
    }

    return map;
  }, [approvedCodes, columns]);

  return (
    <section className="malla-grid" aria-label={`Malla ${careerName}`}>
      <div className="malla-grid__scroll">
        <div
          className="malla-grid__canvas"
          style={
            {
              "--malla-columns": columns.length,
              "--malla-rows": maxRows,
            } as CSSProperties
          }
        >
          <div className="malla-grid__year-row" role="row">
            {yearBands.map((band) => (
              <div
                key={`${band.startColumn}-${band.label}`}
                className="malla-grid__year-band"
                style={{
                  gridColumn: `${band.startColumn + 1} / span ${band.columnCount}`,
                }}
              >
                {band.label}
              </div>
            ))}
          </div>

          <div className="malla-grid__period-row" role="row">
            {columns.map((column, index) => (
              <PeriodHeader
                key={column.period.id}
                column={column}
                selectionState={
                  periodSelectionById.get(column.period.id) ?? "none"
                }
                isFirstTrimester={
                  column.period.type === "trimester" &&
                  columns[index - 1]?.period.type === "semester"
                }
                onTogglePeriod={onTogglePeriod}
              />
            ))}
          </div>

          <div className="malla-grid__courses" role="rowgroup">
            {columns.map((column) => (
              <div
                key={column.period.id}
                className="malla-grid__column"
                aria-label={column.period.label}
              >
                {column.period.courses.map((course) => {
                  const eligibility = eligibilityByCode.get(course.code);
                  const status = eligibility?.status ?? "available";
                  const colors = categoryColors.get(course.category) ?? {
                    accent: "#607d8b",
                    foreground: textColorForBackground("#607d8b"),
                  };

                  return (
                    <CourseCard
                      key={course.code}
                      course={course}
                      accent={colors.accent}
                      foreground={colors.foreground}
                      status={status}
                      missingPrerequisites={eligibility?.missingPrerequisites}
                      onToggleCourse={onToggleCourse}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

const PeriodHeader = memo(function PeriodHeader({
  column,
  selectionState,
  isFirstTrimester,
  onTogglePeriod,
}: {
  column: GridColumn;
  selectionState: PeriodSelectionState;
  isFirstTrimester: boolean;
  onTogglePeriod: (periodId: string) => void;
}) {
  const { period, headerLabel } = column;
  const isSemester = period.type === "semester";
  const hasCourses = period.courses.length > 0;

  const actionLabel =
    selectionState === "all"
      ? "Deseleccionar todos los ramos"
      : "Seleccionar todos los ramos disponibles";

  return (
    <button
      type="button"
      className={[
        "malla-grid__period-header",
        isSemester
          ? "malla-grid__period-header--semester"
          : "malla-grid__period-header--trimester",
        isFirstTrimester && "malla-grid__period-header--trimester-start",
        selectionState === "all" && "malla-grid__period-header--all",
        selectionState === "partial" && "malla-grid__period-header--partial",
      ]
        .filter(Boolean)
        .join(" ")}
      title={`${period.label} — ${actionLabel}`}
      aria-label={`${period.label}. ${actionLabel}`}
      aria-pressed={selectionState === "all"}
      disabled={!hasCourses}
      onClick={() => onTogglePeriod(period.id)}
    >
      <span className="malla-grid__period-kind">
        {isSemester ? "Semestre" : "Trimestre"}
      </span>
      <span className="malla-grid__period-value">{headerLabel}</span>
    </button>
  );
});
