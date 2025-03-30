
import { useState, useEffect } from "react";
import { Upload, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";

interface DocumentUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpload: (files: File[], type: 'photo' | 'transcript' | 'certificate' | 'supporting') => Promise<void>;
}

const DocumentUploadModal = ({ open, onOpenChange, onUpload }: DocumentUploadModalProps) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [documentType, setDocumentType] = useState<'photo' | 'transcript' | 'certificate' | 'supporting'>('supporting');
  const [isUploading, setIsUploading] = useState(false);
  
  // Clear selected files when modal closes or opens
  useEffect(() => {
    setSelectedFiles([]);
    // Release any object URLs when closing the modal
    return () => {
      // Cleanup function to ensure we don't leak memory
      if (selectedFiles.length > 0) {
        setSelectedFiles([]);
      }
    };
  }, [open]);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };
  
  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };
  
  const getAcceptValue = () => {
    switch (documentType) {
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

  const handleSubmit = async () => {
    if (selectedFiles.length === 0) {
      toast.error("Please select files to upload");
      return;
    }
    
    try {
      setIsUploading(true);
      await onUpload(selectedFiles, documentType);
      onOpenChange(false);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload documents");
    } finally {
      setIsUploading(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Documents</DialogTitle>
          <DialogDescription>
            Select document type and upload files for this student
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Document Type</Label>
            <RadioGroup 
              value={documentType} 
              onValueChange={(val) => setDocumentType(val as any)}
              className="flex flex-col space-y-1"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="photo" id="photo" />
                <Label htmlFor="photo" className="cursor-pointer">Student Photo (JPEG, PNG)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="transcript" id="transcript" />
                <Label htmlFor="transcript" className="cursor-pointer">Transcript (PDF)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="certificate" id="certificate" />
                <Label htmlFor="certificate" className="cursor-pointer">Certificate (PDF)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="supporting" id="supporting" />
                <Label htmlFor="supporting" className="cursor-pointer">Supporting Documents (PDF, DOC, etc.)</Label>
              </div>
            </RadioGroup>
          </div>
          
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <label className="flex flex-col items-center justify-center cursor-pointer">
              <Upload className="h-8 w-8 text-gray-400 mb-2" />
              <span className="text-sm text-gray-500">Click to select files</span>
              <input
                type="file"
                className="hidden"
                accept={getAcceptValue()}
                multiple={documentType === 'supporting'}
                onChange={handleFileChange}
              />
            </label>
          </div>
          
          {selectedFiles.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium mb-2">Selected Files:</h4>
              <div className="max-h-[200px] overflow-y-auto space-y-2">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                    <span className="text-sm truncate max-w-[250px]">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(index)}
                      className="text-gray-500 hover:text-red-500"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <div className="flex justify-end gap-2">
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button 
            onClick={handleSubmit} 
            disabled={selectedFiles.length === 0 || isUploading}
            className="bg-primary-500 hover:bg-primary-600 text-white"
          >
            {isUploading ? 'Uploading...' : 'Upload'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentUploadModal;
