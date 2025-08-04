import { useState } from "react";
import { Eye, Edit } from "lucide-react";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function MarkdownEditor({ value, onChange, placeholder }: MarkdownEditorProps) {
  const [isPreview, setIsPreview] = useState(false);

  const renderMarkdown = (text: string) => {
    // Simple markdown rendering - you could use a library like marked for more features
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 rounded">$1</code>')
      .replace(/\n/g, '<br>');
  };

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between bg-gray-50 px-3 py-2 border-b">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPreview(false)}
            className={`flex items-center gap-1 px-2 py-1 rounded text-sm ${
              !isPreview ? "bg-white shadow-sm" : "hover:bg-gray-100"
            }`}
          >
            <Edit className="w-3 h-3" />
            Edit
          </button>
          <button
            onClick={() => setIsPreview(true)}
            className={`flex items-center gap-1 px-2 py-1 rounded text-sm ${
              isPreview ? "bg-white shadow-sm" : "hover:bg-gray-100"
            }`}
          >
            <Eye className="w-3 h-3" />
            Preview
          </button>
        </div>
        <span className="text-xs text-gray-500">
          Supports **bold**, *italic*, `code`
        </span>
      </div>
      
      {isPreview ? (
        <div
          className="p-3 min-h-32 prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(value) }}
        />
      ) : (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full p-3 min-h-32 resize-none focus:outline-none"
        />
      )}
    </div>
  );
}
