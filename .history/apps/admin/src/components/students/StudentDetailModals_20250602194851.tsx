import DocumentViewModal from "./DocumentViewModal";
import DocumentUploadModal from "./DocumentUploadModal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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

// Extended Student interface to match actual usage in codebase
interface ExtendedStudent {
  full_name: string;
  student_id: string;
  [key: string]: any; // For other fields
}

interface StudentDetailModalsProps {
  // Document View Modal props
  isDocumentModalOpen: boolean;
  setIsDocumentModalOpen: (open: boolean) => void;
  documents: ExtendedDocument[];
  onDeleteDocument: (documentId: number) => void;
  
  // Document Upload Modal props
  isUploadModalOpen: boolean;
  setIsUploadModalOpen: (open: boolean) => void;
  onFileUpload: (files: File[], type: 'photo' | 'transcript' | 'certificate' | 'supporting') => void;
  
  // Delete Dialog props
  isDeleteDialogOpen: boolean;
  setIsDeleteDialogOpen: (open: boolean) => void;
  student: ExtendedStudent;
  onDeleteStudent: () => void;
}

const StudentDetailModals = ({
  isDocumentModalOpen,
  setIsDocumentModalOpen,
  documents,
  onDeleteDocument,
  isUploadModalOpen,
  setIsUploadModalOpen,
  onFileUpload,
  isDeleteDialogOpen,
  setIsDeleteDialogOpen,
  student,
  onDeleteStudent
}: StudentDetailModalsProps) => {
  return (
    <>
      <DocumentViewModal 
        open={isDocumentModalOpen} 
        onOpenChange={setIsDocumentModalOpen}
        documents={documents}
        onDeleteDocument={onDeleteDocument}
      />
      
      <DocumentUploadModal
        open={isUploadModalOpen}
        onOpenChange={setIsUploadModalOpen}
        onUpload={onFileUpload}
      />
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {student.full_name}'s record and all associated documents.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onDeleteStudent} className="bg-red-500 hover:bg-red-600 text-white">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default StudentDetailModals; 