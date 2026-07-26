import type { Prerequisite } from "../schemas/curriculum.js";

/**
 * Evalúa si se cumple un conjunto de prerrequisitos.
 * Los elementos de primer nivel usan AND; los arreglos anidados usan OR.
 */
export function arePrerequisitesMet(
  prerequisites: Prerequisite[],
  approvedCodes: ReadonlySet<string>,
): boolean {
  return prerequisites.every((item) => isPrerequisiteGroupMet(item, approvedCodes));
}

/**
 * Retorna los grupos OR incumplidos (cada arreglo interno es un grupo OR incumplido).
 */
export function getUnmetPrerequisiteGroups(
  prerequisites: Prerequisite[],
  approvedCodes: ReadonlySet<string>,
): string[][] {
  const unmet: string[][] = [];

  for (const item of prerequisites) {
    if (Array.isArray(item)) {
      if (!item.some((code) => approvedCodes.has(code))) {
        unmet.push([...item]);
      }
    } else if (!approvedCodes.has(item)) {
      unmet.push([item]);
    }
  }

  return unmet;
}

function isPrerequisiteGroupMet(
  item: Prerequisite,
  approvedCodes: ReadonlySet<string>,
): boolean {
  if (Array.isArray(item)) {
    return item.some((code) => approvedCodes.has(code));
  }

  return approvedCodes.has(item);
}
