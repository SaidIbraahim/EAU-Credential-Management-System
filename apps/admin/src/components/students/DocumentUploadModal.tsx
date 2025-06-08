
import { useState, useEffect, useCallback } from "react";
import { Upload, X, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface DocumentUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpload: (files: File[], type: 'photo' | 'transcript' | 'certificate' | 'supporting') => Promise<void>;
}

type DocumentType = {
  type: 'photo' | 'transcript' | 'certificate' | 'supporting';
  title: string;
  description: string;
  accept: string[];
  maxFiles?: number;
};

type DocumentFile = {
  type: 'photo' | 'transcript' | 'certificate' | 'supporting';
  files: File[];
}

const DocumentUploadModal = ({
  open,
  onOpenChange,
  onUpload,
}: DocumentUploadModalProps) => {
  const [uploadFiles, setUploadFiles] = useState<DocumentFile[]>([
    { type: 'photo', files: [] },
    { type: 'transcript', files: [] },
    { type: 'certificate', files: [] },
    { type: 'supporting', files: [] },
  ]);
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<'photo' | 'transcript' | 'certificate' | 'supporting'>('photo');
  
  useEffect(() => {
    // Reset files when modal is opened
    if (open) {
      setUploadFiles([
        { type: 'photo', files: [] },
        { type: 'transcript', files: [] },
        { type: 'certificate', files: [] },
        { type: 'supporting', files: [] },
      ]);
      setIsUploading(false);
    }
  }, [open]);
  
  const documentTypes: DocumentType[] = [
    {
      type: 'photo',
      title: 'Photos',
      description: 'Upload student photos (ID photos, portraits)',
      accept: ['.jpg', '.jpeg', '.png'],
    },
    {
      type: 'transcript',
      title: 'Transcripts',
      description: 'Upload academic transcripts',
      accept: ['.pdf'],
    },
    {
      type: 'certificate',
      title: 'Certificates',
      description: 'Upload graduation certificates or awards',
      accept: ['.pdf'],
    },
    {
      type: 'supporting',
      title: 'Supporting Documents',
      description: 'Upload any additional supporting documents',
      accept: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.jpg', '.jpeg', '.png'],
    },
  ];
  
  const getAcceptValue = (type: string) => {
    const docType = documentTypes.find(dt => dt.type === type);
    return docType ? docType.accept.join(',') : '*/*';
  };
  
  const handleFileChange = (
    docType: 'photo' | 'transcript' | 'certificate' | 'supporting', 
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const fileList = Array.from(e.target.files);
    
    // Check file size (limit to 5MB per file)
    const oversizedFiles = fileList.filter(file => file.size > 5 * 1024 * 1024);
    
    if (oversizedFiles.length > 0) {
      toast.error(`${oversizedFiles.length} file(s) exceed the 5MB size limit`);
      return;
    }
    
    setUploadFiles(prev => {
      return prev.map(item => 
        item.type === docType 
          ? { ...item, files: [...item.files, ...fileList] } 
          : item
      );
    });
    
    // Clear the input value so the same file can be selected again if needed
    if (e.target.value) {
      e.target.value = '';
    }
  };
  
  const removeFile = (docType: string, fileIndex: number) => {
    setUploadFiles(prev => 
      prev.map(item => 
        item.type === docType 
          ? { 
              ...item, 
              files: item.files.filter((_, index) => index !== fileIndex) 
            } 
          : item
      )
    );
  };
  
  const handleUpload = async () => {
    const allDocuments = uploadFiles.filter(item => item.files.length > 0);
    
    if (allDocuments.length === 0) {
      toast.error("Please select at least one file to upload");
      return;
    }
    
    setIsUploading(true);
    
    try {
      // Upload each type of document
      for (const doc of allDocuments) {
        if (doc.files.length > 0) {
          await onUpload(doc.files, doc.type);
        }
      }
      
      onOpenChange(false);
      toast.success("All documents uploaded successfully");
    } catch (error) {
      console.error("Error uploading documents:", error);
      toast.error("Error uploading documents");
    } finally {
      setIsUploading(false);
    }
  };
  
  const totalFiles = uploadFiles.reduce((total, item) => total + item.files.length, 0);
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Upload Student Documents</DialogTitle>
          <DialogDescription>
            Upload document files for this student. Supported formats include PDF, DOCX, JPG, and PNG.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
          <TabsList className="grid grid-cols-4 mb-4">
            {documentTypes.map((docType) => (
              <TabsTrigger key={docType.type} value={docType.type} className="relative">
                {docType.title}
                {uploadFiles.find(item => item.type === docType.type)?.files.length ? (
                  <span className="absolute -top-1 -right-1 bg-primary-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {uploadFiles.find(item => item.type === docType.type)?.files.length}
                  </span>
                ) : null}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {documentTypes.map((docType) => (
            <TabsContent key={docType.type} value={docType.type}>
              <div className="mb-4">
                <p className="text-sm text-gray-500 mb-4">{docType.description}</p>
                
                <div className="border rounded-lg bg-gray-50 p-4">
                  <div className="flex items-center justify-center w-full">
                    <label 
                      htmlFor={`file-upload-${docType.type}`}
                      className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-100 bg-white"
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="h-10 w-10 text-gray-400 mb-2" />
                        <p className="mb-2 text-sm text-gray-500 text-center">
                          <span className="font-semibold">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">
                          {docType.accept.join(', ')} (max 5MB per file)
                        </p>
                      </div>
                      <input 
                        id={`file-upload-${docType.type}`}
                        type="file"
                        className="hidden"
                        accept={getAcceptValue(docType.type)}
                        multiple={true}
                        onChange={(e) => handleFileChange(docType.type, e)}
                      />
                    </label>
                  </div>
                  
                  {uploadFiles.find(item => item.type === docType.type)?.files.length ? (
                    <div className="mt-4">
                      <p className="text-sm font-medium mb-2">Selected files:</p>
                      <div className="max-h-48 overflow-y-auto space-y-2">
                        {uploadFiles.find(item => item.type === docType.type)?.files.map((file, index) => (
                          <div key={index} className="flex items-center justify-between bg-white p-2 rounded border">
                            <div className="truncate flex-1">
                              <p className="truncate text-sm">{file.name}</p>
                              <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => removeFile(docType.type, index)}
                              className="ml-2 text-gray-500 hover:text-red-500"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>
        
        <div className="flex items-center justify-between mt-2">
          <div className="text-sm">
            {totalFiles} file{totalFiles !== 1 ? "s" : ""} selected
          </div>
          <div className="flex gap-2">
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button 
              onClick={handleUpload} 
              disabled={isUploading || totalFiles === 0}
              className="bg-primary-500 hover:bg-primary-600 text-white"
            >
              {isUploading ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-t-transparent"></div>
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload {totalFiles > 0 ? `${totalFiles} file${totalFiles !== 1 ? 's' : ''}` : ''}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentUploadModal;
