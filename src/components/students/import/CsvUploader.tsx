
import { useState } from "react";
import { Upload, Download } from "lucide-react";
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
      <h3 className="text-lg font-medium mb-2">Import Student Data</h3>
      <p className="text-sm text-gray-500 mb-4">
        Upload a CSV file containing student information. The file should include columns for Registration No, Certificate ID, Full Name, Gender, Phone Number, Department, Faculty, Academic Year, GPA, Grade, Graduation Date, and Status.
      </p>
      
      <div className="flex justify-end mb-4">
        <Button 
          variant="outline"
          className="flex items-center gap-2 text-primary-500"
          onClick={handleDownloadTemplate}
        >
          <Download size={16} />
          Download Template
        </Button>
      </div>
      
      <div className="border border-dashed border-gray-300 rounded-lg p-8 text-center">
        <Upload className="mx-auto h-10 w-10 text-gray-400 mb-4" />
        <p className="text-sm text-gray-500 mb-2">
          Drag and drop your CSV file here, or click to browse
        </p>
        <label className="inline-block">
          <span className="bg-primary-500 text-white px-4 py-2 rounded-lg text-sm font-medium cursor-pointer hover:bg-primary-600 transition-colors">
            Browse Files
          </span>
          <input
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleFileChange}
          />
        </label>
        {csvFile && (
          <p className="mt-2 text-sm text-gray-600">
            Selected: {csvFile.name}
          </p>
        )}
      </div>
    </div>
  );
};

export default CsvUploader;
