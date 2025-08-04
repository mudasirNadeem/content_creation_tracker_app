import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Clock, User, ArrowRight, MessageCircle, Paperclip, Edit, Trash2 } from "lucide-react";

interface ActivityFeedProps {
  ideaId: Id<"ideas">;
}

export function ActivityFeed({ ideaId }: ActivityFeedProps) {
  const activities = useQuery(api.ideas.getActivities, { ideaId }) || [];

  const getActivityIcon = (action: string) => {
    switch (action) {
      case "created":
        return <User className="w-4 h-4 text-green-600" />;
      case "updated":
        return <Edit className="w-4 h-4 text-blue-600" />;
      case "moved":
        return <ArrowRight className="w-4 h-4 text-purple-600" />;
      case "commented":
        return <MessageCircle className="w-4 h-4 text-orange-600" />;
      case "attachment_added":
        return <Paperclip className="w-4 h-4 text-gray-600" />;
      case "deleted":
        return <Trash2 className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const formatActivityMessage = (activity: any) => {
    const userName = activity.user?.name || activity.user?.email || "Unknown user";
    
    try {
      const details = JSON.parse(activity.details);
      
      switch (activity.action) {
        case "created":
          return `${userName} created this idea`;
        case "updated":
          const changes = Object.keys(details);
          return `${userName} updated ${changes.join(", ")}`;
        case "moved":
          return `${userName} moved from ${details.from} to ${details.to}`;
        case "commented":
          return `${userName} added a comment`;
        case "attachment_added":
          return `${userName} added an attachment`;
        case "deleted":
          return `${userName} deleted this idea`;
        default:
          return `${userName} performed an action`;
      }
    } catch {
      return `${userName} performed an action`;
    }
  };

  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div className="space-y-4">
      <h3 className="font-medium text-gray-900">Activity History</h3>
      
      {activities.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No activity yet</p>
      ) : (
        <div className="space-y-3">
          {activities.map((activity) => (
            <div key={activity._id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="flex-shrink-0 mt-0.5">
                {getActivityIcon(activity.action)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900">
                  {formatActivityMessage(activity)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {formatTime(activity.timestamp)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
