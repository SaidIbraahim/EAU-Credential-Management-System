
import { Button } from "@/components/ui/button";

interface ImportActionButtonsProps {
  isLoading: boolean;
  hasErrors: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

const ImportActionButtons = ({
  isLoading,
  hasErrors,
  onCancel,
  onConfirm
}: ImportActionButtonsProps) => {
  return (
    <div className="mt-4 flex justify-end">
      <Button 
        variant="outline" 
        className="mr-2"
        onClick={onCancel}
        disabled={isLoading}
      >
        Cancel
      </Button>
      <Button 
        className="bg-primary-500 hover:bg-primary-600 text-white"
        onClick={onConfirm}
        disabled={isLoading || hasErrors}
      >
        {isLoading ? 'Processing...' : 'Confirm Import'}
      </Button>
    </div>
  );
};

export default ImportActionButtons;
