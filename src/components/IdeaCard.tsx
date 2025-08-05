import { Id } from "../../convex/_generated/dataModel";
import { Calendar, Paperclip, User, Trash2 } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

interface Idea {
  _id: Id<"ideas">;
  title: string;
  description: string;
  status: "idea" | "todo" | "in_progress" | "done";
  createdBy: Id<"users">;
  assignedTo?: Id<"users">;
  priority?: "low" | "medium" | "high";
  tags?: string[];
  dueDate?: number;
  attachments?: Id<"_storage">[];
  creator: { name?: string; email?: string } | null;
  assignee: { name?: string; email?: string } | null;
  _creationTime: number;
  lastUpdated: number;
}

interface IdeaCardProps {
  idea: Idea;
  onDragStart: (e: React.DragEvent, ideaId: Id<"ideas">) => void;
  onClick: () => void;
}

const PRIORITY_COLORS = {
  low: "bg-green-100 text-green-800",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-red-100 text-red-800",
};

export function IdeaCard({ idea, onDragStart, onClick }: IdeaCardProps) {
  const deleteIdea = useMutation(api.ideas.remove);
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  const formatRelativeTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return formatDate(timestamp);
  };

  return (
    <div
      draggable="true"
      onDragStart={(e) => onDragStart(e, idea._id)}
      className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 cursor-move hover:shadow-md transition-shadow group relative"
    >
      <div 
        className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => {
          e.stopPropagation(); // Prevent opening modal
          if (confirm('Are you sure you want to delete this task?')) {
            void deleteIdea({ ideaId: idea._id });
          }
        }}
      >
        <Trash2 className="w-4 h-4 text-red-500 hover:text-red-700 cursor-pointer" />
      </div>

      <div onClick={onClick}>
        <div className="flex flex-col gap-2">
          <div className="flex items-start justify-between">
            <h4 className="font-medium text-gray-900 text-sm line-clamp-2">
              {idea.title}
            </h4>
            {idea.priority && (
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  PRIORITY_COLORS[idea.priority]
                }`}
              >
                {idea.priority}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
          </div>
        </div>

        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
          {idea.description}
        </p>

        {idea.tags && idea.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {idea.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs"
              >
                {tag}
              </span>
            ))}
            {idea.tags.length > 3 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                +{idea.tags.length - 3}
              </span>
            )}
          </div>
        )}

        <div className="flex flex-col gap-2 text-xs text-gray-500">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 w-full">
              {idea.assignee && (
                <div className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  <span>{idea.assignee.name || idea.assignee.email}</span>
                </div>
              )}
              {idea.attachments && idea.attachments.length > 0 && (
                
                <div className="flex !w-[100%] items-center justify-between gap-1">
                  <div className="flex items-center gap-1">
                  <Paperclip className="w-3 h-3" />
                  <span>{idea.attachments.length}</span>
                   </div>
                    <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span className="text-gray-600">{formatDate(idea._creationTime)}</span>
              </div>
                </div>
              )}
            </div>
            
            {idea.dueDate && (
     <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span className="text-gray-600">{formatDate(idea._creationTime)}</span>
              </div>
            )}
          </div>
          
          {idea.creator?.email && (
            <div className="flex items-center justify-between gap-1 pt-1 border-t border-gray-100">
              <div className="flex items-center gap-1">
                <User className="w-3 h-3" />
                <span className="text-gray-600">{idea.creator.email}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
