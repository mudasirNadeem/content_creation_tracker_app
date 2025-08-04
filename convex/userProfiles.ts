import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const updateUserProfile = mutation({
  args: {
    name: v.string(),
    phone: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  },
  async handler(ctx, args) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const userId = identity.tokenIdentifier;

    // Search for existing profile
    const existing = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (existing) {
      // Update existing profile
      await ctx.db.patch(existing._id, {
        name: args.name,
        phone: args.phone,
        imageUrl: args.imageUrl,
      });
      return existing._id;
    } else {
      // Create new profile
      return await ctx.db.insert("userProfiles", {
        userId,
        name: args.name,
        phone: args.phone,
        imageUrl: args.imageUrl,
      });
    }
  },
});

export const getUserProfile = query({
  async handler(ctx) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const userId = identity.tokenIdentifier;
    return await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
  },
});
