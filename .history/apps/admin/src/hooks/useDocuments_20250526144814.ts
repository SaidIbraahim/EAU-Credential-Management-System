import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DocumentService } from '@/services/document.service';
import type { Database } from '@/types/supabase';
import { toast } from 'sonner';

type Document = Database['public']['Tables']['documents']['Row'];
type DocumentUpdate = Database['public']['Tables']['documents']['Update'];

export function useDocuments(registrationId: number) {
  const queryClient = useQueryClient();
  const queryKey = ['documents', registrationId];

  const { data: documents, isLoading } = useQuery({
    queryKey,
    queryFn: () => DocumentService.getDocumentsByRegistrationId(registrationId),
  });

  const uploadMutation = useMutation({
    mutationFn: (params: { file: File; documentType: Document['document_type'] }) =>
      DocumentService.uploadDocument(params.file, registrationId, params.documentType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Document uploaded successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to upload document: ${error.message}`);
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

  const updateMutation = useMutation({
    mutationFn: (params: { id: number; updates: DocumentUpdate }) =>
      DocumentService.updateDocument(params.id, params.updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Document updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update document: ${error.message}`);
    },
  });

  return {
    documents,
    isLoading,
    uploadDocument: uploadMutation.mutate,
    deleteDocument: deleteMutation.mutate,
    updateDocument: updateMutation.mutate,
    isUploading: uploadMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isUpdating: updateMutation.isPending,
  };
} 