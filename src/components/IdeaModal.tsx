import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { X, Save, Upload, MessageCircle, Activity, FileIcon, ExternalLink } from "lucide-react";

function AttachmentItem({ storageId }: { storageId: Id<"_storage"> }) {
  const [url, setUrl] = useState<string | null>(null);
  const getFileUrl = useMutation(api.ideas.getFileUrl);

  useEffect(() => {
    async function fetchUrl() {
      try {
        const fileUrl = await getFileUrl({ storageId });
        setUrl(fileUrl);
      } catch (error) {
        console.error("Failed to get file URL:", error);
      }
    }
    fetchUrl();
  }, [storageId, getFileUrl]);

  return (
    <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
      <div className="flex items-center gap-2">
        <FileIcon className="w-4 h-4 text-gray-500" />
        <span className="text-sm text-gray-700">File {storageId.slice(-6)}</span>
      </div>
      {url && (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm"
        >
          View <ExternalLink className="w-3 h-3" />
        </a>
      )}
    </div>
  );
}
import { MarkdownEditor } from "./MarkdownEditor";
import { ActivityFeed } from "./ActivityFeed";
import { CommentSection } from "./CommentSection";

interface IdeaModalProps {
  ideaId?: Id<"ideas">;
  onClose: () => void;
}

export function IdeaModal({ ideaId, onClose }: IdeaModalProps) {
  const idea = useQuery(api.ideas.list)?.find(i => i._id === ideaId);
  const createIdea = useMutation(api.ideas.create);
  const updateIdea = useMutation(api.ideas.update);
  const generateUploadUrl = useMutation(api.ideas.generateUploadUrl);
  const addAttachment = useMutation(api.ideas.addAttachment);
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [activeTab, setActiveTab] = useState<"details" | "activity" | "comments">("details");
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (idea) {
      setTitle(idea.title);
      setDescription(idea.description);
      setPriority(idea.priority || "medium");
      setTags(idea.tags || []);
      setDueDate(idea.dueDate ? new Date(idea.dueDate).toISOString().split('T')[0] : "");
    } else {
      // Reset form for new idea
      setTitle("");
      setDescription("");
      setPriority("medium");
      setTags([]);
      setDueDate("");
    }
  }, [idea, ideaId]);

  const handleSave = async () => {
    console.log("Saving idea:", { title, description, priority, tags, dueDate, ideaId });
    
    if (!title.trim()) {
      console.log("Title is empty, cannot save");
      return;
    }
    
    try {
      if (ideaId && idea) {
        console.log("Updating existing idea");
        await updateIdea({
          ideaId,
          title,
          description,
          priority,
          tags,
          dueDate: dueDate ? new Date(dueDate).getTime() : undefined,
        });
      } else {
        console.log("Creating new idea");
        await createIdea({
          title,
          description,
          priority,
          tags,
          dueDate: dueDate ? new Date(dueDate).getTime() : undefined,
        });
      }
      onClose();
    } catch (error) {
      console.error("Failed to save idea:", error);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !ideaId) {
      console.error("No file selected or no idea ID");
      return;
    }

    // Add file size limit (10MB)
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > MAX_FILE_SIZE) {
      alert("File size exceeds 10MB limit");
      return;
    }

    setIsUploading(true);
    try {
      console.log("Generating upload URL for file:", file.name);
      const uploadUrl = await generateUploadUrl();
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      
      if (result.ok) {
        const { storageId } = await result.json();
        await addAttachment({ ideaId, storageId });
      }
    } catch (error) {
      console.error("Failed to upload file:", error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">
            {ideaId ? "Edit Idea" : "Create New Idea"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Close modal"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex border-b">
          <button
            onClick={() => setActiveTab("details")}
            className={`px-6 py-3 font-medium ${
              activeTab === "details"
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Details
          </button>
          {ideaId && (
            <>
              <button
                onClick={() => setActiveTab("activity")}
                className={`px-6 py-3 font-medium flex items-center gap-2 ${
                  activeTab === "activity"
                    ? "border-b-2 border-blue-500 text-blue-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <Activity className="w-4 h-4" />
                Activity
              </button>
              <button
                onClick={() => setActiveTab("comments")}
                className={`px-6 py-3 font-medium flex items-center gap-2 ${
                  activeTab === "comments"
                    ? "border-b-2 border-blue-500 text-blue-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <MessageCircle className="w-4 h-4" />
                Comments
              </button>
            </>
          )}
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {activeTab === "details" && (
            <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter idea title..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <MarkdownEditor
                  value={description}
                  onChange={setDescription}
                  placeholder="Describe your content idea..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as "low" | "medium" | "high")}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    title="Priority"
                    aria-label="Select priority level"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleAddTag()}
                    title="Enter tag"
                    aria-label="Enter tag"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Add a tag..."
                  />
                  <button
                    onClick={handleAddTag}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center gap-1"
                    >
                      {tag}
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {ideaId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Attachments
                  </label>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <input
                        type="file"
                        onChange={(e) => void handleFileUpload(e)}
                        className="hidden"
                        id="file-upload"
                        title="Upload file"
                        aria-label="Upload file"
                      />
                      <label
                        htmlFor="file-upload"
                        className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer"
                      >
                        <Upload className="w-4 h-4" />
                        {isUploading ? "Uploading..." : "Upload File"}
                      </label>
                    </div>
                    
                    {/* Display attachments */}
                    {idea?.attachments && idea.attachments.length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Uploaded Files</h4>
                        <div className="space-y-2">
                          {idea.attachments.map((attachmentId) => (
                            <AttachmentItem key={attachmentId.toString()} storageId={attachmentId} />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-6 border-t mt-6">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!title.trim()}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  <Save className="w-4 h-4" />
                  {ideaId ? "Update Idea" : "Create Idea"}
                </button>
              </div>
            </form>
          )}

          {activeTab === "activity" && ideaId && (
            <ActivityFeed ideaId={ideaId} />
          )}

          {activeTab === "comments" && ideaId && (
            <CommentSection ideaId={ideaId} />
          )}
        </div>
      </div>
    </div>
  );
}
