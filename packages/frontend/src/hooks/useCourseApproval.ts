import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  Categories,
  CourseEligibility,
  CreditSummary,
  Curriculum,
} from "@malla-udd/shared";
import {
  applyPlanningHorizon,
  buildCurriculumIndexes,
  calculateCredits,
  canInteractWithCourse,
  evaluateEligibility,
  togglePeriodApprovals,
  validateApprovedCodes,
} from "@malla-udd/shared";

const STORAGE_DEBOUNCE_MS = 300;

function storageKeyForCareer(careerCode: string): string {
  return `malla-udd-approved-${careerCode}`;
}

function loadApprovedCodes(
  key: string,
  curriculum: Curriculum,
): Set<string> {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      return new Set();
    }

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return new Set();
    }

    const codes = parsed.filter((item): item is string => typeof item === "string");
    const indexes = buildCurriculumIndexes(curriculum);
    const { valid } = validateApprovedCodes(curriculum, codes, indexes);
    return new Set(valid);
  } catch {
    return new Set();
  }
}

export function useCourseApproval(
  curriculum: Curriculum | null,
  categories: Categories | null,
  careerCode: string | null,
) {
  const [approvedCodes, setApprovedCodes] = useState<Set<string>>(() => new Set());
  const hydratedRef = useRef(false);
  const storageKey = careerCode ? storageKeyForCareer(careerCode) : null;

  const indexes = useMemo(
    () => (curriculum ? buildCurriculumIndexes(curriculum) : null),
    [curriculum],
  );

  useEffect(() => {
    hydratedRef.current = false;
    setApprovedCodes(new Set());
  }, [storageKey]);

  useEffect(() => {
    if (!curriculum || !storageKey || hydratedRef.current) {
      return;
    }

    setApprovedCodes(loadApprovedCodes(storageKey, curriculum));
    hydratedRef.current = true;
  }, [curriculum, storageKey]);

  useEffect(() => {
    if (!storageKey || !hydratedRef.current) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      localStorage.setItem(storageKey, JSON.stringify([...approvedCodes]));
    }, STORAGE_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [approvedCodes, storageKey]);

  const toggleCourse = useCallback(
    (code: string) => {
      if (!curriculum || !indexes) {
        return;
      }

      setApprovedCodes((previous) => {
        if (!canInteractWithCourse(curriculum, code, previous, indexes)) {
          return previous;
        }

        const next = new Set(previous);
        if (next.has(code)) {
          next.delete(code);
        } else {
          next.add(code);
        }
        return next;
      });
    },
    [curriculum, indexes],
  );

  const eligibilityByCode = useMemo(() => {
    if (!curriculum || !indexes) {
      return new Map<string, CourseEligibility>();
    }

    const eligibility = applyPlanningHorizon(
      evaluateEligibility(curriculum, [...approvedCodes], indexes),
      curriculum,
      [...approvedCodes],
      indexes,
    );
    return new Map(eligibility.map((entry) => [entry.code, entry]));
  }, [approvedCodes, curriculum, indexes]);

  const creditSummary = useMemo((): CreditSummary | null => {
    if (!curriculum || !categories || !indexes) {
      return null;
    }

    return calculateCredits(curriculum, categories, [...approvedCodes], indexes);
  }, [approvedCodes, categories, curriculum, indexes]);

  const togglePeriod = useCallback(
    (periodId: string) => {
      if (!curriculum || !indexes) {
        return;
      }

      setApprovedCodes((previous) =>
        togglePeriodApprovals(curriculum, periodId, previous, indexes),
      );
    },
    [curriculum, indexes],
  );

  const clearApproved = useCallback(() => {
    setApprovedCodes(new Set());
  }, []);

  return {
    approvedCodes,
    eligibilityByCode,
    creditSummary,
    indexes,
    toggleCourse,
    togglePeriod,
    clearApproved,
  };
}
