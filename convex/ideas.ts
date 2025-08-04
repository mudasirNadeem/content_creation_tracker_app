import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

async function requireAuth(ctx: any) {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw new Error("Authentication required");
  }
  return userId;
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    await requireAuth(ctx);
    
    const ideas = await ctx.db.query("ideas").collect();
    
    // Get user info for each idea
    const ideasWithUsers = await Promise.all(
      ideas.map(async (idea) => {
        const creator = await ctx.db.get(idea.createdBy);
        const assignee = idea.assignedTo ? await ctx.db.get(idea.assignedTo) : null;
        
        return {
          ...idea,
          creator: creator ? { name: creator.name, email: creator.email } : null,
          assignee: assignee ? { name: assignee.name, email: assignee.email } : null,
        };
      })
    );
    
    return ideasWithUsers;
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"))),
    tags: v.optional(v.array(v.string())),
    dueDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    
    const ideaId = await ctx.db.insert("ideas", {
      title: args.title,
      description: args.description,
      status: "idea",
      createdBy: userId,
      priority: args.priority,
      tags: args.tags,
      dueDate: args.dueDate,
    });
    
    // Log activity
    await ctx.db.insert("activities", {
      ideaId,
      userId,
      action: "created",
      details: JSON.stringify({ title: args.title }),
      timestamp: Date.now(),
    });
    
    return ideaId;
  },
});

export const updateStatus = mutation({
  args: {
    ideaId: v.id("ideas"),
    status: v.union(v.literal("idea"), v.literal("todo"), v.literal("in_progress"), v.literal("done")),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    
    const idea = await ctx.db.get(args.ideaId);
    if (!idea) {
      throw new Error("Idea not found");
    }
    
    const oldStatus = idea.status;
    
    await ctx.db.patch(args.ideaId, {
      status: args.status,
    });
    
    // Log activity
    await ctx.db.insert("activities", {
      ideaId: args.ideaId,
      userId,
      action: "moved",
      details: JSON.stringify({ from: oldStatus, to: args.status }),
      timestamp: Date.now(),
    });
    
    return args.ideaId;
  },
});

export const update = mutation({
  args: {
    ideaId: v.id("ideas"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"))),
    tags: v.optional(v.array(v.string())),
    dueDate: v.optional(v.number()),
    assignedTo: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    
    const idea = await ctx.db.get(args.ideaId);
    if (!idea) {
      throw new Error("Idea not found");
    }
    
    const updates: any = {};
    const changes: any = {};
    
    if (args.title !== undefined) {
      updates.title = args.title;
      changes.title = { from: idea.title, to: args.title };
    }
    if (args.description !== undefined) {
      updates.description = args.description;
      changes.description = { from: idea.description, to: args.description };
    }
    if (args.priority !== undefined) {
      updates.priority = args.priority;
      changes.priority = { from: idea.priority, to: args.priority };
    }
    if (args.tags !== undefined) {
      updates.tags = args.tags;
      changes.tags = { from: idea.tags, to: args.tags };
    }
    if (args.dueDate !== undefined) {
      updates.dueDate = args.dueDate;
      changes.dueDate = { from: idea.dueDate, to: args.dueDate };
    }
    if (args.assignedTo !== undefined) {
      updates.assignedTo = args.assignedTo;
      changes.assignedTo = { from: idea.assignedTo, to: args.assignedTo };
    }
    
    await ctx.db.patch(args.ideaId, updates);
    
    // Log activity
    await ctx.db.insert("activities", {
      ideaId: args.ideaId,
      userId,
      action: "updated",
      details: JSON.stringify(changes),
      timestamp: Date.now(),
    });
    
    return args.ideaId;
  },
});

export const remove = mutation({
  args: {
    ideaId: v.id("ideas"),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    
    const idea = await ctx.db.get(args.ideaId);
    if (!idea) {
      throw new Error("Idea not found");
    }
    
    await ctx.db.delete(args.ideaId);
    
    // Log activity
    await ctx.db.insert("activities", {
      ideaId: args.ideaId,
      userId,
      action: "deleted",
      details: JSON.stringify({ title: idea.title }),
      timestamp: Date.now(),
    });
    
    return args.ideaId;
  },
});

export const getActivities = query({
  args: {
    ideaId: v.id("ideas"),
  },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    
    const activities = await ctx.db
      .query("activities")
      .withIndex("by_idea", (q) => q.eq("ideaId", args.ideaId))
      .order("desc")
      .collect();
    
    // Get user info for each activity
    const activitiesWithUsers = await Promise.all(
      activities.map(async (activity) => {
        const user = await ctx.db.get(activity.userId);
        return {
          ...activity,
          user: user ? { name: user.name, email: user.email } : null,
        };
      })
    );
    
    return activitiesWithUsers;
  },
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAuth(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

export const getFileUrl = mutation({
  args: {
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    return await ctx.storage.getUrl(args.storageId);
  },
});

export const addAttachment = mutation({
  args: {
    ideaId: v.id("ideas"),
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    
    const idea = await ctx.db.get(args.ideaId);
    if (!idea) {
      throw new Error("Idea not found");
    }
    
    const currentAttachments = idea.attachments || [];
    const newAttachments = [...currentAttachments, args.storageId];
    
    await ctx.db.patch(args.ideaId, {
      attachments: newAttachments,
    });
    
    // Log activity
    await ctx.db.insert("activities", {
      ideaId: args.ideaId,
      userId,
      action: "attachment_added",
      details: JSON.stringify({ storageId: args.storageId }),
      timestamp: Date.now(),
    });
    
    return args.ideaId;
  },
});
