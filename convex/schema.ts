import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  ideas: defineTable({
    title: v.string(),
    description: v.string(),
    status: v.union(v.literal("idea"), v.literal("todo"), v.literal("in_progress"), v.literal("done")),
    createdBy: v.id("users"),
    assignedTo: v.optional(v.id("users")),
    priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"))),
    tags: v.optional(v.array(v.string())),
    dueDate: v.optional(v.number()),
    attachments: v.optional(v.array(v.id("_storage"))),
    lastUpdated: v.number(),
  })
    .index("by_status_and_updated", ["status", "lastUpdated"])
    .index("by_created_by", ["createdBy"])
    .index("by_assigned_to", ["assignedTo"])
    .index("by_last_updated", ["lastUpdated"]),

  activities: defineTable({
    ideaId: v.id("ideas"),
    userId: v.id("users"),
    action: v.string(), // "created", "updated", "moved", "commented", "assigned", etc.
    details: v.string(), // JSON string with change details
    timestamp: v.number(),
  })
    .index("by_idea", ["ideaId"])
    .index("by_user", ["userId"]),

  comments: defineTable({
    ideaId: v.id("ideas"),
    userId: v.id("users"),
    content: v.string(),
    timestamp: v.number(),
  })
    .index("by_idea", ["ideaId"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
