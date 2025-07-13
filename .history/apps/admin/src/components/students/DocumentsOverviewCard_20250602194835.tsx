import { FileText, Upload, Download, Eye, FileImage, File as FileIcon, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
  documents: ExtendedDocument[];
  isNewStudent: boolean;
  onViewAllClick: () => void;
  onUploadClick: () => void;
}

const DocumentsOverviewCard = ({
  documents,
  isNewStudent,
  onViewAllClick,
  onUploadClick
}: DocumentsOverviewCardProps) => {
  if (isNewStudent) return null;

  const documentCounts = {
    photo: documents.filter(d => d.document_type === 'photo').length,
    transcript: documents.filter(d => d.document_type === 'transcript').length,
    certificate: documents.filter(d => d.document_type === 'certificate').length,
    supporting: documents.filter(d => d.document_type === 'supporting').length
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
                onClick={onViewAllClick}
                className="bg-white"
              >
                <Eye className="h-4 w-4 mr-2" />
                View All
              </Button>
              <Button
                onClick={onUploadClick}
                className="bg-primary-500 text-white hover:bg-primary-600"
              >
                <Upload className="w-4 h-4 mr-2" />
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
                  <p className="text-sm text-gray-500">{documentCounts.photo} document(s)</p>
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
                  <p className="text-sm text-gray-500">{documentCounts.transcript} document(s)</p>
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
                  <p className="text-sm text-gray-500">{documentCounts.certificate} document(s)</p>
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
                  <p className="text-sm text-gray-500">{documentCounts.supporting} document(s)</p>
                </div>
              </div>
            </div>
          </div>
          
          {documents.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {documents.slice(0, 3).map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                  <div className="flex items-center space-x-3 truncate">
                    <div className="flex-shrink-0">
                      {doc.document_type === 'photo' ? (
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <FileImage className="h-5 w-5 text-blue-500" />
                        </div>
                      ) : doc.document_type === 'certificate' ? (
                        <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                          <Award className="h-5 w-5 text-green-500" />
                        </div>
                      ) : doc.document_type === 'transcript' ? (
                        <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                          <FileText className="h-5 w-5 text-amber-500" />
                        </div>
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                          <FileIcon className="h-5 w-5 text-purple-500" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {doc.file_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {(doc.file_size / 1024).toFixed(2)} KB • {new Date(doc.upload_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <a 
                    href={doc.file_url} 
                    download={doc.file_name}
                    className="flex-shrink-0 ml-2 text-gray-400 hover:text-gray-500"
                  >
                    <Download className="h-5 w-5" />
                  </a>
                </div>
              ))}
              
              {documents.length > 3 && (
                <div 
                  className="flex items-center justify-center p-3 bg-white rounded-lg border border-gray-200 border-dashed cursor-pointer hover:bg-gray-50"
                  onClick={onViewAllClick}
                >
                  <span className="text-primary-500 font-medium">
                    +{documents.length - 3} more documents
                  </span>
                </div>
              )}
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
};

export default DocumentsOverviewCard; 