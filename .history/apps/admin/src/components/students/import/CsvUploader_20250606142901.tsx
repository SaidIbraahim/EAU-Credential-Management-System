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
      
      <div className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
        csvFile 
          ? 'border-green-300 bg-green-50' 
          : 'border-gray-300 hover:border-gray-400'
      }`}>
        {csvFile ? (
          <div className="flex items-center justify-center gap-2">
            <FileText className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium text-green-700">
              {csvFile.name}
            </span>
            <label className="ml-2">
              <span className="text-xs text-blue-600 underline cursor-pointer hover:text-blue-700">
                Change
              </span>
              <input
                type="file"
                accept=".csv"
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
                Choose CSV file
              </span>
              <input
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>
            <p className="text-xs text-gray-500 mt-1">
              Student data with registration info
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CsvUploader;
