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
import { PDFViewer } from "@/components/ui/pdf-viewer";

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
  
  const getFileIcon = useCallback((fileType: string) => {
    if (fileType.includes('image') || fileType.includes('jpg') || fileType.includes('jpeg') || fileType.includes('png')) {
      return <FileImage className="h-4 w-4 mr-2 text-blue-500" />;
    } else if (fileType.includes('pdf')) {
      return <FileText className="h-4 w-4 mr-2 text-red-500" />;
    } else {
      return <FileText className="h-4 w-4 mr-2 text-gray-500" />;
    }
  }, []);

  const getDocumentTypeColor = useCallback((type: string) => {
    switch (type) {
      case 'photo':
        return "bg-blue-100 text-blue-800";
      case 'transcript':
        return "bg-amber-100 text-amber-800";
      case 'certificate':
        return "bg-green-100 text-green-800";
      case 'supporting':
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  }, []);

  const filteredDocuments = useMemo(() => {
    return documents.filter(doc => {
      const matchesType = filterType === "" || doc.document_type === filterType;
      const matchesSearch = searchTerm === "" || 
        doc.file_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (doc.description && doc.description.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesType && matchesSearch;
    });
  }, [documents, filterType, searchTerm]);

  const handleView = useCallback((doc: Document) => {
    // For images, show them in the modal
    setViewingDocument(doc);
    
    // For PDFs and other files, open in new tab too
    if (!(doc.file_type?.includes('image') || 
         doc.file_name.match(/\.(jpg|jpeg|png|gif)$/i))) {
      window.open(doc.file_url, '_blank');
    }
  }, []);

  const handleDownload = useCallback((doc: Document) => {
    try {
      const link = document.createElement('a');
      link.href = doc.file_url;
      link.download = doc.file_name;
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

  // If we're viewing a specific document, show that view
  if (viewingDocument) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex justify-between items-center">
              <span>Viewing: {viewingDocument.file_name}</span>
              <Button variant="ghost" size="sm" onClick={handleCloseViewer}>
                Back to all documents
              </Button>
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="mb-4 flex justify-between items-center">
              <div>
                <Badge className={getDocumentTypeColor(viewingDocument.document_type)}>
                  {viewingDocument.document_type.charAt(0).toUpperCase() + viewingDocument.document_type.slice(1)}
                </Badge>
                <span className="text-sm text-gray-500 ml-2">
                  {new Date(viewingDocument.upload_date).toLocaleDateString()}
                </span>
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
            
            {viewingDocument.file_type?.includes('image') || viewingDocument.file_name.match(/\.(jpg|jpeg|png|gif)$/i) ? (
              <div className="flex-1 flex items-center justify-center bg-gray-100 rounded-md overflow-auto">
                <img 
                  src={viewingDocument.file_url} 
                  alt={viewingDocument.file_name}
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            ) : viewingDocument.file_type?.includes('pdf') || viewingDocument.file_name.endsWith('.pdf') ? (
              <div className="flex-1 overflow-auto">
                <PDFViewer url={viewingDocument.file_url} fileName={viewingDocument.file_name} />
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center bg-gray-100 p-8 rounded-md">
                <div className="text-center">
                  <FileText className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                  <p className="text-lg font-medium mb-2">
                    {viewingDocument.file_name}
                  </p>
                  <p className="text-sm text-gray-500 mb-4">
                    This document type cannot be previewed here.
                  </p>
                  <Button onClick={() => window.open(viewingDocument.file_url, '_blank')}>
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
                {filterType ? filterType.charAt(0).toUpperCase() + filterType.slice(1) : "All types"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuCheckboxItem 
                checked={filterType === ""}
                onCheckedChange={() => setFilterType("")}
              >
                All types
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem 
                checked={filterType === "photo"}
                onCheckedChange={() => setFilterType(filterType === "photo" ? "" : "photo")}
              >
                Photos
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem 
                checked={filterType === "transcript"}
                onCheckedChange={() => setFilterType(filterType === "transcript" ? "" : "transcript")}
              >
                Transcripts
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem 
                checked={filterType === "certificate"}
                onCheckedChange={() => setFilterType(filterType === "certificate" ? "" : "certificate")}
              >
                Certificates
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem 
                checked={filterType === "supporting"}
                onCheckedChange={() => setFilterType(filterType === "supporting" ? "" : "supporting")}
              >
                Supporting documents
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {documents.length > 0 ? (
          <ScrollArea className="h-[50vh]">
            <div className="space-y-2">
              {filteredDocuments.map((doc) => (
                <div 
                  key={doc.id} 
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center min-w-0 flex-1">
                    {getFileIcon(doc.file_type || doc.file_name)}
                    <div className="min-w-0 flex-1 ml-2">
                      <p className="font-medium truncate">{doc.file_name}</p>
                      <div className="flex items-center text-sm text-gray-500">
                        <Badge className={`mr-2 ${getDocumentTypeColor(doc.document_type)}`}>
                          {doc.document_type.charAt(0).toUpperCase() + doc.document_type.slice(1)}
                        </Badge>
                        <span>{(doc.file_size / 1024).toFixed(2)} KB</span>
                        <span className="mx-1">•</span>
                        <span>{new Date(doc.upload_date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 ml-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleView(doc)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleDownload(doc)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    {onDeleteDocument && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-red-500 hover:text-red-700"
                        onClick={() => {
                          if (onDeleteDocument) {
                            onDeleteDocument(doc.id)
                              .then(() => toast.success("Document deleted successfully"))
                              .catch(() => toast.error("Failed to delete document"));
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              
              {filteredDocuments.length === 0 && (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500">No documents matching your filters</p>
                </div>
              )}
            </div>
          </ScrollArea>
        ) : (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 mb-2">No documents available</p>
            <p className="text-sm text-gray-400">Upload documents using the upload button</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default DocumentViewModal;
