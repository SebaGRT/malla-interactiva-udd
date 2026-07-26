import type { CareerSummary, Categories, Curriculum } from "@malla-udd/shared";

export type CurriculumApiResponse = Pick<
  Curriculum,
  "meta" | "requirements" | "periods"
> & {
  categories: Categories;
};

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`);

  if (!response.ok) {
    throw new Error(`API ${response.status}: ${path}`);
  }

  return response.json() as Promise<T>;
}

export function getCareers() {
  return fetchJson<{ careers: CareerSummary[] }>("/careers");
}

export function getCurriculum(code: string) {
  return fetchJson<CurriculumApiResponse>(
    `/careers/${encodeURIComponent(code)}/curriculum`,
  );
}

export function getHealth() {
  return fetchJson<{ status: string; service: string; timestamp: string }>(
    "/health",
  );
}
