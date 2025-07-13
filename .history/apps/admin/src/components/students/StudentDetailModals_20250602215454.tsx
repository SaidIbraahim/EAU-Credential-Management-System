import DocumentViewModal from "./DocumentViewModal";
import DocumentUploadModal from "./DocumentUploadModal";
import { Document, Student } from "@/types";
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

interface StudentDetailModalsProps {
  // Document View Modal props
  isDocumentModalOpen: boolean;
  setIsDocumentModalOpen: (open: boolean) => void;
  documents: Document[];
  onDeleteDocument: (documentId: number) => Promise<void>;
  
  // Document Upload Modal props
  isUploadModalOpen: boolean;
  setIsUploadModalOpen: (open: boolean) => void;
  onFileUpload: (files: File[], type: 'photo' | 'transcript' | 'certificate' | 'supporting') => Promise<void>;
  
  // Delete Dialog props
  isDeleteDialogOpen: boolean;
  setIsDeleteDialogOpen: (open: boolean) => void;
  student: Student;
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
              This will permanently delete {student.fullName}'s record and all associated documents.
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