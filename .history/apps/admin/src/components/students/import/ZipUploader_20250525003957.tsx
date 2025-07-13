
import { Upload } from "lucide-react";

interface ZipUploaderProps {
  onFileChange: (file: File) => void;
  zipFile: File | null;
}

const ZipUploader = ({ onFileChange, zipFile }: ZipUploaderProps) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileChange(e.target.files[0]);
    }
  };

  return (
    <div>
      <h3 className="text-lg font-medium mb-2">Import Student Documents</h3>
      <p className="text-sm text-gray-500 mb-4">
        Upload a ZIP file containing photos, transcripts, certificates, and supporting documents for students. The ZIP structure should match the student IDs in the CSV file.
      </p>
      
      <div className="border border-dashed border-gray-300 rounded-lg p-8 text-center">
        <Upload className="mx-auto h-10 w-10 text-gray-400 mb-4" />
        <p className="text-sm text-gray-500 mb-2">
          Drag and drop your ZIP file here, or click to browse
        </p>
        <label className="inline-block">
          <span className="bg-primary-500 text-white px-4 py-2 rounded-lg text-sm font-medium cursor-pointer hover:bg-primary-600 transition-colors">
            Browse Files
          </span>
          <input
            type="file"
            accept=".zip"
            className="hidden"
            onChange={handleFileChange}
          />
        </label>
        {zipFile && (
          <p className="mt-2 text-sm text-gray-600">
            Selected: {zipFile.name}
          </p>
        )}
      </div>
    </div>
  );
};

export default ZipUploader;
