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
  details: z
    .string()
    .min(20, "Detailed instructions must be at least 20 characters")
    .max(5000, "Detailed instructions must be less than 5000 characters"),
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
  campaignId: z
    .string()
    .max(50, "Campaign ID must be less than 50 characters")
    .optional(),
})

// ─── Type-Specific Schemas ──────────────────────────────────
export const socialMediaPostingSchema = baseTaskSchema.extend({
  type: z.literal("social_media_posting"),
  platform: z.enum(["linkedin", "twitter", "instagram"], {
    errorMap: () => ({ message: "Please select a platform" }),
  }),
  postContent: z
    .string()
    .min(10, "Post content must be at least 10 characters")
    .max(1000, "Post content must be less than 1000 characters"),
  accountHandle: z.string().optional(),
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
  socialMediaPostingSchema,
  emailSendingSchema,
  socialMediaLikingSchema,
])

export type TaskFormData = z.infer<typeof taskFormSchema>
export type SocialMediaPostingData = z.infer<typeof socialMediaPostingSchema>
export type EmailSendingData = z.infer<typeof emailSendingSchema>
export type SocialMediaLikingData = z.infer<typeof socialMediaLikingSchema>

// ─── Submission Schemas (task-type-specific per PRD) ────────
// Social Media Posting/Liking: Post URL + Screenshot
export const socialMediaSubmissionSchema = z.object({
  postUrl: z
    .string()
    .url("Must be a valid URL")
    .min(1, "Post URL is required"),
  screenshotUrl: z
    .string()
    .url("Must be a valid URL")
    .min(1, "Screenshot URL is required"),
})

// Email Sending: Email Content + Screenshot
export const emailSubmissionSchema = z.object({
  emailContent: z
    .string()
    .min(20, "Email content must be at least 20 characters")
    .max(2000, "Email content must be less than 2000 characters"),
  screenshotUrl: z
    .string()
    .url("Must be a valid URL")
    .min(1, "Screenshot URL is required"),
})

export type SocialMediaSubmissionData = z.infer<typeof socialMediaSubmissionSchema>
export type EmailSubmissionData = z.infer<typeof emailSubmissionSchema>
export type SubmissionFormData = SocialMediaSubmissionData | EmailSubmissionData
