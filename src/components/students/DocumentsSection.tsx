
import React, { memo, useCallback } from "react";
import DocumentUploader from "./DocumentUploader";

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

// Memoize the DocumentsSection component to prevent unnecessary re-renders
const DocumentsSection = memo(({ files, setFiles }: DocumentsSectionProps) => {
  const handleAddFiles = useCallback((type: 'photo' | 'transcript' | 'certificate' | 'supporting', newFiles: File[]) => {
    setFiles(prev => ({
      ...prev,
      [type]: [...prev[type], ...newFiles]
    }));
  }, [setFiles]);

  const handleRemoveFile = useCallback((type: 'photo' | 'transcript' | 'certificate' | 'supporting', index: number) => {
    setFiles(prev => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index)
    }));
  }, [setFiles]);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Documents</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <DocumentUploader
          type="photo"
          title="Student Photo"
          files={files.photo}
          onAddFiles={(newFiles) => handleAddFiles('photo', newFiles)}
          onRemoveFile={(index) => handleRemoveFile('photo', index)}
          required={true}
        />
        
        <DocumentUploader
          type="transcript"
          title="Transcript"
          files={files.transcript}
          onAddFiles={(newFiles) => handleAddFiles('transcript', newFiles)}
          onRemoveFile={(index) => handleRemoveFile('transcript', index)}
        />
        
        <DocumentUploader
          type="certificate"
          title="Certificate"
          files={files.certificate}
          onAddFiles={(newFiles) => handleAddFiles('certificate', newFiles)}
          onRemoveFile={(index) => handleRemoveFile('certificate', index)}
        />
        
        <DocumentUploader
          type="supporting"
          title="Supporting Documents"
          files={files.supporting}
          onAddFiles={(newFiles) => handleAddFiles('supporting', newFiles)}
          onRemoveFile={(index) => handleRemoveFile('supporting', index)}
          multiple={true}
        />
      </div>
    </div>
  );
});

DocumentsSection.displayName = "DocumentsSection";

export default DocumentsSection;
