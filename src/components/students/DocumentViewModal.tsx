
import React, { useState, useMemo, useCallback } from "react";
import { Document } from "@/types";
import { Eye, Download, Trash2, FileText, FileImage, File as FileIcon, Filter } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface DocumentViewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documents: Document[];
  onDeleteDocument?: (documentId: number) => void;
}

const DocumentViewModal = ({ 
  open, 
  onOpenChange, 
  documents, 
  onDeleteDocument 
}: DocumentViewModalProps) => {
  const [filterType, setFilterType] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [viewingDocument, setViewingDocument] = useState<Document | null>(null);
  
  const getFileIcon = useCallback((fileType: string) => {
    if (fileType.includes('image') || fileType.includes('jpg') || fileType.includes('jpeg') || fileType.includes('png')) {
      return <FileImage className="h-4 w-4 mr-2 text-blue-500" />;
    } else if (fileType.includes('pdf')) {
      return <FileIcon className="h-4 w-4 mr-2 text-red-500" />;
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
      const matchesType = filterType ? doc.document_type === filterType : true;
      const matchesSearch = searchTerm 
        ? doc.file_name.toLowerCase().includes(searchTerm.toLowerCase())
        : true;
      return matchesType && matchesSearch;
    });
  }, [documents, filterType, searchTerm]);

  const handleView = useCallback((doc: Document) => {
    // For images, show them in the modal
    // For PDFs and other files, open them in a new tab
    setViewingDocument(doc);
    
    if (!(doc.file_type?.includes('image') || 
         doc.file_name.match(/\.(jpg|jpeg|png|gif)$/i))) {
      // If it's not an image, open in new tab too
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
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download document");
    }
  }, []);

  const handleCloseViewer = useCallback(() => {
    setViewingDocument(null);
  }, []);

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      if (!newOpen) {
        setViewingDocument(null);
      }
      onOpenChange(newOpen);
    }}>
      <DialogContent className={viewingDocument ? "max-w-4xl max-h-[90vh] overflow-hidden flex flex-col" : "max-w-4xl"}>
        {!viewingDocument ? (
          <>
            <DialogHeader>
              <DialogTitle>Student Documents</DialogTitle>
              <DialogDescription>
                View and manage documents for this student
              </DialogDescription>
            </DialogHeader>
            
            {documents.length > 0 ? (
              <>
                <div className="flex flex-col sm:flex-row gap-4 mb-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Search by filename..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div className="w-full sm:w-48">
                    <Select value={filterType} onValueChange={setFilterType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Filter by type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All document types</SelectItem>
                        <SelectItem value="photo">Photo</SelectItem>
                        <SelectItem value="transcript">Transcript</SelectItem>
                        <SelectItem value="certificate">Certificate</SelectItem>
                        <SelectItem value="supporting">Supporting</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>File Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Size</TableHead>
                        <TableHead>Upload Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredDocuments.length > 0 ? (
                        filteredDocuments.map((doc) => (
                          <TableRow key={doc.id}>
                            <TableCell className="font-medium">
                              <div className="flex items-center">
                                {getFileIcon(doc.file_type || '')}
                                {doc.file_name}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={getDocumentTypeColor(doc.document_type)}>
                                {doc.document_type}
                              </Badge>
                            </TableCell>
                            <TableCell>{(doc.file_size / 1024).toFixed(2)} KB</TableCell>
                            <TableCell>{new Date(doc.upload_date).toLocaleDateString()}</TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={() => handleView(doc)}>
                                  <Eye className="h-4 w-4 mr-1" />
                                  View
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => handleDownload(doc)}>
                                  <Download className="h-4 w-4 mr-1" />
                                  Download
                                </Button>
                                {onDeleteDocument && (
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => onDeleteDocument(doc.id)}
                                    className="text-red-500 hover:text-red-700"
                                  >
                                    <Trash2 className="h-4 w-4 mr-1" />
                                    Delete
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-6 text-gray-500">
                            No documents match your search criteria
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </>
            ) : (
              <div className="p-8 flex items-center justify-center border border-dashed border-gray-300 rounded-lg">
                <div className="text-center">
                  <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 mb-2">No documents found</p>
                  <p className="text-sm text-gray-400">Upload documents for this student</p>
                </div>
              </div>
            )}
            
            <div className="flex justify-end mt-4">
              <DialogClose asChild>
                <Button variant="outline">Close</Button>
              </DialogClose>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex justify-between items-center">
                <span>Viewing: {viewingDocument.file_name}</span>
                <Button variant="ghost" size="sm" onClick={handleCloseViewer}>
                  Back to all documents
                </Button>
              </DialogTitle>
            </DialogHeader>
            
            <div className="flex-grow overflow-auto p-4 flex items-center justify-center bg-gray-50">
              {viewingDocument.file_type?.includes('image') || 
               viewingDocument.file_name.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                <img 
                  src={viewingDocument.file_url} 
                  alt={viewingDocument.file_name}
                  className="max-w-full max-h-[70vh] object-contain"
                />
              ) : (
                <div className="text-center p-8">
                  <FileText className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                  <p>This document type cannot be previewed directly.</p>
                  <Button 
                    className="mt-4" 
                    onClick={() => window.open(viewingDocument.file_url, '_blank')}
                  >
                    Open in new tab
                  </Button>
                </div>
              )}
            </div>
            
            <div className="flex justify-between p-4 border-t">
              <div>
                <Badge className={getDocumentTypeColor(viewingDocument.document_type)}>
                  {viewingDocument.document_type}
                </Badge>
                <span className="ml-2 text-sm text-gray-500">
                  {(viewingDocument.file_size / 1024).toFixed(2)} KB • 
                  {new Date(viewingDocument.upload_date).toLocaleDateString()}
                </span>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleDownload(viewingDocument)}>
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </Button>
                {onDeleteDocument && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      onDeleteDocument(viewingDocument.id);
                      setViewingDocument(null);
                    }}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                )}
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default DocumentViewModal;
