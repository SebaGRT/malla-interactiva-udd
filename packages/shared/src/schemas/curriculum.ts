import { z } from "zod";

/** AND groups with optional OR sub-groups, e.g. ["A", ["B", "C"]] */
export const PrerequisiteSchema: z.ZodType<Prerequisite> = z.lazy(() =>
  z.union([z.string(), z.array(z.string())]),
);

export type Prerequisite = string | string[];

export const PrerequisitesSchema = z.array(PrerequisiteSchema);

export const CourseSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  credits: z.number().int().min(0).max(21).nullable(),
  category: z.string().min(1),
  prerequisites: PrerequisitesSchema.default([]),
  offering: z.enum(["P", "I", "A"]).default("A"),
  /** Consecutive semesters (only in semester periods, s1–s4) */
  spansSemesters: z.number().int().min(1).optional(),
  /** Consecutive trimesters (only in trimester periods, from semestre 5) */
  spansTrimesters: z.number().int().min(1).optional(),
});

export const SemesterPeriodSchema = z.object({
  id: z.string().regex(/^s\d+$/),
  type: z.literal("semester"),
  semester: z.number().int().min(1).max(4),
  label: z.string().min(1),
  order: z.number().int().min(1),
  courses: z.array(CourseSchema),
});

export const TrimesterPeriodSchema = z.object({
  id: z.string().regex(/^t\d+$/),
  type: z.literal("trimester"),
  semester: z.number().int().min(5),
  trimesterInSemester: z.number().int().min(1).max(3),
  /** Global trimester index (continues from year 1; IIT uses 9–20) */
  trimester: z.number().int().min(1),
  label: z.string().min(1),
  order: z.number().int().min(1),
  courses: z.array(CourseSchema),
});

export const PeriodSchema = z.discriminatedUnion("type", [
  SemesterPeriodSchema,
  TrimesterPeriodSchema,
]);

export const SchedulingSchema = z.object({
  /** Years 1–2 use semester buckets only */
  semesterPeriodsThrough: z.literal(4),
  /** From this semester onward, grid uses trimesters */
  trimesterFromSemester: z.literal(5),
});

export const CurriculumMetaSchema = z.object({
  university: z.string().min(1),
  career: z.string().min(1),
  code: z.string().min(1),
  version: z.string().min(1),
  /** Degree total; at IIT this includes extradisciplinary credits */
  totalCreditsRequired: z.number().int().positive(),
  /**
   * Extradisciplinary credits included in totalCreditsRequired (sum of EEL courses in grid).
   */
  extradisciplinaryCredits: z.number().int().nonnegative().optional(),
  scheduling: SchedulingSchema.optional(),
});

export const RequirementSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  spansSemesters: z.tuple([z.number().int(), z.number().int()]).optional(),
});

export const CurriculumSchema = z.object({
  meta: CurriculumMetaSchema,
  requirements: z.array(RequirementSchema).default([]),
  periods: z.array(PeriodSchema).min(1),
});

export const CategorySchema = z.object({
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  label: z.string().min(1),
});

export const CategoriesSchema = z.record(CategorySchema);

export const CareerSummarySchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  university: z.string().min(1),
  version: z.string().min(1),
  totalCreditsRequired: z.number().int().positive(),
  periodCount: z.number().int().positive(),
  semesterPeriodCount: z.number().int().nonnegative(),
  trimesterPeriodCount: z.number().int().nonnegative(),
  courseCount: z.number().int().nonnegative(),
  scheduling: SchedulingSchema.optional(),
});

export type Course = z.infer<typeof CourseSchema>;
export type SemesterPeriod = z.infer<typeof SemesterPeriodSchema>;
export type TrimesterPeriod = z.infer<typeof TrimesterPeriodSchema>;
export type Period = z.infer<typeof PeriodSchema>;
export type CurriculumMeta = z.infer<typeof CurriculumMetaSchema>;
export type Scheduling = z.infer<typeof SchedulingSchema>;
export type Requirement = z.infer<typeof RequirementSchema>;
export type Curriculum = z.infer<typeof CurriculumSchema>;
export type Category = z.infer<typeof CategorySchema>;
export type Categories = z.infer<typeof CategoriesSchema>;
export type CareerSummary = z.infer<typeof CareerSummarySchema>;

export type CourseStatus =
  | "approved"
  | "available"
  | "blocked"
  | "beyond_horizon";

export interface CourseEligibility {
  code: string;
  name: string;
  status: CourseStatus;
  missingPrerequisites: string[][];
}

export interface CreditSummary {
  approved: number;
  required: number;
  remaining: number;
  progressPercent: number;
  /** Sum of credits from coded courses in the malla */
  gridCreditsTotal: number;
  /** Extradisciplinary credits included in required total (from meta) */
  extradisciplinaryCredits: number;
  byCategory: Record<string, { approved: number; label: string; color: string }>;
}

export interface CategoryCourseProgress {
  categoryCode: string;
  label: string;
  color: string;
  approvedCount: number;
  totalCount: number;
  progressPercent: number;
}
