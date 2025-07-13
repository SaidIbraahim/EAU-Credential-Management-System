import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  FileText, 
  Image, 
  Download, 
  Upload, 
  Eye, 
  Trash2,
  Plus,
  FolderOpen,
  Camera,
  GraduationCap,
  Award,
  FileIcon,
  ChevronRight,
  ExternalLink
} from "lucide-react";
import { Document } from "@/types";
import { format } from "date-fns";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface DocumentsOverviewCardProps {
  documents: Document[];
  onViewAllClick: () => void;
  onUploadClick: () => void;
  onDeleteDocument?: (documentId: number) => Promise<void>;
  isLoading?: boolean;
}

const DocumentsOverviewCard = ({ 
  documents, 
  onViewAllClick, 
  onUploadClick,
  onDeleteDocument,
  isLoading = false 
}: DocumentsOverviewCardProps) => {
  const [previewDocument, setPreviewDocument] = useState<Document | null>(null);

  // Group documents by type
  const documentsByType = {
    PHOTO: documents.filter(doc => doc.documentType === 'PHOTO'),
    TRANSCRIPT: documents.filter(doc => doc.documentType === 'TRANSCRIPT'),
    CERTIFICATE: documents.filter(doc => doc.documentType === 'CERTIFICATE'),
    SUPPORTING: documents.filter(doc => doc.documentType === 'SUPPORTING'),
  };

  const getDocumentIcon = (type: string) => {
    switch (type) {
      case 'PHOTO': return <Camera className="h-5 w-5" />;
      case 'TRANSCRIPT': return <FileText className="h-5 w-5" />;
      case 'CERTIFICATE': return <Award className="h-5 w-5" />;
      case 'SUPPORTING': return <FileIcon className="h-5 w-5" />;
      default: return <FileIcon className="h-5 w-5" />;
    }
  };

  const getDocumentColor = (type: string) => {
    switch (type) {
      case 'PHOTO': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'TRANSCRIPT': return 'bg-green-100 text-green-800 border-green-200';
      case 'CERTIFICATE': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'SUPPORTING': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getDocumentLabel = (type: string) => {
    switch (type) {
      case 'PHOTO': return 'Photos';
      case 'TRANSCRIPT': return 'Transcripts';
      case 'CERTIFICATE': return 'Certificates';
      case 'SUPPORTING': return 'Supporting Docs';
      default: return 'Documents';
    }
  };

  const handleDocumentPreview = (document: Document) => {
    // Use the streaming route for direct viewing (bypasses R2 permission issues)
    const streamUrl = `/api/documents/${document.id}/stream`;
    window.open(streamUrl, '_blank');
  };

  const handleDocumentDownload = async (document: Document) => {
    try {
      // Use the download route which can proxy through backend if needed
      const downloadUrl = `/api/documents/${document.id}/download`;
      
      // Create a temporary link to trigger download
      const link = window.document.createElement('a');
      link.href = downloadUrl;
      link.download = document.fileName || 'document';
      link.target = '_blank';
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading document:', error);
      // Fallback to streaming route
      const streamUrl = `/api/documents/${document.id}/stream`;
      window.open(streamUrl, '_blank');
    }
  };

  if (isLoading) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalDocuments = documents.length;

  return (
    <Card className="mt-6 shadow-lg border-t-4 border-t-primary-500">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary-100">
              <FolderOpen className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <CardTitle className="text-xl font-semibold">Student Documents</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {totalDocuments} {totalDocuments === 1 ? 'document' : 'documents'} uploaded
              </p>
            </div>
          </div>
          <div className="flex space-x-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={onUploadClick}
                    className="flex items-center space-x-2"
                  >
                    <Upload className="h-4 w-4" />
                    <span className="hidden sm:inline">Upload</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Upload new documents</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            {totalDocuments > 0 && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="default" 
                      size="sm"
                      onClick={onViewAllClick}
                      className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-700"
                    >
                      <Eye className="h-4 w-4" />
                      <span className="hidden sm:inline">View All</span>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>View all documents</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {totalDocuments === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
            <FolderOpen className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No documents uploaded</h3>
            <p className="text-sm text-gray-500 mb-6 max-w-sm">
              Upload student documents like photos, transcripts, certificates, and supporting files to get started.
            </p>
            <Button onClick={onUploadClick} className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>Upload First Document</span>
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Document Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(documentsByType).map(([type, docs]) => (
                <div 
                  key={type} 
                  className={`relative overflow-hidden rounded-lg border-2 ${getDocumentColor(type)} p-4 transition-all duration-200 hover:shadow-md cursor-pointer`}
                  onClick={() => docs.length > 0 && onViewAllClick()}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getDocumentIcon(type)}
                      <div>
                        <p className="font-medium text-sm">{getDocumentLabel(type)}</p>
                        <p className="text-xs opacity-80">
                          {docs.length} {docs.length === 1 ? 'file' : 'files'}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {docs.length}
                    </Badge>
                  </div>
                  
                  {docs.length > 0 && (
                    <div className="absolute bottom-0 right-0 p-2">
                      <ChevronRight className="h-4 w-4 opacity-50" />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Recent Documents */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-gray-900">Recent Documents</h4>
                {totalDocuments > 3 && (
                  <Button variant="ghost" size="sm" onClick={onViewAllClick}>
                    <span className="text-xs">View all {totalDocuments}</span>
                    <ChevronRight className="h-3 w-3 ml-1" />
                  </Button>
                )}
              </div>
              
              <div className="space-y-2">
                {documents.slice(0, 3).map((document) => (
                  <div 
                    key={document.id} 
                    className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-150"
                  >
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div className={`flex items-center justify-center w-8 h-8 rounded ${getDocumentColor(document.documentType)} border-0`}>
                        {getDocumentIcon(document.documentType)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {document.fileName || 'Untitled Document'}
                        </p>
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <span>{getDocumentLabel(document.documentType)}</span>
                          <span>•</span>
                          <span>{format(new Date(document.uploadDate), 'MMM dd, yyyy')}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDocumentPreview(document)}
                              className="h-8 w-8 p-0"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>View document</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDocumentDownload(document)}
                              className="h-8 w-8 p-0"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Download document</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      
                      {onDeleteDocument && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onDeleteDocument(document.id)}
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Delete document</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DocumentsOverviewCard; 