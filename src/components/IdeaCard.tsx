import { Id } from "../../convex/_generated/dataModel";
import { Calendar, Paperclip, User } from "lucide-react";

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
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, idea._id)}
      onClick={onClick}
      className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-2">
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
      
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-2">
          {idea.assignee && (
            <div className="flex items-center gap-1">
              <User className="w-3 h-3" />
              <span>{idea.assignee.name || idea.assignee.email}</span>
            </div>
          )}
          {idea.attachments && idea.attachments.length > 0 && (
            <div className="flex items-center gap-1">
              <Paperclip className="w-3 h-3" />
              <span>{idea.attachments.length}</span>
            </div>
          )}
        </div>
        
        {idea.dueDate && (
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>{formatDate(idea.dueDate)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
