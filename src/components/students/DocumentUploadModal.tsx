
import React, { useState, useEffect, useCallback } from "react";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import DocumentUploader from "./DocumentUploader";

interface DocumentUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpload: (files: File[], documentType: 'photo' | 'transcript' | 'certificate' | 'supporting') => Promise<void>;
}

const DocumentUploadModal = ({ open, onOpenChange, onUpload }: DocumentUploadModalProps) => {
  const [files, setFiles] = useState<File[]>([]);
  const [documentType, setDocumentType] = useState<'photo' | 'transcript' | 'certificate' | 'supporting'>('supporting');
  const [isUploading, setIsUploading] = useState(false);

  // Reset state when modal opens or closes
  useEffect(() => {
    if (open) {
      setFiles([]);
      setDocumentType('supporting');
      setIsUploading(false);
    } else {
      // Clear files when modal closes to prevent memory issues
      setFiles([]);
    }
  }, [open]);

  const handleAddFiles = useCallback((newFiles: File[]) => {
    setFiles(prevFiles => [...prevFiles, ...newFiles]);
  }, []);

  const handleRemoveFile = useCallback((index: number) => {
    setFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
  }, []);

  const handleUpload = async () => {
    if (files.length === 0) return;
    
    setIsUploading(true);
    try {
      await onUpload(files, documentType);
      // Only close the modal if upload was successful
      onOpenChange(false);
    } catch (error) {
      console.error("Error uploading documents:", error);
    } finally {
      setIsUploading(false);
    }
  };

  // Safe dialog close handler
  const handleDialogClose = (open: boolean) => {
    if (!open && !isUploading) {
      onOpenChange(open);
    } else if (!open && isUploading) {
      // Prevent closing while uploading
      return;
    } else {
      onOpenChange(open);
    }
  };

  const getDocumentTypeTitle = () => {
    switch (documentType) {
      case 'photo': return "Student Photo";
      case 'transcript': return "Transcript";
      case 'certificate': return "Certificate";
      case 'supporting': return "Supporting Documents";
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Documents</DialogTitle>
          <DialogDescription>
            Select document type and upload files
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label className="text-base">Document Type</Label>
            <RadioGroup 
              value={documentType} 
              onValueChange={(value) => setDocumentType(value as any)}
              className="grid grid-cols-2 gap-4 mt-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="photo" id="photo" />
                <Label htmlFor="photo">Student Photo</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="transcript" id="transcript" />
                <Label htmlFor="transcript">Transcript</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="certificate" id="certificate" />
                <Label htmlFor="certificate">Certificate</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="supporting" id="supporting" />
                <Label htmlFor="supporting">Supporting Documents</Label>
              </div>
            </RadioGroup>
          </div>
          
          <DocumentUploader
            type={documentType}
            title={getDocumentTypeTitle()}
            files={files}
            onAddFiles={handleAddFiles}
            onRemoveFile={handleRemoveFile}
            multiple={documentType === 'supporting'}
          />
        </div>
        
        <DialogFooter className="flex items-center justify-between mt-4">
          <Button 
            variant="outline" 
            onClick={() => {
              if (!isUploading) {
                onOpenChange(false);
              }
            }}
            disabled={isUploading}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleUpload} 
            disabled={files.length === 0 || isUploading}
            className="bg-primary-500 hover:bg-primary-600"
          >
            {isUploading ? 'Uploading...' : 'Upload'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default React.memo(DocumentUploadModal);
