import { Upload, Archive, FileText } from "lucide-react";

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
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-md font-medium text-gray-900">Student Documents (ZIP)</h3>
        <span className="text-xs text-gray-500">Optional</span>
      </div>
      
      <div className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
        zipFile 
          ? 'border-green-300 bg-green-50' 
          : 'border-gray-300 hover:border-gray-400'
      }`}>
        {zipFile ? (
          <div className="flex items-center justify-center gap-2">
            <Archive className="h-5 w-5 text-green-600" />
            <div className="text-left">
              <span className="text-sm font-medium text-green-700 block">
                {zipFile.name}
              </span>
              <span className="text-xs text-green-600">
                {(zipFile.size / 1024 / 1024).toFixed(2)} MB
              </span>
            </div>
            <label className="ml-2">
              <span className="text-xs text-blue-600 underline cursor-pointer hover:text-blue-700">
                Change
              </span>
              <input
                type="file"
                accept=".zip"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>
          </div>
        ) : (
          <div>
            <Upload className="mx-auto h-6 w-6 text-gray-400 mb-2" />
            <label className="inline-block">
              <span className="text-sm text-blue-600 underline cursor-pointer hover:text-blue-700">
                Choose ZIP file
              </span>
              <input
                type="file"
                accept=".zip"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>
            <p className="text-xs text-gray-500 mt-1">
              Organized by: Photo/Certificate/Transcript/Supporting
            </p>
          </div>
        )}
      </div>
      
      {/* Compact Structure Info */}
      <details className="mt-3">
        <summary className="text-xs text-blue-600 cursor-pointer hover:text-blue-700">
          📁 View required ZIP structure
        </summary>
        <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs">
          <div className="font-mono text-blue-700 space-y-1">
            <div>📦 documents.zip</div>
            <div className="ml-3">📁 Photo/ → GRW-BCS-2005.jpg</div>
            <div className="ml-3">📁 Certificate/ → GRW-BCS-2005.pdf</div>
            <div className="ml-3">📁 Transcript/ → GRW-BCS-2005.pdf</div>
            <div className="ml-3">📁 Supporting/ → GRW-BCS-2005.doc</div>
          </div>
          <p className="text-blue-600 mt-2">
            Files must be named with student registration ID
          </p>
        </div>
      </details>
    </div>
  );
};

export default ZipUploader;
