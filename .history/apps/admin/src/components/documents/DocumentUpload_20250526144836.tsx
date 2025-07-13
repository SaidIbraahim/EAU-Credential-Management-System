import { useState } from 'react';
import { useDocuments } from '@/hooks/useDocuments';
import type { Database } from '@/types/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Icons } from '@/components/ui/icons';

type Document = Database['public']['Tables']['documents']['Row'];

interface DocumentUploadProps {
  registrationId: number;
}

export function DocumentUpload({ registrationId }: DocumentUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<Document['document_type']>('photo');
  const { uploadDocument, isUploading } = useDocuments(registrationId);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = () => {
    if (!selectedFile) return;
    uploadDocument({ file: selectedFile, documentType });
    setSelectedFile(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Select
          value={documentType}
          onValueChange={(value) => setDocumentType(value as Document['document_type'])}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Document type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="photo">Photo</SelectItem>
            <SelectItem value="transcript">Transcript</SelectItem>
            <SelectItem value="certificate">Certificate</SelectItem>
            <SelectItem value="supporting">Supporting Document</SelectItem>
          </SelectContent>
        </Select>

        <Input
          type="file"
          onChange={handleFileChange}
          className="max-w-sm"
          accept=".pdf,.jpg,.jpeg,.png"
        />

        <Button
          onClick={handleUpload}
          disabled={!selectedFile || isUploading}
          className="w-32"
        >
          {isUploading ? (
            <>
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
              Uploading
            </>
          ) : (
            'Upload'
          )}
        </Button>
      </div>

      {selectedFile && (
        <p className="text-sm text-muted-foreground">
          Selected file: {selectedFile.name}
        </p>
      )}
    </div>
  );
} 