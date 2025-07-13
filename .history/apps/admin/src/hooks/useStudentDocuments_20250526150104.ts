import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DocumentService } from '@/services/document.service';
import type { Database } from '@/types/supabase';
import { toast } from 'sonner';

type Document = Database['public']['Tables']['documents']['Row'];

export function useStudentDocuments(registrationId: number) {
  const [files, setFiles] = useState<{
    photo: File[];
    transcript: File[];
    certificate: File[];
    supporting: File[];
  }>({
    photo: [],
    transcript: [],
    certificate: [],
    supporting: [],
  });

  const queryClient = useQueryClient();
  const queryKey = ['student-documents', registrationId];

  const { data: documents, isLoading } = useQuery({
    queryKey,
    queryFn: () => DocumentService.getDocumentsByRegistrationId(registrationId),
    enabled: !!registrationId,
  });

  const uploadMutation = useMutation({
    mutationFn: () => DocumentService.uploadDocuments(files, registrationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      setFiles({ photo: [], transcript: [], certificate: [], supporting: [] });
      toast.success('Documents uploaded successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to upload documents: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: DocumentService.deleteDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Document deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete document: ${error.message}`);
    },
  });

  return {
    files,
    setFiles,
    documents,
    isLoading,
    uploadDocuments: uploadMutation.mutate,
    deleteDocument: deleteMutation.mutate,
    isUploading: uploadMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
} 