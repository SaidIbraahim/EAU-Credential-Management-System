import { FileText, Upload, Download, Eye, FileImage, File as FileIcon, Award, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Document } from "@/types";

interface DocumentsOverviewCardProps {
  documents: Document[];
  onViewAllClick: () => void;
  onUploadClick: () => void;
}

export function DocumentsOverviewCard({ 
  documents, 
  onViewAllClick,
  onUploadClick
}: DocumentsOverviewCardProps) {
  const getDocumentTypeBadge = (type: string) => {
    const typeColors = {
      'PHOTO': 'bg-blue-100 text-blue-800',
      'TRANSCRIPT': 'bg-green-100 text-green-800',
      'CERTIFICATE': 'bg-purple-100 text-purple-800',
      'SUPPORTING': 'bg-gray-100 text-gray-800'
    };
    
    return (
      <Badge className={typeColors[type as keyof typeof typeColors] || 'bg-gray-100 text-gray-800'}>
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
                onClick={onUploadClick}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                  <FileImage className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <h4 className="font-medium">Photos</h4>
                  <p className="text-sm text-gray-500">{documents.filter(d => d.documentType === 'PHOTO').length} document(s)</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center mr-3">
                  <FileText className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <h4 className="font-medium">Transcripts</h4>
                  <p className="text-sm text-gray-500">{documents.filter(d => d.documentType === 'TRANSCRIPT').length} document(s)</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center mr-3">
                  <Award className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <h4 className="font-medium">Certificates</h4>
                  <p className="text-sm text-gray-500">{documents.filter(d => d.documentType === 'CERTIFICATE').length} document(s)</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center mr-3">
                  <FileIcon className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <h4 className="font-medium">Supporting</h4>
                  <p className="text-sm text-gray-500">{documents.filter(d => d.documentType === 'SUPPORTING').length} document(s)</p>
                </div>
              </div>
            </div>
          </div>
          
          {documents.length > 0 ? (
            <div className="space-y-3">
              {documents.slice(0, 3).map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 rounded bg-gray-100 flex items-center justify-center">
                      <FileIcon className="h-4 w-4 text-gray-500" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{doc.fileName}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        {getDocumentTypeBadge(doc.documentType)}
                        <span className="text-xs text-gray-500">{formatFileSize(doc.fileSize)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm" onClick={() => window.open(doc.fileUrl, '_blank')}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => window.open(doc.fileUrl, '_blank')}>
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {documents.length > 3 && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={onViewAllClick}
                >
                  View All Documents ({documents.length})
                </Button>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No documents uploaded yet</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-3"
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

export default DocumentsOverviewCard; 