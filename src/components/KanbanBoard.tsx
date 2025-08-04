import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { KanbanColumn } from "./KanbanColumn";
import { IdeaModal } from "./IdeaModal";
import { Plus } from "lucide-react";

type Status = "idea" | "todo" | "in_progress" | "done";

const COLUMNS: { status: Status; title: string; color: string }[] = [
  { status: "idea", title: "Ideas", color: "bg-blue-100 border-blue-200" },
  { status: "todo", title: "To Do", color: "bg-yellow-100 border-yellow-200" },
  { status: "in_progress", title: "In Progress", color: "bg-orange-100 border-orange-200" },
  { status: "done", title: "Done", color: "bg-green-100 border-green-200" },
];

export function KanbanBoard() {
  const ideas = useQuery(api.ideas.list) || [];
  const updateStatus = useMutation(api.ideas.updateStatus);
  const [selectedIdea, setSelectedIdea] = useState<Id<"ideas"> | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const handleDragStart = (e: React.DragEvent, ideaId: Id<"ideas">) => {
    e.dataTransfer.setData("text/plain", ideaId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, status: Status) => {
    e.preventDefault();
    const ideaId = e.dataTransfer.getData("text/plain") as Id<"ideas">;
    
    if (ideaId) {
      try {
        await updateStatus({ ideaId, status });
      } catch (error) {
        console.error("Failed to update status:", error);
      }
    }
  };

  const getIdeasByStatus = (status: Status) => {
    return ideas.filter((idea) => idea.status === status);
  };

  return (
    <div className="flex-1">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-900">Project Board</h2>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Idea
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {COLUMNS.map((column) => (
          <KanbanColumn
            key={column.status}
            title={column.title}
            color={column.color}
            ideas={getIdeasByStatus(column.status)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, column.status)}
            onDragStart={handleDragStart}
            onIdeaClick={setSelectedIdea}
          />
        ))}
      </div>

      {selectedIdea && (
        <IdeaModal
          ideaId={selectedIdea}
          onClose={() => setSelectedIdea(null)}
        />
      )}

      {isCreateModalOpen && (
        <IdeaModal
          onClose={() => setIsCreateModalOpen(false)}
        />
      )}
    </div>
  );
}
