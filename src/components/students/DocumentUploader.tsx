
import { useState, useCallback } from "react";
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
  const [isDragging, setIsDragging] = useState(false);

  const getAcceptValue = () => {
    switch (type) {
      case 'photo':
        return ".jpg,.jpeg,.png";
      case 'transcript':
        return ".pdf";
      case 'certificate':
        return ".pdf";
      case 'supporting':
        return ".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png";
      default:
        return ".pdf,.doc,.docx,.jpg,.jpeg,.png";
    }
  };

  const getAcceptText = () => {
    switch (type) {
      case 'photo':
        return "JPG, JPEG, PNG";
      case 'transcript':
        return "PDF only";
      case 'certificate':
        return "PDF only";
      case 'supporting':
        return "PDF, DOC, DOCX, Excel, JPG, JPEG, PNG";
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

  const validateFiles = (fileList: File[]) => {
    // Check file type validation
    const acceptedTypes = getAcceptValue().split(',');
    const invalidFiles = fileList.filter(file => {
      const extension = '.' + file.name.split('.').pop()?.toLowerCase();
      return !acceptedTypes.some(type => type === extension);
    });
    
    if (invalidFiles.length > 0) {
      alert(`Some files have invalid formats. Allowed formats are: ${getAcceptText()}`);
      return false;
    }
    
    return true;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const fileList = Array.from(e.target.files);
      
      if (validateFiles(fileList)) {
        onAddFiles(fileList);
      }
    }
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const fileList = Array.from(e.dataTransfer.files);
      
      if (validateFiles(fileList)) {
        onAddFiles(multiple ? fileList : [fileList[0]]);
      }
    }
  }, [multiple, onAddFiles]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  return (
    <div>
      <p className="text-sm font-medium mb-2">
        {title} {required && <span className="text-red-500">*</span>}
      </p>
      <div 
        className={`border border-dashed rounded-lg p-4 transition-colors ${
          isDragging ? 'border-primary bg-primary/5' : 'border-gray-300'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <label className="flex flex-col items-center justify-center cursor-pointer">
          <Upload className={`h-8 w-8 mb-2 ${isDragging ? 'text-primary' : 'text-gray-400'}`} />
          <span className="text-sm text-gray-500">
            {isDragging ? 'Drop files here' : 'Drag & drop or click to upload'}
          </span>
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
