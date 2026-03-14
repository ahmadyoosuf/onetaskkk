import { z } from "zod"

// ─── Base Task Schema ───────────────────────────────────────
const baseTaskSchema = z.object({
  title: z
    .string()
    .min(5, "Title must be at least 5 characters")
    .max(100, "Title must be less than 100 characters"),
  description: z
    .string()
    .min(20, "Description must be at least 20 characters")
    .max(500, "Description must be less than 500 characters"),
  reward: z
    .number({ invalid_type_error: "Reward is required" })
    .min(0.1, "Minimum reward is $0.10")
    .max(1000, "Maximum reward is $1000"),
  maxSubmissions: z
    .number({ invalid_type_error: "Max submissions is required" })
    .int("Must be a whole number")
    .min(1, "At least 1 submission required")
    .max(10000, "Maximum 10,000 submissions"),
  allowMultipleSubmissions: z.boolean(),
  deadline: z
    .date()
    .optional()
    .refine(
      (date) => !date || date > new Date(),
      "Deadline must be in the future"
    ),
})

// ─── Type-Specific Schemas ──────────────────────────────────
export const formSubmissionSchema = baseTaskSchema.extend({
  type: z.literal("form_submission"),
  targetUrl: z.string().url("Must be a valid URL"),
  formFields: z.string().min(1, "At least one form field is required"),
})

export const emailSendingSchema = baseTaskSchema.extend({
  type: z.literal("email_sending"),
  targetEmail: z.string().email("Must be a valid email address"),
  emailContent: z
    .string()
    .min(10, "Email content must be at least 10 characters")
    .max(1000, "Email content must be less than 1000 characters"),
})

export const socialMediaLikingSchema = baseTaskSchema.extend({
  type: z.literal("social_media_liking"),
  postUrl: z.string().url("Must be a valid URL"),
  platform: z.enum(["linkedin", "twitter", "instagram"], {
    errorMap: () => ({ message: "Please select a platform" }),
  }),
})

// ─── Union Schema ───────────────────────────────────────────
export const taskFormSchema = z.discriminatedUnion("type", [
  formSubmissionSchema,
  emailSendingSchema,
  socialMediaLikingSchema,
])

export type TaskFormData = z.infer<typeof taskFormSchema>
export type FormSubmissionData = z.infer<typeof formSubmissionSchema>
export type EmailSendingData = z.infer<typeof emailSendingSchema>
export type SocialMediaLikingData = z.infer<typeof socialMediaLikingSchema>

// ─── Submission Schema ──────────────────────────────────────
export const submissionSchema = z.object({
  proof: z
    .string()
    .min(10, "Please provide details about your work")
    .max(500, "Proof must be less than 500 characters"),
  liveAppUrl: z
    .string()
    .url("Must be a valid URL")
    .optional()
    .or(z.literal("")),
})

export type SubmissionFormData = z.infer<typeof submissionSchema>
