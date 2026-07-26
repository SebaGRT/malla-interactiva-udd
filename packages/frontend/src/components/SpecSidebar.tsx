import { useRef, useState, type CSSProperties } from "react";
import type { CategoryCourseProgress, CreditSummary } from "@malla-udd/shared";
import { ClearProgressDialog } from "./ClearProgressDialog.js";
import { getCategoryAccentPair } from "../utils/color.js";

interface ProgressSummaryProps {
  careerLabel: string;
  creditSummary: CreditSummary | null;
  approvedCount: number;
  totalCourseCount: number;
  loading?: boolean;
  hasData: boolean;
  hasError: boolean;
  onClear: () => void;
  theme: "light" | "dark";
  onToggleTheme: () => void;
}

interface CategoryProgressPanelProps {
  categoryProgress: CategoryCourseProgress[];
  loading?: boolean;
  hasError: boolean;
}

export function ProgressSummary({
  careerLabel,
  creditSummary,
  approvedCount,
  totalCourseCount,
  loading = false,
  hasData,
  hasError,
  onClear,
  theme,
  onToggleTheme,
}: ProgressSummaryProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const clearButtonRef = useRef<HTMLButtonElement>(null);
  const progress = creditSummary
    ? Math.min(100, Math.round(creditSummary.progressPercent))
    : 0;
  const remainingCourses = Math.max(totalCourseCount - approvedCount, 0);
  const unavailable = loading || hasError || !hasData;

  function closeDialog() {
    setIsDialogOpen(false);
    requestAnimationFrame(() => clearButtonRef.current?.focus());
  }

  function confirmClear() {
    onClear();
    closeDialog();
  }

  return (
    <aside className="spec-sidebar spec-sidebar--summary" aria-label="Panel de progreso">
      <div className="spec-sidebar__block">
        <h1 className="spec-sidebar__title">Malla Interactiva UDD</h1>
        <p className="spec-sidebar__career">{careerLabel}</p>
      </div>

      <div className="spec-sidebar__block">
        <span className="spec-sidebar__label">Créditos</span>
        {loading ? (
          <p className="spec-sidebar__loading">Cargando…</p>
        ) : !creditSummary ? (
          <p className="spec-sidebar__loading">Datos no disponibles</p>
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
          <span>{unavailable ? "—" : approvedCount}</span>
        </div>
        <div className="spec-sidebar__row">
          <span>restantes</span>
          <span>{unavailable ? "—" : remainingCourses}</span>
        </div>
        <button
          ref={clearButtonRef}
          type="button"
          className="spec-sidebar__clear"
          onClick={() => setIsDialogOpen(true)}
          disabled={unavailable || approvedCount === 0}
        >
          Borrar avance
        </button>
      </div>

      <button
        type="button"
        className="spec-sidebar__theme"
        onClick={onToggleTheme}
        aria-label={theme === "light" ? "Activar modo oscuro" : "Activar modo claro"}
      >
        {theme === "light" ? "Modo oscuro" : "Modo claro"}
      </button>

      <ClearProgressDialog
        open={isDialogOpen}
        onCancel={closeDialog}
        onConfirm={confirmClear}
      />
    </aside>
  );
}

export function CategoryProgressPanel({
  categoryProgress,
  loading = false,
  hasError,
}: CategoryProgressPanelProps) {
  return (
    <aside className="spec-sidebar spec-sidebar--categories" aria-label="Progreso por categoría">
      <details className="spec-sidebar__details" open>
        <summary className="spec-sidebar__details-summary">
          <span className="spec-sidebar__label">Categorías</span>
        </summary>
        <ul className="spec-sidebar__cats">
          {loading && categoryProgress.length === 0 && (
            <li className="spec-sidebar__loading">Cargando…</li>
          )}
          {!loading && hasError && categoryProgress.length === 0 && (
            <li className="spec-sidebar__loading">Datos no disponibles</li>
          )}
          {categoryProgress.map((entry) => {
            const accent = getCategoryAccentPair(entry.color);

            return (
              <li
                key={entry.categoryCode}
                className="spec-sidebar__cat"
                style={
                  {
                    "--category-accent-light": accent.light,
                    "--category-accent-dark": accent.dark,
                  } as CSSProperties
                }
              >
                <div className="spec-sidebar__cat-head">
                  <span className="spec-sidebar__cat-label">
                    <span className="spec-sidebar__swatch" aria-hidden="true" />
                    <span className="spec-sidebar__cat-name">{entry.label}</span>
                  </span>
                  <span className="spec-sidebar__cat-code">{entry.categoryCode}</span>
                </div>
                <div className="spec-sidebar__row">
                  <span>
                    {entry.approvedCount} / {entry.totalCount} ramos
                  </span>
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
                    }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </details>
    </aside>
  );
}
