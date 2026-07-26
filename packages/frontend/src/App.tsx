import { useEffect, useMemo, useState } from "react";
import type { Curriculum } from "@malla-udd/shared";
import { calculateCategoryCourseProgress, flattenCourses } from "@malla-udd/shared";
import { getCurriculum } from "./api/client.js";
import type { CurriculumApiResponse } from "./api/client.js";
import { MallaGrid } from "./components/MallaGrid.js";
import { SpecSidebar } from "./components/SpecSidebar.js";
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

  useEffect(() => {
    getCurriculum(DEFAULT_CAREER)
      .then(setData)
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Error loading curriculum");
      })
      .finally(() => setLoading(false));
  }, []);

  const careerLabel = data
    ? `Universidad del Desarrollo`
    : "Universidad del Desarrollo";

  return (
    <div className="malla-page malla-page--m2">
      <div className="m2-layout">
        <SpecSidebar
          careerLabel={careerLabel}
          creditSummary={creditSummary}
          approvedCount={approvedCodes.size}
          totalCourseCount={totalCourseCount}
          categoryProgress={categoryProgress}
          loading={loading}
          onClear={clearApproved}
          theme={theme}
          onToggleTheme={toggleTheme}
        />

        <div className="m2-canvas">
          <span className="m2-canvas__label">
            {data?.meta.career ?? "malla curricular"}
          </span>
          <main className="m2-canvas__body">
            {loading && <p>Cargando malla…</p>}
            {error && <p className="error">{error}</p>}
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
      </div>
    </div>
  );
}
