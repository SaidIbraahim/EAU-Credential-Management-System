import React, { useState } from "react";
import { 
  BarChart3, Download, RefreshCw, Users, GraduationCap, Award, 
  TrendingUp, Filter, Eye, EyeOff, Calendar, Database, Target,
  BookOpen, Trophy, PieChart, Activity, ChevronRight, Sparkles, Building2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useReports } from "@/hooks/useReports";
import { SimpleBarChart, SimplePieChart, MetricCard } from "@/components/ui/SimpleChart";
import ReportsSkeleton from "@/components/ui/ReportsSkeleton";

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
    return <ReportsSkeleton />;
  }

  if (error && !reportsData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-8 text-center">
              <div className="p-4 bg-red-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Activity className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-red-900 mb-2">Failed to Load Reports</h3>
              <p className="text-red-700 mb-6">{error}</p>
              <Button 
                variant="outline" 
                onClick={refreshReports}
                className="border-red-300 text-red-700 hover:bg-red-100"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry Loading
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!reportsData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <Card className="border-gray-200 bg-white shadow-sm">
            <CardContent className="p-12 text-center">
              <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <BarChart3 className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Reports...</h3>
              <p className="text-gray-600 mb-6">Please wait while we compile your data insights.</p>
              <Button 
                variant="outline" 
                onClick={refreshReports}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                {isLoading ? 'Loading...' : 'Retry'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (reportsData.summary.totalStudents === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <Card className="border-gray-200 bg-white shadow-sm">
            <CardContent className="p-12 text-center">
              <div className="p-4 bg-blue-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Data Available</h3>
              <p className="text-gray-600 mb-6">Add student data to generate comprehensive reports and insights.</p>
              <Button 
                onClick={() => window.location.href = '/students'}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Users className="h-4 w-4 mr-2" />
                Add Students
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                  <BarChart3 className="h-8 w-8" />
                </div>
                Analytics & Reports
              </h1>
              <p className="text-blue-100 mt-2 text-lg">
                Comprehensive insights into student performance and system metrics
              </p>
              {lastUpdated && (
                <p className="text-blue-200 text-sm mt-1">
                  {formatLastUpdated(lastUpdated)}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCompactMode(!compactMode)}
                className="text-white hover:bg-white/20 border-white/30"
              >
                {compactMode ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={refreshReports}
                disabled={isLoading}
                className="text-white hover:bg-white/20 border-white/30"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleExport}
                disabled={exportLoading}
                className="bg-white/20 hover:bg-white/30 text-white border-white/30"
              >
                <Download className="h-4 w-4 mr-2" />
                {exportLoading ? 'Exporting...' : 'Export CSV'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Tab Navigation */}
        <div className="flex items-center gap-2 mb-8">
          {[
            { key: 'overview', label: 'Overview', icon: Activity },
            { key: 'departments', label: 'Departments', icon: Building2 },
            { key: 'performance', label: 'Performance', icon: TrendingUp }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveView(tab.key as any)}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                activeView === tab.key
                  ? 'bg-white text-blue-600 shadow-lg ring-1 ring-blue-200'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/60'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeView === 'overview' && (
          <div className="space-y-8">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200 hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-700">Total Students</p>
                      <p className="text-3xl font-bold text-blue-900">{reportsData.summary.totalStudents.toLocaleString()}</p>
                      <p className="text-xs text-blue-600 mt-1">Active enrollments</p>
                    </div>
                    <div className="p-3 bg-blue-600 rounded-xl">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-emerald-100 border-green-200 hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-700">Average GPA</p>
                      <p className="text-3xl font-bold text-green-900">{reportsData.summary.averageGPA.toFixed(2)}</p>
                      <p className="text-xs text-green-600 mt-1">Overall performance</p>
                    </div>
                    <div className="p-3 bg-green-600 rounded-xl">
                      <TrendingUp className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-violet-100 border-purple-200 hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-700">Certificate Rate</p>
                      <p className="text-3xl font-bold text-purple-900">{reportsData.summary.certificateRate}%</p>
                      <p className="text-xs text-purple-600 mt-1">Completion rate</p>
                    </div>
                    <div className="p-3 bg-purple-600 rounded-xl">
                      <Award className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-50 to-amber-100 border-orange-200 hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-orange-700">Departments</p>
                      <p className="text-3xl font-bold text-orange-900">{reportsData.summary.totalDepartments}</p>
                      <p className="text-xs text-orange-600 mt-1">Active programs</p>
                    </div>
                    <div className="p-3 bg-orange-600 rounded-xl">
                      <GraduationCap className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white shadow-sm border-gray-200 hover:shadow-md transition-shadow">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                    Students by Department
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <SimpleBarChart
                    data={reportsData.departmentAnalysis.distribution.slice(0, 8).map(dept => ({
                      label: dept.name.length > 15 ? dept.name.substring(0, 15) + '...' : dept.name,
                      value: dept.totalStudents,
                      color: 'bg-blue-500'
                    }))}
                  />
                </CardContent>
              </Card>

              <Card className="bg-white shadow-sm border-gray-200 hover:shadow-md transition-shadow">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <PieChart className="h-5 w-5 text-pink-600" />
                    Gender Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <SimplePieChart
                    data={reportsData.demographics.genderDistribution.map(gender => ({
                      label: gender.gender,
                      value: gender.count,
                      color: gender.gender === 'Male' ? 'bg-blue-500' : 'bg-pink-500'
                    }))}
                  />
                </CardContent>
              </Card>
            </div>
            
            {/* Quick Insights */}
            <Card className="bg-gradient-to-r from-gray-50 to-blue-50 border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-blue-600" />
                  Key Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Top Performing Department</span>
                      <Trophy className="h-4 w-4 text-yellow-500" />
                    </div>
                    <p className="text-lg font-semibold text-gray-900 mt-1">
                      {reportsData.departmentAnalysis.topPerforming[0]?.name || 'N/A'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {reportsData.departmentAnalysis.topPerforming[0]?.averageGPA?.toFixed(2) || 'N/A'} GPA
                    </p>
                  </div>

                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Certificates Issued</span>
                      <Award className="h-4 w-4 text-purple-500" />
                    </div>
                    <p className="text-lg font-semibold text-gray-900 mt-1">
                      {reportsData.certificates.totalIssued}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {reportsData.summary.certificateRate}% completion
                    </p>
                  </div>

                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Latest Admission</span>
                      <Calendar className="h-4 w-4 text-blue-500" />
                    </div>
                    <p className="text-lg font-semibold text-gray-900 mt-1">
                      {reportsData.trends.yearlyAdmissions[reportsData.trends.yearlyAdmissions.length - 1]?.year || 'N/A'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {reportsData.trends.yearlyAdmissions[reportsData.trends.yearlyAdmissions.length - 1]?.count || 0} students
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Departments Tab */}
        {activeView === 'departments' && (
          <div className="space-y-6">
            <Card className="bg-white shadow-sm border-gray-200">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50 border-b border-gray-200">
                <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-blue-600" />
                  Department Performance Analysis
                </CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Detailed breakdown of student performance across all departments
                </p>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Department
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Students
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Average GPA
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Certificates
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Success Rate
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {reportsData.departmentAnalysis.distribution.map((dept, index) => (
                        <tr key={dept.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-blue-100 rounded-lg">
                                <BookOpen className="h-4 w-4 text-blue-600" />
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{dept.name}</p>
                                <p className="text-xs text-gray-500">Department #{index + 1}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <span className="text-lg font-semibold text-gray-900">
                                {dept.totalStudents}
                              </span>
                              <Badge variant="secondary" className="text-xs">
                                {((dept.totalStudents / reportsData.summary.totalStudents) * 100).toFixed(1)}%
                              </Badge>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <Badge 
                              variant={dept.averageGPA >= 3.5 ? 'default' : dept.averageGPA >= 3.0 ? 'secondary' : 'destructive'}
                              className={`font-medium ${
                                dept.averageGPA >= 3.5 ? 'bg-green-100 text-green-800' :
                                dept.averageGPA >= 3.0 ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}
                            >
                              {dept.averageGPA.toFixed(2)}
                            </Badge>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-lg font-semibold text-gray-900">
                              {dept.certificatesIssued}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <span className="text-lg font-semibold text-gray-900">
                                {dept.certificateRate}%
                              </span>
                              <div className="w-20 bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${dept.certificateRate}%` }}
                                />
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Performance Tab */}
        {activeView === 'performance' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white shadow-sm border-gray-200 hover:shadow-md transition-shadow">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    GPA Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <SimpleBarChart
                    data={reportsData.academicPerformance.gpaDistribution.map(gpa => ({
                      label: gpa.range.replace('GPA ', '').replace(' Range', ''),
                      value: gpa.count,
                      color: gpa.range.includes('Excellent') ? 'bg-green-500' : 
                             gpa.range.includes('Good') ? 'bg-blue-500' : 
                             gpa.range.includes('Satisfactory') ? 'bg-yellow-500' : 'bg-red-500'
                    }))}
                  />
                </CardContent>
              </Card>

              <Card className="bg-white shadow-sm border-gray-200 hover:shadow-md transition-shadow">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-indigo-600" />
                    Admission Trends
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <SimpleBarChart
                    data={reportsData.trends.yearlyAdmissions.slice(-5).map(year => ({
                      label: year.year,
                      value: year.count,
                      color: 'bg-indigo-500'
                    }))}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Top Performers */}
            <Card className="bg-white shadow-sm border-gray-200">
              <CardHeader className="bg-gradient-to-r from-yellow-50 to-orange-50 border-b border-gray-200">
                <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-600" />
                  Top Performing Students
                </CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Highest achieving students across all departments
                </p>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {reportsData.academicPerformance.topPerformers.slice(0, 6).map((student, index) => (
                    <div key={student.registrationId} className="bg-gradient-to-br from-gray-50 to-blue-50 p-4 rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                            index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-amber-600' : 'bg-blue-500'
                          }`}>
                            {index + 1}
                          </div>
                          <span className="text-sm font-semibold text-gray-900">{student.name}</span>
                        </div>
                        <Badge className="bg-green-100 text-green-800 font-medium">
                          {student.gpa.toFixed(2)}
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-gray-700 font-medium">{student.department}</p>
                        <p className="text-xs text-gray-500">{student.registrationId}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;
