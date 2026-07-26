import type { CategoryCourseProgress, CreditSummary } from "@malla-udd/shared";

interface SpecSidebarProps {
  careerLabel: string;
  creditSummary: CreditSummary | null;
  approvedCount: number;
  totalCourseCount: number;
  categoryProgress: CategoryCourseProgress[];
  loading?: boolean;
  onClear: () => void;
  theme: "light" | "dark";
  onToggleTheme: () => void;
}

export function SpecSidebar({
  careerLabel,
  creditSummary,
  approvedCount,
  totalCourseCount,
  categoryProgress,
  loading = false,
  onClear,
  theme,
  onToggleTheme,
}: SpecSidebarProps) {
  const progress = creditSummary
    ? Math.min(100, Math.round(creditSummary.progressPercent))
    : 0;
  const remainingCourses = Math.max(totalCourseCount - approvedCount, 0);

  return (
    <aside className="spec-sidebar" aria-label="Panel de progreso">
      <div className="spec-sidebar__block">
        <h1 className="spec-sidebar__title">Malla Interactiva UDD</h1>
        <p className="spec-sidebar__career">{careerLabel}</p>
      </div>

      <div className="spec-sidebar__block">
        <span className="spec-sidebar__label">Créditos</span>
        {loading || !creditSummary ? (
          <p className="spec-sidebar__loading">Cargando…</p>
        ) : (
          <>
            <span className="spec-sidebar__value">{creditSummary.approved}</span>
            <div className="spec-sidebar__row">
              <span>meta</span>
              <span>{creditSummary.required}</span>
            </div>
            <div className="spec-sidebar__row">
              <span>avance</span>
              <span>{progress}%</span>
            </div>
            <div
              className="spec-sidebar__bar"
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${progress}% del total requerido`}
            >
              <div className="spec-sidebar__bar-fill" style={{ width: `${progress}%` }} />
            </div>
          </>
        )}
      </div>

      <div className="spec-sidebar__block">
        <span className="spec-sidebar__label">Ramos</span>
        <div className="spec-sidebar__row">
          <span>aprobados</span>
          <span>{loading ? "—" : approvedCount}</span>
        </div>
        <div className="spec-sidebar__row">
          <span>restantes</span>
          <span>{loading ? "—" : remainingCourses}</span>
        </div>
        <button
          type="button"
          className="spec-sidebar__clear"
          onClick={onClear}
          disabled={loading || approvedCount === 0}
        >
          Limpiar
        </button>
      </div>

      <div className="spec-sidebar__block spec-sidebar__block--categories">
        <span className="spec-sidebar__label">Categorías</span>
        <ul className="spec-sidebar__cats">
          {loading && categoryProgress.length === 0 && (
            <li className="spec-sidebar__loading">Cargando…</li>
          )}
          {categoryProgress.map((entry) => (
            <li key={entry.categoryCode} className="spec-sidebar__cat">
              <div className="spec-sidebar__cat-head">
                <span className="spec-sidebar__cat-label">
                  <span
                    className="spec-sidebar__swatch"
                    style={{ backgroundColor: entry.color }}
                    aria-hidden
                  />
                  <span className="spec-sidebar__cat-name">{entry.label}</span>
                </span>
                <span className="spec-sidebar__cat-code">{entry.categoryCode}</span>
              </div>
              <div className="spec-sidebar__row">
                <span>{entry.approvedCount} / {entry.totalCount} ramos</span>
                <span>{entry.progressPercent}%</span>
              </div>
              <div
                className="spec-sidebar__cat-bar"
                role="progressbar"
                aria-valuenow={entry.progressPercent}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${entry.label}: ${entry.progressPercent}%`}
              >
                <div
                  className="spec-sidebar__cat-bar-fill"
                  style={{
                    width: `${entry.progressPercent}%`,
                    backgroundColor: entry.color,
                  }}
                />
              </div>
            </li>
          ))}
        </ul>
      </div>

      <button
        type="button"
        className="spec-sidebar__theme"
        onClick={onToggleTheme}
        aria-label={theme === "light" ? "Activar modo oscuro" : "Activar modo claro"}
      >
        {theme === "light" ? "Modo oscuro" : "Modo claro"}
      </button>
    </aside>
  );
}
