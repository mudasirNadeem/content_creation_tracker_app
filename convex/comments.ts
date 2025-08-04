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
  args: {
    ideaId: v.id("ideas"),
  },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_idea", (q) => q.eq("ideaId", args.ideaId))
      .order("asc")
      .collect();
    
    // Get user info for each comment
    const commentsWithUsers = await Promise.all(
      comments.map(async (comment) => {
        const user = await ctx.db.get(comment.userId);
        return {
          ...comment,
          user: user ? { name: user.name, email: user.email } : null,
        };
      })
    );
    
    return commentsWithUsers;
  },
});

export const create = mutation({
  args: {
    ideaId: v.id("ideas"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    
    const commentId = await ctx.db.insert("comments", {
      ideaId: args.ideaId,
      userId,
      content: args.content,
      timestamp: Date.now(),
    });
    
    // Log activity
    await ctx.db.insert("activities", {
      ideaId: args.ideaId,
      userId,
      action: "commented",
      details: JSON.stringify({ content: args.content.substring(0, 100) }),
      timestamp: Date.now(),
    });
    
    return commentId;
  },
});
