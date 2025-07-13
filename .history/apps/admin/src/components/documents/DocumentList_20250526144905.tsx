import { useDocuments } from '@/hooks/useDocuments';
import type { Database } from '@/types/supabase';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Icons } from '@/components/ui/icons';
import { formatBytes, formatDate } from '@/lib/utils';

type Document = Database['public']['Tables']['documents']['Row'];

interface DocumentListProps {
  registrationId: number;
}

export function DocumentList({ registrationId }: DocumentListProps) {
  const { documents, isLoading, deleteDocument, isDeleting } = useDocuments(registrationId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Icons.spinner className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!documents?.length) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <Icons.fileX className="h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">No documents</h3>
        <p className="text-sm text-muted-foreground">
          Upload documents using the form above
        </p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Type</TableHead>
          <TableHead>File Name</TableHead>
          <TableHead>Size</TableHead>
          <TableHead>Upload Date</TableHead>
          <TableHead className="w-[100px]">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {documents.map((doc) => (
          <TableRow key={doc.id}>
            <TableCell className="font-medium capitalize">
              {doc.document_type}
            </TableCell>
            <TableCell>{doc.file_name}</TableCell>
            <TableCell>{formatBytes(doc.file_size)}</TableCell>
            <TableCell>{formatDate(doc.upload_date)}</TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => window.open(doc.file_url, '_blank')}
                >
                  <Icons.eye className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteDocument(doc.id)}
                  disabled={isDeleting}
                >
                  <Icons.trash className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
} 