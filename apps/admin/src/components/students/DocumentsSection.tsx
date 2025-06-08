import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Paperclip, FileImage, File, X, Upload } from "lucide-react";

interface DocumentsSectionProps {
  files: {
    photo: File[];
    transcript: File[];
    certificate: File[];
    supporting: File[];
  };
  setFiles: React.Dispatch<React.SetStateAction<{
    photo: File[];
    transcript: File[];
    certificate: File[];
    supporting: File[];
  }>>;
}

const DocumentsSection = ({ files, setFiles }: DocumentsSectionProps) => {
  const onDrop = useCallback((acceptedFiles: File[], fileType: keyof typeof files) => {
    setFiles(prevFiles => ({
      ...prevFiles,
      [fileType]: [...prevFiles[fileType], ...acceptedFiles],
    }));
  }, [setFiles]);
  
  const removeFile = (file: File, fileType: keyof typeof files) => {
    setFiles(prevFiles => ({
      ...prevFiles,
      [fileType]: prevFiles[fileType].filter(f => f !== file),
    }));
  };

  const documentConfigs = [
    {
      key: 'photo' as const,
      title: 'Photo',
      subtitle: 'JPG, PNG, GIF',
      icon: FileImage,
      accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.gif'] },
      description: 'Student ID photo'
    },
    {
      key: 'transcript' as const,
      title: 'Transcript',
      subtitle: 'PDF only',
      icon: File,
      accept: { 'application/pdf': ['.pdf'] },
      description: 'Academic transcript'
    },
    {
      key: 'certificate' as const,
      title: 'Certificate',
      subtitle: 'PDF only',
      icon: File,
      accept: { 'application/pdf': ['.pdf'] },
      description: 'Graduation certificate'
    },
    {
      key: 'supporting' as const,
      title: 'Supporting',
      subtitle: 'Any format',
      icon: Paperclip,
      accept: {},
      description: 'Additional documents'
    }
  ];

  const createDropzone = (config: typeof documentConfigs[0]) => {
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
      accept: config.accept,
      onDrop: (acceptedFiles) => onDrop(acceptedFiles, config.key),
    });

    const hasFiles = files[config.key].length > 0;
    const IconComponent = config.icon;

    return (
      <div key={config.key} className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium text-gray-900">{config.title}</h4>
            <p className="text-xs text-gray-500">{config.description}</p>
          </div>
          {hasFiles && (
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
              {files[config.key].length}
            </span>
          )}
        </div>
        
        <div
          {...getRootProps()}
          className={`
            relative border-2 border-dashed rounded-lg p-3 cursor-pointer transition-colors
            ${isDragActive 
              ? 'border-blue-400 bg-blue-50' 
              : hasFiles 
                ? 'border-green-300 bg-green-50' 
                : 'border-gray-300 bg-gray-50'
            }
            hover:border-gray-400 hover:bg-gray-100
          `}
        >
          <input {...getInputProps()} />
          <div className="flex items-center justify-center space-x-2">
            <IconComponent className={`w-5 h-5 ${
              isDragActive ? 'text-blue-500' : hasFiles ? 'text-green-600' : 'text-gray-400'
            }`} />
            <div className="text-center">
              <p className="text-sm text-gray-600">
                {isDragActive ? 'Drop here' : hasFiles ? 'Add more' : 'Upload'}
              </p>
              <p className="text-xs text-gray-500">{config.subtitle}</p>
            </div>
          </div>
        </div>

        {hasFiles && (
          <div className="space-y-1 max-h-20 overflow-y-auto">
            {files[config.key].map((file, index) => (
              <div key={index} className="flex items-center justify-between bg-white border rounded px-2 py-1">
                <div className="flex items-center space-x-2 min-w-0 flex-1">
                  <IconComponent className="w-3 h-3 text-gray-400 flex-shrink-0" />
                  <span className="text-xs text-gray-600 truncate" title={file.name}>
                    {file.name}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(file, config.key)}
                  className="text-gray-400 hover:text-red-500 p-1"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 mb-4">
        <Upload className="w-5 h-5 text-gray-400" />
        <h3 className="text-lg font-medium text-gray-900">Documents</h3>
        <span className="text-sm text-gray-500">(Optional)</span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {documentConfigs.map(config => createDropzone(config))}
      </div>
      
      {Object.values(files).some(fileArray => fileArray.length > 0) && (
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Total files: {Object.values(files).reduce((sum, fileArray) => sum + fileArray.length, 0)}
          </p>
        </div>
      )}
    </div>
  );
};

export default DocumentsSection;
