
import { useState, useEffect } from "react";
import { Upload, X, Plus } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface DocumentUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpload: (files: File[], type: 'photo' | 'transcript' | 'certificate' | 'supporting') => Promise<void>;
}

type DocumentType = 'photo' | 'transcript' | 'certificate' | 'supporting';

interface FileWithType {
  type: DocumentType;
  files: File[];
}

const DocumentUploadModal = ({ open, onOpenChange, onUpload }: DocumentUploadModalProps) => {
  const [documentTypes, setDocumentTypes] = useState<FileWithType[]>([
    { type: 'photo', files: [] },
    { type: 'transcript', files: [] },
    { type: 'certificate', files: [] },
    { type: 'supporting', files: [] }
  ]);
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<DocumentType>('photo');
  
  // Clear selected files when modal closes or opens
  useEffect(() => {
    if (!open) {
      setDocumentTypes([
        { type: 'photo', files: [] },
        { type: 'transcript', files: [] },
        { type: 'certificate', files: [] },
        { type: 'supporting', files: [] }
      ]);
    }
  }, [open]);
  
  const getAcceptValue = (type: DocumentType) => {
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

  const getAcceptText = (type: DocumentType) => {
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

  const handleFileChange = (type: DocumentType, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const fileList = Array.from(e.target.files);
      
      // Check file type validation
      const acceptedTypes = getAcceptValue(type).split(',');
      const invalidFiles = fileList.filter(file => {
        const extension = '.' + file.name.split('.').pop()?.toLowerCase();
        return !acceptedTypes.some(acceptType => acceptType === extension);
      });
      
      if (invalidFiles.length > 0) {
        toast.error(`Some files have invalid formats. Allowed formats are: ${getAcceptText(type)}`);
        return;
      }
      
      setDocumentTypes(prev => prev.map(item => 
        item.type === type 
          ? { ...item, files: [...item.files, ...fileList] } 
          : item
      ));
    }
  };
  
  const handleRemoveFile = (type: DocumentType, index: number) => {
    setDocumentTypes(prev => prev.map(item => 
      item.type === type 
        ? { ...item, files: item.files.filter((_, i) => i !== index) } 
        : item
    ));
  };

  const handleSubmit = async () => {
    const allDocumentTypes = documentTypes.filter(dt => dt.files.length > 0);
    
    if (allDocumentTypes.length === 0) {
      toast.error("Please select files to upload");
      return;
    }
    
    setIsUploading(true);
    
    try {
      // Upload each document type sequentially
      for (const docType of allDocumentTypes) {
        await onUpload(docType.files, docType.type);
      }
      
      toast.success("All documents uploaded successfully");
      onOpenChange(false);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload some documents");
    } finally {
      setIsUploading(false);
    }
  };
  
  const totalFilesCount = documentTypes.reduce((sum, dt) => sum + dt.files.length, 0);
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Documents</DialogTitle>
          <DialogDescription>
            Select document types and upload files for this student
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as DocumentType)}>
            <TabsList className="grid grid-cols-4 mb-4">
              <TabsTrigger value="photo">Photo</TabsTrigger>
              <TabsTrigger value="transcript">Transcript</TabsTrigger>
              <TabsTrigger value="certificate">Certificate</TabsTrigger>
              <TabsTrigger value="supporting">Supporting</TabsTrigger>
            </TabsList>
            
            {documentTypes.map((docType) => (
              <TabsContent key={docType.type} value={docType.type}>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <label className="flex flex-col items-center justify-center cursor-pointer">
                    <Upload className="h-8 w-8 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-500">Click to select {docType.type} files</span>
                    <span className="text-xs text-gray-400 mt-1">Allowed formats: {getAcceptText(docType.type)}</span>
                    <input
                      type="file"
                      className="hidden"
                      accept={getAcceptValue(docType.type)}
                      multiple={docType.type === 'supporting'}
                      onChange={(e) => handleFileChange(docType.type, e)}
                    />
                  </label>
                </div>
                
                {docType.files.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium mb-2">Selected {docType.type} files:</h4>
                    <div className="max-h-[200px] overflow-y-auto space-y-2">
                      {docType.files.map((file, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                          <span className="text-sm truncate max-w-[250px]">{file.name}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveFile(docType.type, index)}
                            className="text-gray-500 hover:text-red-500"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
          
          {totalFilesCount > 0 && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm font-medium">Total documents to upload: {totalFilesCount}</p>
              <ul className="mt-1 text-xs text-gray-500">
                {documentTypes.map(dt => dt.files.length > 0 && (
                  <li key={dt.type}>• {dt.type}: {dt.files.length} file(s)</li>
                ))}
              </ul>
            </div>
          )}
        </div>
        
        <div className="flex justify-end gap-2">
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button 
            onClick={handleSubmit} 
            disabled={totalFilesCount === 0 || isUploading}
            className="bg-primary-500 hover:bg-primary-600 text-white"
          >
            {isUploading ? 'Uploading...' : 'Upload All Documents'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentUploadModal;
