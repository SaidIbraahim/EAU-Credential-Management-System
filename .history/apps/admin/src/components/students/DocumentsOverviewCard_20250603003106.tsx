import { FileText, Upload, Download, Eye, FileImage, File as FileIcon, Award, Trash2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Document } from "@/types";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface DocumentsOverviewCardProps {
  documents: Document[];
  onViewAllClick: () => void;
  onUploadClick: () => void;
  isLoading?: boolean;
}

export default function DocumentsOverviewCard({ 
  documents, 
  onViewAllClick,
  onUploadClick,
  isLoading = false
}: DocumentsOverviewCardProps) {
  const [imagePreviewUrls, setImagePreviewUrls] = useState<{[key: number]: string}>({});

  const getDocumentTypeBadge = (type: string) => {
    const typeColors = {
      'PHOTO': 'bg-blue-100 text-blue-800 border-blue-200',
      'TRANSCRIPT': 'bg-green-100 text-green-800 border-green-200',
      'CERTIFICATE': 'bg-purple-100 text-purple-800 border-purple-200',
      'SUPPORTING': 'bg-gray-100 text-gray-800 border-gray-200'
    };
    
    return (
      <Badge 
        variant="outline" 
        className={`${typeColors[type as keyof typeof typeColors] || 'bg-gray-100 text-gray-800 border-gray-200'} text-xs`}
      >
        {type}
      </Badge>
    );
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = (documentType: string, fileName?: string) => {
    const iconProps = { className: "h-4 w-4" };
    
    switch (documentType) {
      case 'PHOTO':
        return <FileImage {...iconProps} className="h-4 w-4 text-blue-500" />;
      case 'CERTIFICATE':
        return <Award {...iconProps} className="h-4 w-4 text-purple-500" />;
      case 'TRANSCRIPT':
        return <FileText {...iconProps} className="h-4 w-4 text-green-500" />;
      default:
        return <FileIcon {...iconProps} className="h-4 w-4 text-gray-500" />;
    }
  };

  const handleViewDocument = (doc: Document) => {
    // Open document in new tab
    window.open(doc.fileUrl, '_blank');
  };

  const handleDownloadDocument = (doc: Document) => {
    // Create a temporary link to download the file
    const link = document.createElement('a');
    link.href = doc.fileUrl;
    link.download = doc.fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const documentCounts = {
    PHOTO: documents.filter(d => d.documentType === 'PHOTO').length,
    TRANSCRIPT: documents.filter(d => d.documentType === 'TRANSCRIPT').length,
    CERTIFICATE: documents.filter(d => d.documentType === 'CERTIFICATE').length,
    SUPPORTING: documents.filter(d => d.documentType === 'SUPPORTING').length
  };

  if (isLoading) {
    return (
      <Card className="mt-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary-500" />
            Student Documents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 border rounded-lg bg-gray-50">
            <div className="flex justify-between items-center mb-4">
              <div>
                <Skeleton className="h-5 w-48 mb-2" />
                <Skeleton className="h-4 w-32" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-24" />
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-20 w-full rounded-lg" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary-500" />
          Student Documents
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="p-4 border rounded-lg bg-gray-50">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-base font-medium">Documents and Attachments</h3>
              <p className="text-sm text-gray-500 mt-1">
                {documents.length} document{documents.length !== 1 ? 's' : ''} uploaded
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={onViewAllClick}
                disabled={documents.length === 0}
              >
                <Eye className="h-4 w-4 mr-2" />
                View All
              </Button>
              <Button 
                variant="default" 
                size="sm"
                onClick={onUploadClick}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </Button>
            </div>
          </div>
          
          {/* Document type summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                  <FileImage className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <h4 className="font-medium text-sm">Photos</h4>
                  <p className="text-xs text-gray-500">{documentCounts.PHOTO} document(s)</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center mr-3">
                  <FileText className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <h4 className="font-medium text-sm">Transcripts</h4>
                  <p className="text-xs text-gray-500">{documentCounts.TRANSCRIPT} document(s)</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center mr-3">
                  <Award className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <h4 className="font-medium text-sm">Certificates</h4>
                  <p className="text-xs text-gray-500">{documentCounts.CERTIFICATE} document(s)</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center mr-3">
                  <FileIcon className="h-5 w-5 text-gray-500" />
                </div>
                <div>
                  <h4 className="font-medium text-sm">Supporting</h4>
                  <p className="text-xs text-gray-500">{documentCounts.SUPPORTING} document(s)</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Recent documents list */}
          {documents.length > 0 ? (
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-gray-700 mb-3">Recent Documents</h4>
              {documents.slice(0, 3).map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <div className="h-8 w-8 rounded bg-gray-100 flex items-center justify-center flex-shrink-0">
                      {getFileIcon(doc.documentType, doc.fileName)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">{doc.fileName}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        {getDocumentTypeBadge(doc.documentType)}
                        <span className="text-xs text-gray-500">{formatFileSize(doc.fileSize)}</span>
                        <span className="text-xs text-gray-500">•</span>
                        <span className="text-xs text-gray-500">
                          {new Date(doc.uploadDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-1 ml-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleViewDocument(doc)}
                      className="h-8 w-8 p-0"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleDownloadDocument(doc)}
                      className="h-8 w-8 p-0"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {documents.length > 3 && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full mt-4"
                  onClick={onViewAllClick}
                >
                  View All Documents ({documents.length})
                </Button>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <FileText className="h-8 w-8 text-gray-400" />
              </div>
              <h4 className="font-medium text-gray-900 mb-2">No documents uploaded yet</h4>
              <p className="text-sm text-gray-500 mb-4">Upload documents to get started with student record management</p>
              <Button 
                variant="default" 
                size="sm"
                onClick={onUploadClick}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload First Document
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 