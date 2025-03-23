
import { BarChart3, Download, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";

const Reports = () => {
  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto w-full animation-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">Reports</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>
      
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 min-h-[400px] flex flex-col items-center justify-center">
        <BarChart3 className="h-16 w-16 text-gray-300 mb-4" />
        <h3 className="text-lg font-medium text-gray-700">No Reports Available</h3>
        <p className="text-sm text-gray-500 mt-2 text-center max-w-md">
          Add student data to generate reports. You'll be able to analyze performance by department, academic year, and more.
        </p>
      </div>
    </div>
  );
};

export default Reports;
