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

  // Estimate document count from ZIP file size (rough approximation)
  const estimateDocumentCount = (fileSize: number) => {
    // Assume average document is ~200KB (PDF/Image)
    const avgDocSize = 200 * 1024; // 200KB
    const estimated = Math.floor(fileSize / avgDocSize);
    return estimated > 0 ? estimated : 1;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-md font-medium text-gray-900">Student Documents (ZIP)</h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Optional</span>
          {zipFile && (
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
              ~{estimateDocumentCount(zipFile.size)} docs
            </span>
          )}
        </div>
      </div>
      
      <div className={`border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200 ${
        zipFile 
          ? 'border-green-400 bg-green-50 shadow-sm' 
          : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
      }`}>
        {zipFile ? (
          <div className="space-y-3">
            {/* File Icon and Details */}
            <div className="flex items-center justify-center">
              <Archive className="h-8 w-8 text-green-600" />
            </div>
            
            <div className="space-y-2">
              <span className="text-base font-semibold text-green-800 block">
                {zipFile.name}
              </span>
              
              <div className="flex items-center justify-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <FileText className="h-4 w-4 text-green-600" />
                  <span className="text-green-700 font-medium">
                    {(zipFile.size / 1024 / 1024).toFixed(1)} MB
                  </span>
                </div>
                
                <div className="flex items-center gap-1">
                  <span className="text-green-700">
                    ~{estimateDocumentCount(zipFile.size)} documents estimated
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-center gap-2 mt-3">
                <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                  ✅ Ready for Processing
                </div>
                
                <label className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium cursor-pointer hover:bg-blue-200 transition-colors">
                  Change File
                  <input
                    type="file"
                    accept=".zip"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-col items-center">
              <Upload className="mx-auto h-10 w-10 text-gray-400 mb-3" />
              <label className="inline-block">
                <span className="text-lg text-blue-600 underline cursor-pointer hover:text-blue-700 font-medium">
                  Choose ZIP file
                </span>
                <input
                  type="file"
                  accept=".zip"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
            </div>
            
            <div className="text-sm text-gray-600 max-w-sm mx-auto">
              <p className="mb-2">Upload a ZIP file containing student documents</p>
              <p className="text-xs text-gray-500">
                Organized by: Photo/Certificate/Transcript/Supporting
              </p>
            </div>
          </div>
        )}
      </div>
      
      {/* Compact Structure Info */}
      <details className="mt-4">
        <summary className="text-xs text-blue-600 cursor-pointer hover:text-blue-700 flex items-center gap-1">
          <span>📁</span>
          <span>View required ZIP structure</span>
        </summary>
        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="font-mono text-xs text-blue-700 space-y-1">
            <div className="font-semibold mb-2 text-blue-800">Required folder structure:</div>
            <div>📦 documents.zip</div>
            <div className="ml-3">📁 Photo/ → GRW-BCS-2005.jpg</div>
            <div className="ml-3">📁 Certificate/ → GRW-BCS-2005.pdf</div>
            <div className="ml-3">📁 Transcript/ → GRW-BCS-2005.pdf</div>
            <div className="ml-3">📁 Supporting/ → GRW-BCS-2005.doc</div>
          </div>
          <div className="mt-3 p-2 bg-blue-100 rounded text-xs text-blue-800">
            <div className="font-medium mb-1">📋 Important Notes:</div>
            <ul className="list-disc list-inside space-y-1 text-blue-700">
              <li>Files must be named with student registration ID</li>
              <li>Supported formats: PDF, JPG, PNG, DOC, DOCX, XLS, XLSX</li>
              <li>Maximum file size: 200MB for entire ZIP</li>
              <li>Students must already exist in the system</li>
            </ul>
          </div>
        </div>
      </details>
    </div>
  );
};

export default ZipUploader;
