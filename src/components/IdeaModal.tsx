import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { X, Save, Upload, MessageCircle, Activity, FileIcon, ExternalLink, Image, FileText, File } from "lucide-react";

interface AttachmentItemProps {
  storageId: Id<"_storage">;
  filename?: string;
  onRemove?: () => void;
}

function getFileIcon(filename: string = "") {
  const ext = filename.toLowerCase().split('.').pop();
  switch (ext) {
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
      return <Image className="w-5 h-5 text-blue-500" />;
    case 'pdf':
    case 'doc':
    case 'docx':
    case 'txt':
      return <FileText className="w-5 h-5 text-red-500" />;
    default:
      return <File className="w-5 h-5 text-gray-500" />;
  }
}

function AttachmentItem({ storageId, filename, onRemove }: AttachmentItemProps) {
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
    <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:shadow-sm transition-shadow">
      <div className="flex items-center gap-3">
        {getFileIcon(filename)}
        <div>
          <span className="text-sm font-medium text-gray-700">
            {filename || `File ${storageId.slice(-6)}`}
          </span>
          <p className="text-xs text-gray-500">Added {new Date().toLocaleDateString()}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-md text-sm font-medium transition-colors"
          >
            View <ExternalLink className="w-3 h-3" />
          </a>
        )}
        {onRemove && (
          <button
            onClick={onRemove}
            className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
            title="Remove attachment"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
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
  const removeAttachment = useMutation(api.ideas.removeAttachment);
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [activeTab, setActiveTab] = useState<"details" | "activity" | "comments">("details");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingFileName, setUploadingFileName] = useState("");
  
  // For new ideas, we'll create a temporary idea first, then update it
  const [currentIdeaId, setCurrentIdeaId] = useState<Id<"ideas"> | undefined>(ideaId);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    if (idea) {
      setTitle(idea.title);
      setDescription(idea.description);
      setPriority(idea.priority || "medium");
      setTags(idea.tags || []);
      setDueDate(idea.dueDate ? new Date(idea.dueDate).toISOString().split('T')[0] : "");
      setHasUnsavedChanges(false);
    } else {
      // Reset form for new idea
      setTitle("");
      setDescription("");
      setPriority("medium");
      setTags([]);
      setDueDate("");
      setHasUnsavedChanges(false);
    }
    setCurrentIdeaId(ideaId);
  }, [idea, ideaId]);

  // Create temporary idea for file uploads if it doesn't exist
  const ensureIdeaExists = async () => {
    if (currentIdeaId) return currentIdeaId;

    try {
      const tempTitle = title.trim() || "Untitled Idea";
      const newIdeaId = await createIdea({
        title: tempTitle,
        description: description,
        priority,
        tags,
        dueDate: dueDate ? new Date(dueDate).getTime() : undefined,
      });
      
      setCurrentIdeaId(newIdeaId);
      setHasUnsavedChanges(false);
      return newIdeaId;
    } catch (error) {
      console.error("Failed to create temporary idea:", error);
      throw error;
    }
  };

  const handleSave = async () => {
    console.log("Saving idea:", { title, description, priority, tags, dueDate, currentIdeaId });
    
    if (!title.trim()) {
      console.log("Title is empty, cannot save");
      return;
    }
    
    try {
      if (currentIdeaId) {
        console.log("Updating existing idea");
        await updateIdea({
          ideaId: currentIdeaId,
          title,
          description,
          priority,
          tags,
          dueDate: dueDate ? new Date(dueDate).getTime() : undefined,
        });
      } else {
        console.log("Creating new idea");
        const newIdeaId = await createIdea({
          title,
          description,
          priority,
          tags,
          dueDate: dueDate ? new Date(dueDate).getTime() : undefined,
        });
        setCurrentIdeaId(newIdeaId);
      }
      setHasUnsavedChanges(false);
      onClose();
    } catch (error) {
      console.error("Failed to save idea:", error);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setHasUnsavedChanges(true);
    switch (field) {
      case 'title':
        setTitle(value);
        break;
      case 'description':
        setDescription(value);
        break;
      case 'priority':
        setPriority(value);
        break;
      case 'tags':
        setTags(value);
        break;
      case 'dueDate':
        setDueDate(value);
        break;
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      const newTags = [...tags, tagInput.trim()];
      handleInputChange('tags', newTags);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const newTags = tags.filter(tag => tag !== tagToRemove);
    handleInputChange('tags', newTags);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      console.error("No file selected");
      return;
    }

    // Add file size limit (10MB)
    const MAX_FILE_SIZE = 100 * 1024 * 1024; // 10MB in bytes
    if (file.size > MAX_FILE_SIZE) {
      alert("File size exceeds 100MB limit");
      return;
    }

    setIsUploading(true);
    setUploadingFileName(file.name);
    setUploadProgress(0);

    try {
      // Ensure idea exists before uploading
      const targetIdeaId = await ensureIdeaExists();
      
      console.log("Generating upload URL for file:", file.name);
      const uploadUrl = await generateUploadUrl();
      
      const xhr = new XMLHttpRequest();
      xhr.open('POST', uploadUrl);
      xhr.setRequestHeader('Content-Type', file.type);
      
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(progress);
        }
      };

      const uploadPromise = new Promise((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status === 200) {
            resolve(JSON.parse(xhr.response));
          } else {
            reject(new Error('Upload failed'));
          }
        };
        xhr.onerror = () => reject(new Error('Upload failed'));
      });

      xhr.send(file);
      const { storageId } = await uploadPromise as { storageId: Id<"_storage"> };
      await addAttachment({ ideaId: targetIdeaId, storageId });
      
    } catch (error) {
      console.error("Failed to upload file:", error);
      alert("Failed to upload file. Please try again.");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      setUploadingFileName("");
    }

    // Clear the input
    event.target.value = '';
  };

  const handleRemoveAttachment = async (storageId: Id<"_storage">) => {
    if (!currentIdeaId) return;
    
    try {
      await removeAttachment({ ideaId: currentIdeaId, storageId });
    } catch (error) {
      console.error("Failed to remove attachment:", error);
      alert("Failed to remove attachment. Please try again.");
    }
  };

  // Get current attachments
  const currentIdea = useQuery(api.ideas.list)?.find(i => i._id === currentIdeaId);
  const attachments = currentIdea?.attachments || [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">
            {ideaId ? "Edit Idea" : "Create New Idea"}
            {hasUnsavedChanges && <span className="text-orange-500 ml-2">*</span>}
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
          {currentIdeaId && (
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
            <form onSubmit={async (e) => { e.preventDefault(); await handleSave(); }} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
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
                  onChange={(value) => handleInputChange('description', value)}
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
                    onChange={(e) => handleInputChange('priority', e.target.value as "low" | "medium" | "high")}
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
                    onChange={(e) => handleInputChange('dueDate', e.target.value)}
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
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTag())}
                    title="Enter tag"
                    aria-label="Enter tag"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Add a tag..."
                  />
                  <button
                    type="button"
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
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Attachments section - available for both new and existing ideas */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Attachments
                </label>
                <div className="space-y-4">
                  <div className="flex items-center gap-4 relative">
                    <input
                      type="file"
                      onChange={(e) => void handleFileUpload(e)}
                      className="hidden"
                      id="file-upload"
                      title="Upload file"
                      aria-label="Upload file"
                      disabled={isUploading}
                    />
                    <label
                      htmlFor="file-upload"
                      className={`flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-100 cursor-pointer transition-colors ${
                        isUploading ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      <Upload className="w-4 h-4" />
                      {isUploading ? "Uploading..." : "Upload File"}
                    </label>

                    {/* Upload Progress */}
                    {isUploading && (
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600 truncate max-w-[200px]">{uploadingFileName}</span>
                          <span className="text-blue-600 font-medium">{uploadProgress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                          <div 
                            className="bg-blue-600 h-full transition-all duration-300 ease-out"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Show info for new ideas */}
                  {!ideaId && (
                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                      <p className="text-sm text-blue-700">
                        💡 <strong>Tip:</strong> You can upload files immediately! The idea will be created automatically when you add your first file.
                      </p>
                    </div>
                  )}

                  {/* Uploaded files */}
                  {attachments.length > 0 && (
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <h4 className="text-sm font-medium text-gray-900 mb-3">Uploaded Files</h4>
                      <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
                        {attachments.map((attachmentId) => (
                          <AttachmentItem 
                            key={attachmentId.toString()} 
                            storageId={attachmentId}
                            onRemove={() => handleRemoveAttachment(attachmentId)}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

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
                  {currentIdeaId ? "Update Idea" : "Create Idea"}
                </button>
              </div>
            </form>
          )}

          {activeTab === "activity" && currentIdeaId && (
            <ActivityFeed ideaId={currentIdeaId} />
          )}

          {activeTab === "comments" && currentIdeaId && (
            <CommentSection ideaId={currentIdeaId} />
          )}
        </div>
      </div>
    </div>
  );
}