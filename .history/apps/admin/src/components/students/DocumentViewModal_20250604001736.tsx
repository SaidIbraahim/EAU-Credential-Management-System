import React, { useState, useMemo, useCallback } from "react";
import { Document } from "@/types";
import { Eye, Download, Trash2, FileText, FileImage, File as FileIcon, Filter } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem, DropdownMenuCheckboxItem } from "@/components/ui/dropdown-menu";

interface DocumentViewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documents: Document[];
  onDeleteDocument?: (id: number) => Promise<void>;
}

const DocumentViewModal = ({
  open,
  onOpenChange,
  documents,
  onDeleteDocument,
}: DocumentViewModalProps) => {
  const [filterType, setFilterType] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [viewingDocument, setViewingDocument] = useState<Document | null>(null);
  
  const getFileIcon = useCallback((fileType?: string, fileName?: string) => {
    const name = fileName?.toLowerCase() || '';
    const type = fileType?.toLowerCase() || '';
    
    if (type.includes('image') || name.match(/\.(jpg|jpeg|png|gif|webp)$/)) {
      return <FileImage className="h-4 w-4 mr-2 text-blue-500" />;
    } else if (type.includes('pdf') || name.includes('.pdf')) {
      return <FileText className="h-4 w-4 mr-2 text-red-500" />;
    } else {
      return <FileText className="h-4 w-4 mr-2 text-gray-500" />;
    }
  }, []);

  const getDocumentTypeColor = useCallback((type: string) => {
    switch (type?.toUpperCase()) {
      case 'PHOTO':
        return "bg-blue-100 text-blue-800 border-blue-200";
      case 'TRANSCRIPT':
        return "bg-amber-100 text-amber-800 border-amber-200";
      case 'CERTIFICATE':
        return "bg-green-100 text-green-800 border-green-200";
      case 'SUPPORTING':
        return "bg-purple-100 text-purple-800 border-purple-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  }, []);

  const filteredDocuments = useMemo(() => {
    return documents.filter(doc => {
      const matchesType = filterType === "" || doc.documentType === filterType;
      const matchesSearch = searchTerm === "" || 
        doc.fileName.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesType && matchesSearch;
    });
  }, [documents, filterType, searchTerm]);

  const handleView = useCallback((doc: Document) => {
    // For images, show them in the modal
    setViewingDocument(doc);
    
    // For PDFs and other files, open in new tab too
    if (!(doc.fileType?.includes('image') || 
         doc.fileName.match(/\.(jpg|jpeg|png|gif|webp)$/i))) {
      // Use presigned URL if available, otherwise fall back to fileUrl
      const url = doc.presignedUrl || doc.fileUrl;
      window.open(url, '_blank');
    }
  }, []);

  const handleDownload = useCallback((doc: Document) => {
    try {
      const link = document.createElement('a');
      // Use presigned URL if available, otherwise fall back to fileUrl
      link.href = doc.presignedUrl || doc.fileUrl;
      link.download = doc.fileName;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Document downloaded successfully");
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download document");
    }
  }, []);

  const handleCloseViewer = useCallback(() => {
    setViewingDocument(null);
  }, []);

  const isImageFile = useCallback((doc: Document) => {
    return doc.fileType?.includes('image') || 
           doc.fileName.match(/\.(jpg|jpeg|png|gif|webp)$/i);
  }, []);

  // If we're viewing a specific document, show that view
  if (viewingDocument) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex justify-between items-center">
              <span>Viewing: {viewingDocument.fileName}</span>
              <Button variant="ghost" size="sm" onClick={handleCloseViewer}>
                Back to all documents
              </Button>
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="mb-4 flex justify-between items-center">
              <div>
                <Badge variant="outline" className={getDocumentTypeColor(viewingDocument.documentType)}>
                  {viewingDocument.documentType}
                </Badge>
                <span className="text-sm text-gray-500 ml-2">
                  {new Date(viewingDocument.uploadDate).toLocaleDateString()}
                </span>
                {viewingDocument.fileSize && (
                  <span className="text-sm text-gray-500 ml-2">
                    • {(viewingDocument.fileSize / 1024).toFixed(2)} KB
                  </span>
                )}
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleDownload(viewingDocument)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                
                {onDeleteDocument && (
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={() => {
                      if (onDeleteDocument) {
                        onDeleteDocument(viewingDocument.id)
                          .then(() => {
                            setViewingDocument(null);
                            toast.success("Document deleted successfully");
                          })
                          .catch((err) => {
                            console.error("Error deleting document:", err);
                            toast.error("Failed to delete document");
                          });
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                )}
              </div>
            </div>
            
            {isImageFile(viewingDocument) ? (
              <div className="flex-1 flex items-center justify-center bg-gray-100 rounded-md overflow-auto">
                <img 
                  src={viewingDocument.fileUrl} 
                  alt={viewingDocument.fileName}
                  className="max-w-full max-h-full object-contain"
                  onError={(e) => {
                    console.error('Image load error:', e);
                    toast.error('Failed to load image preview');
                  }}
                />
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center bg-gray-100 p-8 rounded-md">
                <div className="text-center">
                  <FileText className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                  <p className="text-lg font-medium mb-2">
                    {viewingDocument.fileName}
                  </p>
                  <p className="text-sm text-gray-500 mb-4">
                    This document type cannot be previewed here.
                  </p>
                  <Button onClick={() => window.open(viewingDocument.fileUrl, '_blank')}>
                    Open document in new tab
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Show the document list view
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Student Documents</DialogTitle>
          <DialogDescription>
            View, download, or manage documents associated with this student.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex items-center gap-2 mb-4">
          <Input
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1"
          />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                {filterType ? filterType : "All types"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setFilterType("")}>
                All types
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterType("PHOTO")}>
                Photos
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterType("TRANSCRIPT")}>
                Transcripts
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterType("CERTIFICATE")}>
                Certificates
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterType("SUPPORTING")}>
                Supporting Documents
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {documents.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg mb-2">No documents found</p>
            <p className="text-gray-400 text-sm">Upload some documents to get started</p>
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg mb-2">No documents match your search</p>
            <p className="text-gray-400 text-sm">Try adjusting your search terms or filters</p>
          </div>
        ) : (
          <ScrollArea className="h-[50vh]">
            <div className="space-y-2">
              {filteredDocuments.map((doc) => (
                <div 
                  key={doc.id} 
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center min-w-0 flex-1">
                    {getFileIcon(doc.fileType, doc.fileName)}
                    <div className="min-w-0 flex-1 ml-2">
                      <p className="font-medium truncate">{doc.fileName}</p>
                      <div className="flex items-center text-sm text-gray-500">
                        <Badge variant="outline" className={`mr-2 ${getDocumentTypeColor(doc.documentType)}`}>
                          {doc.documentType}
                        </Badge>
                        {doc.fileSize && (
                          <>
                            <span>{(doc.fileSize / 1024).toFixed(2)} KB</span>
                            <span className="mx-1">•</span>
                          </>
                        )}
                        <span>{new Date(doc.uploadDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleView(doc)}
                      className="h-8 w-8 p-0"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleDownload(doc)}
                      className="h-8 w-8 p-0"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    
                    {onDeleteDocument && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => onDeleteDocument(doc.id)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default DocumentViewModal;
