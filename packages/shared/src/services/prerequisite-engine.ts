import type { Prerequisite } from "../schemas/curriculum.js";

/**
 * Evaluates whether a set of prerequisites is satisfied.
 * Top-level items are ANDed; nested string arrays are OR groups.
 */
export function arePrerequisitesMet(
  prerequisites: Prerequisite[],
  approvedCodes: ReadonlySet<string>,
): boolean {
  return prerequisites.every((item) => isPrerequisiteGroupMet(item, approvedCodes));
}

/**
 * Returns OR-groups that are not satisfied (each inner array is one unsatisfied OR group).
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
