
import { useState } from "react";
import { Upload, XCircle, FileImage, FileText, File } from "lucide-react";

interface DocumentUploaderProps {
  type: 'photo' | 'transcript' | 'certificate' | 'supporting';
  files: File[];
  onAddFiles: (files: File[]) => void;
  onRemoveFile: (index: number) => void;
  title: string;
  accept?: string;
  multiple?: boolean;
  required?: boolean;
}

const DocumentUploader = ({
  type,
  files,
  onAddFiles,
  onRemoveFile,
  title,
  multiple = false,
  required = false
}: DocumentUploaderProps) => {
  const getAcceptValue = () => {
    switch (type) {
      case 'photo':
        return ".jpg,.jpeg,.png";
      case 'transcript':
      case 'certificate':
        return ".pdf";
      case 'supporting':
        return ".pdf,.doc,.docx,.jpg,.jpeg,.png";
      default:
        return ".pdf,.doc,.docx,.jpg,.jpeg,.png";
    }
  };

  const getAcceptText = () => {
    switch (type) {
      case 'photo':
        return "JPG, JPEG, PNG";
      case 'transcript':
      case 'certificate':
        return "PDF only";
      case 'supporting':
        return "PDF, DOC, DOCX, JPG, JPEG, PNG";
      default:
        return "";
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('image') || fileType.includes('jpg') || fileType.includes('jpeg') || fileType.includes('png')) {
      return <FileImage className="h-4 w-4 mr-2 text-blue-500" />;
    } else if (fileType.includes('pdf')) {
      return <File className="h-4 w-4 mr-2 text-red-500" />;
    } else {
      return <FileText className="h-4 w-4 mr-2 text-gray-500" />;
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const fileList = Array.from(e.target.files);
      
      // Check file type validation
      const acceptedTypes = getAcceptValue().split(',');
      const invalidFiles = fileList.filter(file => {
        const extension = '.' + file.name.split('.').pop()?.toLowerCase();
        return !acceptedTypes.some(type => type === extension);
      });
      
      if (invalidFiles.length > 0) {
        alert(`Some files have invalid formats. Allowed formats are: ${getAcceptText()}`);
        return;
      }
      
      onAddFiles(fileList);
    }
  };

  return (
    <div>
      <p className="text-sm font-medium mb-2">
        {title} {required && <span className="text-red-500">*</span>}
      </p>
      <div className="border border-dashed border-gray-300 rounded-lg p-4">
        <label className="flex flex-col items-center justify-center cursor-pointer">
          <Upload className="h-8 w-8 text-gray-400 mb-2" />
          <span className="text-sm text-gray-500">Click to upload {title.toLowerCase()}</span>
          <span className="text-xs text-gray-400 mt-1">Allowed formats: {getAcceptText()}</span>
          <input
            type="file"
            accept={getAcceptValue()}
            className="hidden"
            multiple={multiple}
            onChange={handleFileChange}
          />
        </label>
        
        {files.length > 0 && (
          <div className="mt-4 space-y-2">
            {files.map((file, index) => (
              <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                <div className="flex items-center truncate max-w-[180px]">
                  {getFileIcon(file.type || file.name)}
                  <span className="text-sm truncate">{file.name}</span>
                </div>
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
