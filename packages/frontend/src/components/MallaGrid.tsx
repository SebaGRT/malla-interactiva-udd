import {
  memo,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
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
import { useMediaQuery } from "../hooks/useMediaQuery.js";

interface MallaGridProps {
  periods: Period[];
  categories: Categories;
  careerName: string;
  approvedCodes: Set<string>;
  eligibilityByCode: Map<string, CourseEligibility>;
  onToggleCourse: (code: string) => void;
  onTogglePeriod: (periodId: string) => void;
}

interface YearGroup {
  label: string;
  columns: GridColumn[];
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
  const yearGroups = useMemo(() => groupColumnsByYear(columns), [columns]);
  const maxRows = useMemo(() => maxCoursesInColumn(columns), [columns]);
  const isNarrow = useMediaQuery("(max-width: 47.999rem)");

  const categoryColors = useMemo(() => {
    const map = new Map<string, string>();

    for (const categoryCode of Object.keys(categories)) {
      map.set(categoryCode, getCategoryColor(categories, categoryCode));
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

  const renderCourses = (column: GridColumn) => (
    <div className="malla-grid__column-courses">
      {column.period.courses.map((course) => {
        const eligibility = eligibilityByCode.get(course.code);
        const status = eligibility?.status ?? "available";
        const accent = categoryColors.get(course.category) ?? "#607d8b";

        return (
          <CourseCard
            key={course.code}
            course={course}
            accent={accent}
            status={status}
            missingPrerequisites={eligibility?.missingPrerequisites}
            onToggleCourse={onToggleCourse}
          />
        );
      })}
    </div>
  );

  return (
    <section className="malla-grid" aria-label={`Malla ${careerName}`}>
      {isNarrow ? (
        <MobileMallaGrid
          yearGroups={yearGroups}
          periodSelectionById={periodSelectionById}
          onTogglePeriod={onTogglePeriod}
          renderCourses={renderCourses}
        />
      ) : (
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
            <div className="malla-grid__year-row">
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

            <div className="malla-grid__period-row">
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

            <div className="malla-grid__courses">
              {columns.map((column) => (
                <div
                  key={column.period.id}
                  className="malla-grid__column"
                  role="group"
                  aria-label={column.period.label}
                >
                  {renderCourses(column)}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function groupColumnsByYear(columns: GridColumn[]): YearGroup[] {
  const groups = new Map<number, GridColumn[]>();

  for (const column of columns) {
    const year = Math.ceil(column.semester / 2);
    const group = groups.get(year) ?? [];
    group.push(column);
    groups.set(year, group);
  }

  return [...groups.entries()].map(([year, groupColumns]) => ({
    label: `Año ${year}`,
    columns: groupColumns,
  }));
}

function MobileMallaGrid({
  yearGroups,
  periodSelectionById,
  onTogglePeriod,
  renderCourses,
}: {
  yearGroups: YearGroup[];
  periodSelectionById: Map<string, PeriodSelectionState>;
  onTogglePeriod: (periodId: string) => void;
  renderCourses: (column: GridColumn) => ReactNode;
}) {
  const [openYears, setOpenYears] = useState(() => new Set([yearGroups[0]?.label]));

  return (
    <div className="malla-grid__mobile">
      {yearGroups.map((group) => (
        <details
          key={group.label}
          className="malla-grid__year-disclosure"
          open={openYears.has(group.label)}
          onToggle={(event) => {
            const isOpen = event.currentTarget.open;
            setOpenYears((previous) => {
              const next = new Set(previous);
              if (isOpen) {
                next.add(group.label);
              } else {
                next.delete(group.label);
              }
              return next;
            });
          }}
        >
          <summary className="malla-grid__year-summary">{group.label}</summary>
          <p className="malla-grid__mobile-hint">
            Desliza para ver los siguientes periodos.
          </p>
          <div className="malla-grid__mobile-scroll">
            <div className="malla-grid__mobile-columns">
              {group.columns.map((column, index) => (
                <div
                  key={column.period.id}
                  className="malla-grid__mobile-column"
                  role="group"
                  aria-label={column.period.label}
                >
                  <PeriodHeader
                    column={column}
                    selectionState={
                      periodSelectionById.get(column.period.id) ?? "none"
                    }
                    isFirstTrimester={
                      column.period.type === "trimester" &&
                      group.columns[index - 1]?.period.type === "semester"
                    }
                    onTogglePeriod={onTogglePeriod}
                  />
                  {renderCourses(column)}
                </div>
              ))}
            </div>
          </div>
        </details>
      ))}
    </div>
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
