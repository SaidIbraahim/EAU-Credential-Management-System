import { BarChart3, Download, RefreshCw, Users, GraduationCap, Award, TrendingUp, Filter, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useReports } from "@/hooks/useReports";
import { SimpleBarChart, SimplePieChart, MetricCard } from "@/components/ui/SimpleChart";
import ReportsSkeleton from "@/components/ui/ReportsSkeleton";
import { useState } from "react";

const Reports = () => {
  const { reportsData, isLoading, error, refreshReports, lastUpdated } = useReports(false, 60000);
  const [exportLoading, setExportLoading] = useState(false);
  const [activeView, setActiveView] = useState<'overview' | 'departments' | 'performance'>('overview');
  const [compactMode, setCompactMode] = useState(false);

  const formatLastUpdated = (date: Date | null) => {
    if (!date) return '';
    return `Updated ${date.toLocaleTimeString()}`;
  };

  const handleExport = async () => {
    if (!reportsData) return;
    
    setExportLoading(true);
    try {
      const csvContent = generateCSVReport(reportsData);
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `EAU_Reports_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setExportLoading(false);
    }
  };

  const generateCSVReport = (data: any) => {
    let csv = 'EAU Credential Management System - Report\n\n';
    csv += 'SUMMARY\n';
    csv += `Total Students,${data.summary.totalStudents}\n`;
    csv += `Total Departments,${data.summary.totalDepartments}\n`;
    csv += `Average GPA,${data.summary.averageGPA}\n`;
    csv += `Certificate Rate,${data.summary.certificateRate}%\n\n`;
    
    csv += 'DEPARTMENT ANALYSIS\n';
    csv += 'Department,Total Students,Average GPA,Certificate Rate\n';
    data.departmentAnalysis.distribution.forEach((dept: any) => {
      csv += `${dept.name},${dept.totalStudents},${dept.averageGPA},${dept.certificateRate}%\n`;
    });
    
    return csv;
  };

  if (isLoading && !reportsData) {
    console.log('📋 Showing ReportsSkeleton - isLoading:', isLoading, 'reportsData:', !!reportsData);
    return <ReportsSkeleton />;
  }

  if (error && !reportsData) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <p className="text-red-700 mb-4">{error}</p>
            <Button variant="outline" onClick={refreshReports}>Retry</Button>
          </div>
        </div>
      </div>
    );
  }

  if (!reportsData) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <BarChart3 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">Loading Reports...</h3>
            <p className="text-gray-500">Please wait while we load the data.</p>
            <Button variant="outline" onClick={refreshReports} className="mt-4">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (reportsData.summary.totalStudents === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <BarChart3 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">No Student Data Available</h3>
            <p className="text-gray-500 mb-4">Add student data to generate comprehensive reports.</p>
            <Button onClick={() => window.location.href = '/students'}>
              Add Students
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Streamlined Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
              {lastUpdated && (
                <span className="text-sm text-gray-500">{formatLastUpdated(lastUpdated)}</span>
              )}
            </div>
            
            {/* Simplified Action Bar */}
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCompactMode(!compactMode)}
                className="text-gray-600"
              >
                {compactMode ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={refreshReports}
                disabled={isLoading}
                className="text-gray-600"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                disabled={exportLoading}
              >
                <Download className="h-4 w-4 mr-1" />
                {exportLoading ? 'Exporting...' : 'Export'}
              </Button>
            </div>
          </div>

          {/* Simplified Tab Navigation */}
          <div className="flex space-x-1 mt-4">
            {[
              { key: 'overview', label: 'Overview' },
              { key: 'departments', label: 'Departments' },
              { key: 'performance', label: 'Performance' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveView(tab.key as any)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeView === tab.key
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto p-4">
        
        {/* Overview Tab */}
        {activeView === 'overview' && (
          <div className="space-y-6">
            {/* Key Metrics - Simplified Grid */}
            <div className={`grid gap-4 ${compactMode ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'}`}>
              <MetricCard
                title="Students"
                value={reportsData.summary.totalStudents.toLocaleString()}
                subtitle="Total registered"
                icon={<Users className="w-5 h-5" />}
                color="blue"
              />
              <MetricCard
                title="GPA Average"
                value={reportsData.summary.averageGPA.toFixed(2)}
                subtitle="Overall performance"
                icon={<TrendingUp className="w-5 h-5" />}
                color="green"
              />
              <MetricCard
                title="Certificates"
                value={`${reportsData.summary.certificateRate}%`}
                subtitle="Issuance rate"
                icon={<Award className="w-5 h-5" />}
                color="purple"
              />
              <MetricCard
                title="Departments"
                value={reportsData.summary.totalDepartments.toString()}
                subtitle="Active programs"
                icon={<GraduationCap className="w-5 h-5" />}
                color="orange"
              />
            </div>

            {/* Essential Charts - Responsive Grid */}
            <div className={`grid gap-6 ${compactMode ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1 xl:grid-cols-2'}`}>
              <SimpleBarChart
                title="Students by Department"
                data={reportsData.departmentAnalysis.distribution.slice(0, 8).map(dept => ({
                  label: dept.name.length > 15 ? dept.name.substring(0, 15) + '...' : dept.name,
                  value: dept.totalStudents,
                  color: 'bg-blue-500'
                }))}
              />

              <SimplePieChart
                title="Gender Distribution"
                data={reportsData.demographics.genderDistribution.map(gender => ({
                  label: gender.gender,
                  value: gender.count,
                  color: gender.gender === 'Male' ? 'bg-blue-500' : 'bg-pink-500'
                }))}
              />
            </div>
            
            {/* Quick Insights - Minimal */}
            {!compactMode && (
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
                <h3 className="text-sm font-semibold text-gray-800 mb-3">Quick Insights</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Highest GPA Department:</span>
                    <span className="font-medium text-gray-900">
                      {reportsData.departmentAnalysis.topPerforming[0]?.name || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Certificates Issued:</span>
                    <span className="font-medium text-gray-900">
                      {reportsData.certificates.totalIssued}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Latest Admission Year:</span>
                    <span className="font-medium text-gray-900">
                      {reportsData.trends.yearlyAdmissions[reportsData.trends.yearlyAdmissions.length - 1]?.year || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Departments Tab */}
        {activeView === 'departments' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold">Department Performance</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Students</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg GPA</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Certificates</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {reportsData.departmentAnalysis.distribution.map((dept, index) => (
                      <tr key={dept.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{dept.name}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{dept.totalStudents}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            dept.averageGPA >= 3.5 ? 'bg-green-100 text-green-800' :
                            dept.averageGPA >= 3.0 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {dept.averageGPA.toFixed(2)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">{dept.certificatesIssued}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{dept.certificateRate}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Performance Tab */}
        {activeView === 'performance' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SimpleBarChart
                title="GPA Distribution"
                data={reportsData.academicPerformance.gpaDistribution.map(gpa => ({
                  label: gpa.range.replace('GPA ', '').replace(' Range', ''),
                  value: gpa.count,
                  color: gpa.range.includes('Excellent') ? 'bg-green-500' : 
                         gpa.range.includes('Good') ? 'bg-blue-500' : 
                         gpa.range.includes('Satisfactory') ? 'bg-yellow-500' : 'bg-red-500'
                }))}
              />

              <SimpleBarChart
                title="Yearly Trends"
                data={reportsData.trends.yearlyAdmissions.slice(-5).map(year => ({
                  label: year.year,
                  value: year.count,
                  color: 'bg-indigo-500'
                }))}
              />
            </div>

            {/* Top Performers - Simplified */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold">Top Performers</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {reportsData.academicPerformance.topPerformers.slice(0, 6).map((student, index) => (
                    <div key={student.registrationId} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-900">{student.name}</span>
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                          {student.gpa.toFixed(2)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">{student.department}</p>
                      <p className="text-xs text-gray-400">{student.registrationId}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;
