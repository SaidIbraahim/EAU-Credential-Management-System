import { FileText, Upload, Download, Eye, FileImage, File as FileIcon, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Document } from "@/types";
import { useState } from "react";
import { documentsApi } from "@/api/apiClient";
import { toast } from "sonner";

// Extended Document interface to match actual usage in codebase
interface ExtendedDocument {
  id: number;
  document_type: 'photo' | 'transcript' | 'certificate' | 'supporting';
  file_name: string;
  file_size: number;
  file_url: string;
  upload_date: Date;
  [key: string]: any; // For other fields
}

interface DocumentsOverviewCardProps {
  studentId: string;
  registrationId: string;
  documents: Document[];
  onDocumentUpload: (document: Document) => void;
  onDocumentDelete: (documentId: number) => void;
  onDocumentView: (document: Document) => void;
}

export function DocumentsOverviewCard({ 
  studentId,
  registrationId,
  documents, 
  onDocumentUpload,
  onDocumentDelete,
  onDocumentView
}: DocumentsOverviewCardProps) {
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentType', 'SUPPORTING'); // Default type
      
      const uploadedDoc = await documentsApi.upload(registrationId, formData);
      
      // Create a document object that matches our Document interface
      const newDocument: Document = {
        id: uploadedDoc.id,
        registrationId: parseInt(registrationId),
        documentType: 'SUPPORTING',
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        fileUrl: uploadedDoc.fileUrl,
        uploadDate: new Date().toISOString(),
        createdAt: new Date().toISOString()
      };
      
      onDocumentUpload(newDocument);
      toast.success('Document uploaded successfully');
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error('Failed to upload document');
    } finally {
      setUploading(false);
      // Reset input
      event.target.value = '';
    }
  };

  const handleDelete = async (documentId: number) => {
    try {
      await documentsApi.delete(documentId.toString());
      onDocumentDelete(documentId);
      toast.success('Document deleted successfully');
    } catch (error) {
      console.error('Delete failed:', error);
      toast.error('Failed to delete document');
    }
  };

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
              <input
                type="file"
                id="file-upload"
                className="hidden"
                onChange={handleFileUpload}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              />
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => document.getElementById('file-upload')?.click()}
                disabled={uploading}
              >
                <Upload className="h-4 w-4 mr-2" />
                {uploading ? 'Uploading...' : 'Upload'}
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
              {documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-gray-400" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{doc.fileName}</span>
                        {getDocumentTypeBadge(doc.documentType)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatFileSize(doc.fileSize)} • Uploaded {new Date(doc.uploadDate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDocumentView(doc)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(doc.fileUrl, '_blank')}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(doc.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-6">
              <FileText className="h-12 w-12 text-gray-300 mb-3" />
              <p className="text-gray-500 mb-2">No documents uploaded yet</p>
              <p className="text-sm text-gray-400">Upload student documents using the button above</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default DocumentsOverviewCard; 