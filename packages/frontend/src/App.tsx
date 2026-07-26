import { useCallback, useEffect, useMemo, useState } from "react";
import type { Curriculum } from "@malla-udd/shared";
import { calculateCategoryCourseProgress, flattenCourses } from "@malla-udd/shared";
import { getCurriculum } from "./api/client.js";
import type { CurriculumApiResponse } from "./api/client.js";
import { MallaGrid } from "./components/MallaGrid.js";
import {
  CategoryProgressPanel,
  ProgressSummary,
} from "./components/SpecSidebar.js";
import { useCourseApproval } from "./hooks/useCourseApproval.js";
import { useTheme } from "./hooks/useTheme.js";
import "./styles/malla-grid.css";
import "./styles/page-shell.css";

const DEFAULT_CAREER = "IIT";

export function App() {
  const [data, setData] = useState<CurriculumApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { theme, toggleTheme } = useTheme();

  const curriculum = useMemo<Curriculum | null>(() => {
    if (!data) {
      return null;
    }

    return {
      meta: data.meta,
      requirements: data.requirements,
      periods: data.periods,
    };
  }, [data]);

  const {
    approvedCodes,
    eligibilityByCode,
    creditSummary,
    indexes,
    toggleCourse,
    togglePeriod,
    clearApproved,
  } = useCourseApproval(curriculum, data?.categories ?? null, data?.meta.code ?? null);

  const totalCourseCount = useMemo(() => {
    if (!curriculum) {
      return 0;
    }

    return flattenCourses(curriculum).length;
  }, [curriculum]);

  const categoryProgress = useMemo(() => {
    if (!curriculum || !data?.categories) {
      return [];
    }

    return calculateCategoryCourseProgress(
      curriculum,
      data.categories,
      [...approvedCodes],
      indexes ?? undefined,
    );
  }, [approvedCodes, curriculum, data?.categories, indexes]);

  const loadCurriculum = useCallback(() => {
    setLoading(true);
    setError(null);

    return getCurriculum(DEFAULT_CAREER)
      .then(setData)
      .catch(() => {
        setError("No pudimos cargar la malla");
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    void loadCurriculum();
  }, [loadCurriculum]);

  const careerLabel = "Universidad del Desarrollo";

  return (
    <div className="malla-page malla-page--m2">
      <a className="skip-link" href="#main-content">
        Saltar al contenido principal
      </a>
      <div className="m2-layout">
        <ProgressSummary
          careerLabel={careerLabel}
          creditSummary={creditSummary}
          approvedCount={approvedCodes.size}
          totalCourseCount={totalCourseCount}
          loading={loading}
          hasData={Boolean(data)}
          hasError={Boolean(error)}
          onClear={clearApproved}
          theme={theme}
          onToggleTheme={toggleTheme}
        />

        <div className="m2-canvas">
          <span className="m2-canvas__label">
            {data?.meta.career ?? "malla curricular"}
          </span>
          <main
            id="main-content"
            className="m2-canvas__body"
            aria-busy={loading}
          >
            <p className="sr-only" role="status" aria-live="polite">
              {loading ? "Cargando malla…" : ""}
            </p>
            {loading && <p className="loading-message">Cargando malla…</p>}
            {error && (
              <div className="error" role="alert">
                <strong>{error}</strong>
                <p>Revisa tu conexión e inténtalo de nuevo.</p>
                <button type="button" onClick={() => void loadCurriculum()}>
                  Reintentar
                </button>
              </div>
            )}
            {data && (
              <MallaGrid
                periods={data.periods}
                categories={data.categories}
                careerName={data.meta.career}
                approvedCodes={approvedCodes}
                eligibilityByCode={eligibilityByCode}
                onToggleCourse={toggleCourse}
                onTogglePeriod={togglePeriod}
              />
            )}
          </main>
        </div>

        <CategoryProgressPanel
          categoryProgress={categoryProgress}
          loading={loading}
          hasError={Boolean(error)}
        />
      </div>
    </div>
  );
}
