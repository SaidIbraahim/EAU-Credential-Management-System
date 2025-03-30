
import React, { useState, useMemo } from "react";
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
  
  const getFileIcon = (fileType: string) => {
    if (fileType.includes('image') || fileType.includes('jpg') || fileType.includes('jpeg') || fileType.includes('png')) {
      return <FileImage className="h-4 w-4 mr-2 text-blue-500" />;
    } else if (fileType.includes('pdf')) {
      return <FileIcon className="h-4 w-4 mr-2 text-red-500" />;
    } else {
      return <FileText className="h-4 w-4 mr-2 text-gray-500" />;
    }
  };

  const getDocumentTypeColor = (type: string) => {
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
  };

  const filteredDocuments = useMemo(() => {
    return documents.filter(doc => {
      const matchesType = filterType ? doc.document_type === filterType : true;
      const matchesSearch = searchTerm 
        ? doc.file_name.toLowerCase().includes(searchTerm.toLowerCase())
        : true;
      return matchesType && matchesSearch;
    });
  }, [documents, filterType, searchTerm]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
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
                            <Button variant="outline" size="sm" asChild>
                              <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </a>
                            </Button>
                            <Button variant="outline" size="sm" asChild>
                              <a href={doc.file_url} download={doc.file_name}>
                                <Download className="h-4 w-4 mr-1" />
                                Download
                              </a>
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
      </DialogContent>
    </Dialog>
  );
};

export default DocumentViewModal;
