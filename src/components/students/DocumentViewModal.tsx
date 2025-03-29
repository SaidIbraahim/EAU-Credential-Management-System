
import React, { useState } from "react";
import { Document } from "@/types";
import { Eye, Download, Trash2, FileText, FileImage, File as FileIcon, ImageIcon, ScrollIcon, Award } from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

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
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  
  const getFilteredDocuments = () => {
    if (!activeFilter) return documents;
    return documents.filter(doc => doc.document_type === activeFilter);
  };
  
  const getDocumentTypeIcon = (fileType: string, documentType: string) => {
    switch (documentType) {
      case 'photo':
        return <ImageIcon className="h-4 w-4 mr-2 text-blue-500" />;
      case 'transcript':
        return <ScrollIcon className="h-4 w-4 mr-2 text-amber-500" />;
      case 'certificate':
        return <Award className="h-4 w-4 mr-2 text-green-500" />;
      case 'supporting':
      default:
        if (fileType.includes('image') || fileType.includes('jpg') || fileType.includes('jpeg') || fileType.includes('png')) {
          return <FileImage className="h-4 w-4 mr-2 text-blue-500" />;
        } else if (fileType.includes('pdf')) {
          return <FileIcon className="h-4 w-4 mr-2 text-red-500" />;
        } else {
          return <FileText className="h-4 w-4 mr-2 text-gray-500" />;
        }
    }
  };

  const getDocumentTypeColor = (type: string) => {
    switch (type) {
      case 'photo': return "bg-blue-100 text-blue-800";
      case 'transcript': return "bg-amber-100 text-amber-800";
      case 'certificate': return "bg-green-100 text-green-800";
      case 'supporting': return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const filteredDocuments = getFilteredDocuments();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Student Documents</DialogTitle>
          <DialogDescription>
            View and manage documents for this student
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex items-center justify-between mb-4">
          <div className="space-x-2">
            <Button 
              variant={activeFilter === null ? "default" : "outline"} 
              size="sm"
              onClick={() => setActiveFilter(null)}
            >
              All ({documents.length})
            </Button>
            <Button 
              variant={activeFilter === 'photo' ? "default" : "outline"} 
              size="sm"
              onClick={() => setActiveFilter('photo')}
            >
              <ImageIcon className="h-4 w-4 mr-1" />
              Photos
            </Button>
            <Button 
              variant={activeFilter === 'transcript' ? "default" : "outline"} 
              size="sm"
              onClick={() => setActiveFilter('transcript')}
            >
              <ScrollIcon className="h-4 w-4 mr-1" />
              Transcripts
            </Button>
            <Button 
              variant={activeFilter === 'certificate' ? "default" : "outline"} 
              size="sm"
              onClick={() => setActiveFilter('certificate')}
            >
              <Award className="h-4 w-4 mr-1" />
              Certificates
            </Button>
            <Button 
              variant={activeFilter === 'supporting' ? "default" : "outline"} 
              size="sm"
              onClick={() => setActiveFilter('supporting')}
            >
              <FileText className="h-4 w-4 mr-1" />
              Supporting
            </Button>
          </div>
        </div>
        
        {filteredDocuments.length > 0 ? (
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
                {filteredDocuments.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        {getDocumentTypeIcon(doc.file_type || '', doc.document_type)}
                        <span className="truncate max-w-[200px]">{doc.file_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDocumentTypeColor(doc.document_type)}`}>
                        {doc.document_type}
                      </span>
                    </TableCell>
                    <TableCell>{(doc.file_size / 1024).toFixed(2)} KB</TableCell>
                    <TableCell>{new Date(doc.upload_date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            Actions
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </a>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <a href={doc.file_url} download={doc.file_name}>
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </a>
                          </DropdownMenuItem>
                          {onDeleteDocument && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => onDeleteDocument(doc.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="p-8 flex items-center justify-center border border-dashed border-gray-300 rounded-lg">
            <div className="text-center">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 mb-2">No documents found</p>
              <p className="text-sm text-gray-400">
                {activeFilter ? `No ${activeFilter} documents found` : 'Upload documents for this student'}
              </p>
            </div>
          </div>
        )}
        
        <div className="flex justify-end mt-4">
          <DialogClose asChild>
            <Button variant="outline">Close</Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentViewModal;
