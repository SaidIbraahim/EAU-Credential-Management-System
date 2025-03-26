
import { useState } from "react";
import { Upload, XCircle } from "lucide-react";

interface DocumentUploaderProps {
  type: 'photo' | 'transcript' | 'certificate' | 'supporting';
  files: File[];
  onAddFiles: (files: File[]) => void;
  onRemoveFile: (index: number) => void;
  title: string;
  accept?: string;
  multiple?: boolean;
}

const DocumentUploader = ({
  type,
  files,
  onAddFiles,
  onRemoveFile,
  title,
  accept = ".pdf,.doc,.docx,.jpg,.jpeg,.png",
  multiple = false
}: DocumentUploaderProps) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const fileList = Array.from(e.target.files);
      onAddFiles(fileList);
    }
  };

  return (
    <div>
      <p className="text-sm font-medium mb-2">{title}</p>
      <div className="border border-dashed border-gray-300 rounded-lg p-4">
        <label className="flex flex-col items-center justify-center cursor-pointer">
          <Upload className="h-8 w-8 text-gray-400 mb-2" />
          <span className="text-sm text-gray-500">Click to upload {title.toLowerCase()}</span>
          <input
            type="file"
            accept={type === 'photo' ? "image/*" : accept}
            className="hidden"
            multiple={multiple}
            onChange={handleFileChange}
          />
        </label>
        
        {files.length > 0 && (
          <div className="mt-4 space-y-2">
            {files.map((file, index) => (
              <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                <span className="text-sm truncate max-w-[180px]">{file.name}</span>
                <button
                  type="button"
                  onClick={() => onRemoveFile(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  <XCircle className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentUploader;
