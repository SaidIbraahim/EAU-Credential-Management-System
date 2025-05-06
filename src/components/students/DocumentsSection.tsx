
import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Paperclip, FileImage, File, X } from "lucide-react";

interface DocumentsSectionProps {
  files: {
    photo: File[];
    transcript: File[];
    certificate: File[];
    supporting: File[];
  };
  setFiles: React.Dispatch<React.SetStateAction<{
    photo: File[];
    transcript: File[];
    certificate: File[];
    supporting: File[];
  }>>;
}

const DocumentsSection = ({ files, setFiles }: DocumentsSectionProps) => {
  const onDrop = useCallback((acceptedFiles: File[], fileType: keyof typeof files) => {
    setFiles(prevFiles => ({
      ...prevFiles,
      [fileType]: [...prevFiles[fileType], ...acceptedFiles],
    }));
  }, [setFiles]);
  
  const removeFile = (file: File, fileType: keyof typeof files) => {
    setFiles(prevFiles => ({
      ...prevFiles,
      [fileType]: prevFiles[fileType].filter(f => f !== file),
    }));
  };
  
  const { getRootProps: getPhotoRootProps, getInputProps: getPhotoInputProps } = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif'],
    },
    onDrop: (acceptedFiles) => onDrop(acceptedFiles, 'photo'),
  });
  
  const { getRootProps: getTranscriptRootProps, getInputProps: getTranscriptInputProps } = useDropzone({
    accept: {
      'application/pdf': ['.pdf'],
    },
    onDrop: (acceptedFiles) => onDrop(acceptedFiles, 'transcript'),
  });
  
  const { getRootProps: getCertificateRootProps, getInputProps: getCertificateInputProps } = useDropzone({
    accept: {
      'application/pdf': ['.pdf'],
    },
    onDrop: (acceptedFiles) => onDrop(acceptedFiles, 'certificate'),
  });
  
  const { getRootProps: getSupportingRootProps, getInputProps: getSupportingInputProps } = useDropzone({
    onDrop: (acceptedFiles) => onDrop(acceptedFiles, 'supporting'),
  });
  
  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm font-medium">Photo</h4>
        <div {...getPhotoRootProps()} className="dropzone">
          <input {...getPhotoInputProps()} />
          <div className="flex items-center justify-center w-full">
            <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-bray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <FileImage className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400" />
                <p className="mb-2 text-sm text-gray-500 dark:text-gray-400"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">SVG, PNG, JPG or GIF (MAX. 800x400px)</p>
              </div>
            </label>
          </div>
        </div>
        <div className="flex space-x-2 mt-2">
          {files.photo.map((file, index) => (
            <div key={index} className="flex items-center space-x-1 bg-gray-100 text-gray-600 rounded-md px-2 py-1 text-sm">
              <FileImage className="w-4 h-4" />
              <span>{file.name}</span>
              <button onClick={() => removeFile(file, 'photo')} className="hover:text-gray-800">
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
      
      <div>
        <h4 className="text-sm font-medium">Transcript (PDF)</h4>
        <div {...getTranscriptRootProps()} className="dropzone">
          <input {...getTranscriptInputProps()} />
          <div className="flex items-center justify-center w-full">
            <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-bray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Paperclip className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400" />
                <p className="mb-2 text-sm text-gray-500 dark:text-gray-400"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">PDF (MAX. 2MB)</p>
              </div>
            </label>
          </div>
        </div>
        <div className="flex space-x-2 mt-2">
          {files.transcript.map((file, index) => (
            <div key={index} className="flex items-center space-x-1 bg-gray-100 text-gray-600 rounded-md px-2 py-1 text-sm">
              <File className="w-4 h-4" />
              <span>{file.name}</span>
              <button onClick={() => removeFile(file, 'transcript')} className="hover:text-gray-800">
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
      
      <div>
        <h4 className="text-sm font-medium">Certificate (PDF)</h4>
        <div {...getCertificateRootProps()} className="dropzone">
          <input {...getCertificateInputProps()} />
          <div className="flex items-center justify-center w-full">
            <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-bray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Paperclip className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400" />
                <p className="mb-2 text-sm text-gray-500 dark:text-gray-400"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">PDF (MAX. 2MB)</p>
              </div>
            </label>
          </div>
        </div>
        <div className="flex space-x-2 mt-2">
          {files.certificate.map((file, index) => (
            <div key={index} className="flex items-center space-x-1 bg-gray-100 text-gray-600 rounded-md px-2 py-1 text-sm">
              <File className="w-4 h-4" />
              <span>{file.name}</span>
              <button onClick={() => removeFile(file, 'certificate')} className="hover:text-gray-800">
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
      
      <div>
        <h4 className="text-sm font-medium">Supporting Documents</h4>
        <div {...getSupportingRootProps()} className="dropzone">
          <input {...getSupportingInputProps()} />
          <div className="flex items-center justify-center w-full">
            <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-bray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Paperclip className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400" />
                <p className="mb-2 text-sm text-gray-500 dark:text-gray-400"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Any file type</p>
              </div>
            </label>
          </div>
        </div>
        <div className="flex space-x-2 mt-2">
          {files.supporting.map((file, index) => (
            <div key={index} className="flex items-center space-x-1 bg-gray-100 text-gray-600 rounded-md px-2 py-1 text-sm">
              <File className="w-4 h-4" />
              <span>{file.name}</span>
              <button onClick={() => removeFile(file, 'supporting')} className="hover:text-gray-800">
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DocumentsSection;
