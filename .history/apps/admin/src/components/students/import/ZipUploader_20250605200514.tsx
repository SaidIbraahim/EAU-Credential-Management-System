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
      <p className="text-sm text-gray-500 mb-3">
        Upload a ZIP file containing student documents organized by document type. Each folder should contain files named with the student's registration ID.
      </p>
      
      {/* Structure Example */}
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="text-sm font-semibold text-blue-800 mb-2">📁 Expected ZIP Structure:</h4>
        <div className="text-xs font-mono text-blue-700 space-y-1">
          <div>📦 documents.zip</div>
          <div className="ml-4">📁 Photo/</div>
          <div className="ml-8">📄 GRW-BCS-2005.jpg</div>
          <div className="ml-8">📄 GRW-BCS-2006.png</div>
          <div className="ml-4">📁 Certificate/</div>
          <div className="ml-8">📄 GRW-BCS-2005.pdf</div>
          <div className="ml-8">📄 GRW-BCS-2006.pdf</div>
          <div className="ml-4">📁 Transcript/</div>
          <div className="ml-8">📄 GRW-BCS-2005.pdf</div>
          <div className="ml-4">📁 Supporting/</div>
          <div className="ml-8">📄 GRW-BCS-2005.doc</div>
          <div className="ml-8">📄 GRW-BCS-2005.png</div>
        </div>
        <p className="text-xs text-blue-600 mt-2">
          💡 Tip: Organize by document type first, then name files with the registration ID
        </p>
      </div>
      
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
            Selected: {zipFile.name} ({(zipFile.size / 1024 / 1024).toFixed(2)} MB)
          </p>
        )}
      </div>
      
      {/* Supported Document Types */}
      <div className="mt-3 text-xs text-gray-500">
        <strong>Supported folders:</strong> Photo, Certificate, Transcript, Supporting<br/>
        <strong>Supported formats:</strong> PDF, JPG, PNG, DOC, DOCX
      </div>
    </div>
  );
};

export default ZipUploader;
