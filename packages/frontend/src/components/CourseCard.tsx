import { memo, useId, type CSSProperties } from "react";
import type { Course, CourseStatus } from "@malla-udd/shared";

interface CourseCardProps {
  course: Course;
  accent: string;
  status: CourseStatus;
  missingPrerequisites?: string[][];
  onToggleCourse: (code: string) => void;
}

function formatMissingPrerequisites(groups: string[][]): string {
  return groups
    .map((group) => (group.length > 1 ? group.join(" o ") : group[0]))
    .join(", ");
}

function missingPrerequisitesEqual(
  left: string[][] | undefined,
  right: string[][] | undefined,
): boolean {
  const a = left ?? [];
  const b = right ?? [];

  if (a.length !== b.length) {
    return false;
  }

  return a.every(
    (group, index) =>
      group.length === b[index]!.length &&
      group.every((code, codeIndex) => code === b[index]![codeIndex]),
  );
}

function courseCardPropsAreEqual(
  previous: CourseCardProps,
  next: CourseCardProps,
): boolean {
  return (
    previous.course.code === next.course.code &&
    previous.status === next.status &&
    previous.accent === next.accent &&
    previous.onToggleCourse === next.onToggleCourse &&
    missingPrerequisitesEqual(
      previous.missingPrerequisites,
      next.missingPrerequisites,
    )
  );
}

export const CourseCard = memo(function CourseCard({
  course,
  accent,
  status,
  missingPrerequisites = [],
  onToggleCourse,
}: CourseCardProps) {
  const credits = course.credits ?? "—";
  const isApproved = status === "approved";
  const isBlocked = status === "blocked";
  const isBeyondHorizon = status === "beyond_horizon";
  const isUnavailable = isBlocked || isBeyondHorizon;
  const descriptionId = `course-${useId().replace(/:/g, "")}-state`;

  let title = `${course.code} — ${course.name}`;
  let stateDescription = "";
  let visibleState = "";
  if (isBeyondHorizon) {
    title += " (fuera del horizonte de planificación)";
    stateDescription = "Fuera del plan actual.";
    visibleState = "Fuera del plan";
  } else if (isBlocked && missingPrerequisites.length > 0) {
    const prerequisites = formatMissingPrerequisites(missingPrerequisites);
    title += ` (prerrequisitos: ${prerequisites})`;
    stateDescription = `Bloqueado. Prerrequisitos pendientes: ${prerequisites}.`;
    visibleState = `Requiere ${missingPrerequisites[0]?.[0] ?? "prerrequisitos"}`;
  } else if (isBlocked) {
    title += " (prerrequisitos pendientes)";
    stateDescription = "Bloqueado. Prerrequisitos pendientes.";
    visibleState = "Prerrequisitos pendientes";
  }

  const cardStyle = {
    "--course-accent": accent,
  } as CSSProperties;

  return (
    <button
      type="button"
      className={[
        "course-card",
        isApproved && "course-card--approved",
        isBlocked && "course-card--blocked",
        isBeyondHorizon && "course-card--beyond",
      ]
        .filter(Boolean)
        .join(" ")}
      style={cardStyle}
      title={title}
      aria-pressed={isApproved}
      aria-disabled={isUnavailable || undefined}
      aria-describedby={isUnavailable ? descriptionId : undefined}
      onClick={() => {
        if (!isUnavailable) {
          onToggleCourse(course.code);
        }
      }}
    >
      <span className="course-card__stripe" aria-hidden />
      <span className="course-card__surface" aria-hidden />

      <header className="course-card__head">
        <span className="course-card__code">{course.code}</span>
        <span className="course-card__category">{course.category}</span>
      </header>

      <p className="course-card__name">{course.name}</p>

      <footer className="course-card__foot">
        {visibleState ? (
          <span className="course-card__status" aria-hidden="true">
            {visibleState}
          </span>
        ) : (
          <span aria-hidden="true" />
        )}
        <span className="course-card__credits">
          <span className="course-card__credits-value">{credits}</span>
          <span className="course-card__credits-label">cr</span>
        </span>
      </footer>

      {stateDescription && (
        <span id={descriptionId} className="sr-only">
          {stateDescription}
        </span>
      )}

      {isBeyondHorizon && (
        <span className="course-card__state course-card__state--beyond" aria-hidden>
          <span className="course-card__lock" />
        </span>
      )}

      {isApproved && <span className="course-card__ribbon" aria-hidden />}
    </button>
  );
}, courseCardPropsAreEqual);
