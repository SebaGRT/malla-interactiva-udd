import { memo, type CSSProperties } from "react";
import type { Course, CourseStatus } from "@malla-udd/shared";

interface CourseCardProps {
  course: Course;
  accent: string;
  foreground: string;
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
    previous.foreground === next.foreground &&
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
  foreground,
  status,
  missingPrerequisites = [],
  onToggleCourse,
}: CourseCardProps) {
  const credits = course.credits ?? "—";
  const isApproved = status === "approved";
  const isBlocked = status === "blocked";
  const isBeyondHorizon = status === "beyond_horizon";
  const isDisabled = isBlocked || isBeyondHorizon;

  let title = `${course.code} — ${course.name}`;
  if (isBeyondHorizon) {
    title += " (fuera del horizonte de planificación)";
  } else if (isBlocked && missingPrerequisites.length > 0) {
    title += ` (prerrequisitos: ${formatMissingPrerequisites(missingPrerequisites)})`;
  } else if (isBlocked) {
    title += " (prerrequisitos pendientes)";
  }

  const cardStyle = {
    "--course-accent": accent,
    "--course-fg": foreground,
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
      aria-disabled={isDisabled}
      disabled={isDisabled}
      onClick={() => onToggleCourse(course.code)}
    >
      <span className="course-card__stripe" aria-hidden />
      <span className="course-card__surface" aria-hidden />

      <header className="course-card__head">
        <span className="course-card__code">{course.code}</span>
        <span className="course-card__category">{course.category}</span>
      </header>

      <p className="course-card__name">{course.name}</p>

      <footer className="course-card__foot">
        <span className="course-card__credits">
          <span className="course-card__credits-value">{credits}</span>
          <span className="course-card__credits-label">cr</span>
        </span>
      </footer>

      {isBeyondHorizon && (
        <span className="course-card__state course-card__state--beyond" aria-hidden>
          <span className="course-card__lock" />
        </span>
      )}

      {isApproved && <span className="course-card__ribbon" aria-hidden />}
    </button>
  );
}, courseCardPropsAreEqual);
