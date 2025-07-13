import { useState } from "react";
import { Upload, Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface CsvUploaderProps {
  onFileChange: (file: File) => void;
  csvFile: File | null;
}

const CsvUploader = ({ onFileChange, csvFile }: CsvUploaderProps) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileChange(e.target.files[0]);
    }
  };

  const handleDownloadTemplate = () => {
    // Updated CSV header row and sample data to match the new format
    const csvContent = [
      "registration_no,certificate_id,full_name,gender,phone_number,department,faculty,academic_year,gpa,grade,graduation_date,status",
      "GRW-BCS-2005,8261,Fadumo Ahmed Ali,female,2.5262E+11,Computer Science,Faculty of Information Science & Technology,2020-2021,3.5,A,6/30/2027,un-cleared",
      "GRW-BBA-2005,9236,Ahmed Mohamed Adam,male,2.5262E+11,Business Administration,Faculty of Business Administration,2019-2020,3.4,B,6/30/2026,cleared"
    ].join("\n");
    
    // Create a Blob with the CSV content
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
    
    // Create a download link and trigger the download
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "student_import_template.csv";
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success("Template downloaded successfully");
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-md font-medium text-gray-900">Student Data (CSV)</h3>
        <Button 
          variant="ghost"
          size="sm"
          className="flex items-center gap-1 text-blue-600 hover:text-blue-700"
          onClick={handleDownloadTemplate}
        >
          <Download size={14} />
          Template
        </Button>
      </div>
      
      <div className={`border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200 min-h-[160px] flex items-center justify-center ${
        csvFile 
          ? 'border-green-400 bg-green-50 shadow-sm' 
          : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
      }`}>
        {csvFile ? (
          <div className="space-y-3 w-full">
            {/* File Icon and Details */}
            <div className="flex items-center justify-center">
              <FileText className="h-8 w-8 text-green-600" />
            </div>
            
            <div className="space-y-2">
              <span className="text-base font-semibold text-green-800 block">
                {csvFile.name}
              </span>
              
              <div className="flex items-center justify-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <span className="text-green-700 font-medium">
                    {(csvFile.size / 1024).toFixed(1)} KB
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
                    accept=".csv"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4 w-full">
            <div className="flex flex-col items-center">
              <Upload className="mx-auto h-10 w-10 text-gray-400 mb-3" />
              <label className="inline-block">
                <span className="text-lg text-blue-600 underline cursor-pointer hover:text-blue-700 font-medium">
                  Choose CSV file
                </span>
                <input
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
            </div>
            
            <div className="text-sm text-gray-600 max-w-sm mx-auto">
              <p className="mb-2">Upload a CSV file containing student data</p>
              <p className="text-xs text-gray-500">
                Includes registration info, grades, and details
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CsvUploader;
