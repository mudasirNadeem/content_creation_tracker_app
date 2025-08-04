import { Id } from "../../convex/_generated/dataModel";
import { IdeaCard } from "./IdeaCard";

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

interface KanbanColumnProps {
  title: string;
  color: string;
  ideas: Idea[];
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onDragStart: (e: React.DragEvent, ideaId: Id<"ideas">) => void;
  onIdeaClick: (ideaId: Id<"ideas">) => void;
}

export function KanbanColumn({
  title,
  color,
  ideas,
  onDragOver,
  onDrop,
  onDragStart,
  onIdeaClick,
}: KanbanColumnProps) {
  return (
    <div
      className={`${color} rounded-lg p-4 h-[calc(100vh-240px)] overflow-auto`}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-800">{title}</h3>
        <span className="bg-white px-2 py-1 rounded-full text-sm font-medium text-gray-600">
          {ideas.length}
        </span>
      </div>
      
      {/* Sort ideas by lastUpdated before rendering */}
      <div className="space-y-3">
        {[...ideas]
          .sort((a, b) => (b.lastUpdated || b._creationTime) - (a.lastUpdated || a._creationTime))
          .map((idea) => (
            <IdeaCard
              key={idea._id}
              idea={idea}
              onDragStart={onDragStart}
              onClick={() => onIdeaClick(idea._id)}
            />
          ))}
      </div>
    </div>
  );
}
