import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/supabase';

type Document = Database['public']['Tables']['documents']['Row'];
type DocumentInsert = Database['public']['Tables']['documents']['Insert'];
type DocumentUpdate = Database['public']['Tables']['documents']['Update'];

export const DocumentService = {
  async uploadDocument(
    file: File,
    registrationId: number,
    documentType: Document['document_type']
  ): Promise<Document> {
    // 1. Upload file to Supabase Storage
    const fileExt = file.name.split('.').pop();
    const fileName = `${registrationId}-${documentType}-${Date.now()}.${fileExt}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    // 2. Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('documents')
      .getPublicUrl(fileName);

    // 3. Create document record in the database
    const documentData: DocumentInsert = {
      registration_id: registrationId,
      document_type: documentType,
      file_name: fileName,
      file_size: file.size,
      file_type: file.type,
      file_url: publicUrl,
      upload_date: new Date().toISOString(),
    };

    const { data: document, error: dbError } = await supabase
      .from('documents')
      .insert(documentData)
      .select()
      .single();

    if (dbError) {
      // If database insert fails, delete the uploaded file
      await supabase.storage.from('documents').remove([fileName]);
      throw dbError;
    }

    return document;
  },

  async getDocumentsByRegistrationId(registrationId: number): Promise<Document[]> {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('registration_id', registrationId)
      .order('upload_date', { ascending: false });

    if (error) throw error;
    return data;
  },

  async deleteDocument(id: number): Promise<void> {
    // 1. Get the document to find the file name
    const { data: document, error: fetchError } = await supabase
      .from('documents')
      .select('file_name')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    // 2. Delete from storage
    const { error: storageError } = await supabase.storage
      .from('documents')
      .remove([document.file_name]);

    if (storageError) throw storageError;

    // 3. Delete from database
    const { error: dbError } = await supabase
      .from('documents')
      .delete()
      .eq('id', id);

    if (dbError) throw dbError;
  },

  async updateDocument(id: number, updates: DocumentUpdate): Promise<Document> {
    const { data, error } = await supabase
      .from('documents')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}; 