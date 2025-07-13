import { Users, Building2, UserRound, UserRoundX, GraduationCap, Award, Trophy, BarChart3, RefreshCw } from "lucide-react";
import StatsCard from "@/components/ui/StatsCard";
import { DashboardSkeleton } from "@/components/ui/DashboardSkeleton";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useDashboard } from "@/hooks/useDashboard";

const Dashboard = () => {
  const navigate = useNavigate();
  const { quickStats, isLoading, error, refreshStats, lastUpdated } = useDashboard(true, 30000);
  
  const handleRegisterStudent = () => {
    navigate('/students?tab=register');
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  const calculateTrend = (current: number, reference: number) => {
    if (reference === 0) return 0;
    return Math.round(((current - reference) / reference) * 100);
  };

  const formatLastUpdated = (date: Date | null) => {
    if (!date) return '';
    return `Last updated: ${date.toLocaleTimeString()}`;
  };
  
  // Show skeleton loading on initial load
  if (isLoading && !quickStats) {
    return <DashboardSkeleton />;
  }
  
  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto w-full animation-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
          {lastUpdated && (
            <p className="text-sm text-gray-500 mt-1">{formatLastUpdated(lastUpdated)}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline"
            size="sm"
            onClick={refreshStats}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            variant="default"
            onClick={handleRegisterStudent}
            className="flex items-center gap-2"
          >
            <span>Register Student</span>
          </Button>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2"
            onClick={refreshStats}
            disabled={isLoading}
          >
            Retry
          </Button>
        </div>
      )}
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard 
          title="Total Students" 
          value={isLoading ? "—" : formatNumber(quickStats?.totalStudents || 0)} 
          subtitle="Registered in system"
          trend={{ value: quickStats ? calculateTrend(quickStats.totalStudents, quickStats.lastYearGraduates) : 0 }}
          icon={<Users className="w-6 h-6" />}
          theme="blue"
          delay={100}
        />
        
        <StatsCard 
          title="Departments" 
          value={isLoading ? "—" : formatNumber(quickStats?.totalDepartments || 0)} 
          subtitle="Across university"
          icon={<Building2 className="w-6 h-6" />}
          theme="green"
          delay={200}
        />
        
        <StatsCard 
          title="Male Students" 
          value={isLoading ? "—" : formatNumber(quickStats?.maleStudents || 0)} 
          subtitle={`${quickStats?.malePercentage || 0}% of students`}
          icon={<UserRound className="w-6 h-6" />}
          theme="indigo"
          delay={300}
        />
        
        <StatsCard 
          title="Female Students" 
          value={isLoading ? "—" : formatNumber(quickStats?.femaleStudents || 0)} 
          subtitle={`${quickStats?.femalePercentage || 0}% of students`}
          icon={<UserRoundX className="w-6 h-6" />}
          theme="pink"
          delay={400}
        />
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard 
          title="Last Year Graduates" 
          value={isLoading ? "—" : formatNumber(quickStats?.lastYearGraduates || 0)} 
          subtitle={`Class of ${new Date().getFullYear() - 1}`}
          trend={{ value: quickStats?.lastYearGraduates ? 8 : 0 }}
          icon={<GraduationCap className="w-6 h-6" />}
          theme="purple"
          delay={500}
        />
        
        <StatsCard 
          title="Certificates Issued" 
          value={isLoading ? "—" : formatNumber(quickStats?.certificatesIssued || 0)} 
          subtitle={`${quickStats?.certificatePercentage || 0}% of students`}
          trend={{ value: quickStats?.certificatesIssued ? 3 : 0 }}
          icon={<Award className="w-6 h-6" />}
          theme="orange"
          delay={600}
        />
        
        <StatsCard 
          title="Perfect GPA (4.0)" 
          value={isLoading ? "—" : formatNumber(quickStats?.perfectGPAStudents || 0)} 
          subtitle={`${quickStats?.totalStudents ? Math.round((quickStats.perfectGPAStudents / quickStats.totalStudents) * 100) : 0}% of all students`}
          icon={<Trophy className="w-6 h-6" />}
          theme="teal"
          delay={700}
        />
        
        <StatsCard 
          title="System Status" 
          value={isLoading ? "—" : "Active"} 
          subtitle={`${formatNumber(quickStats?.totalStudents || 0)} total records`}
          icon={<BarChart3 className="w-6 h-6" />}
          theme="default"
          delay={800}
        />
      </div>
      
      <div className="mt-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">System Overview</h3>
          {quickStats && quickStats.totalStudents > 0 && (
            <div className="text-sm text-gray-500">
              Auto-refreshing every 30 seconds
            </div>
          )}
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm animation-fade-in">
          {isLoading ? (
            <div className="flex items-center justify-center min-h-80">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-500">Loading statistics...</p>
              </div>
            </div>
          ) : quickStats && quickStats.totalStudents > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">Student Distribution</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Male:</span>
                    <span className="font-medium">{quickStats.malePercentage}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Female:</span>
                    <span className="font-medium">{quickStats.femalePercentage}%</span>
                  </div>
                </div>
              </div>
              
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <h4 className="font-semibold text-green-900 mb-2">Academic Excellence</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Perfect GPA:</span>
                    <span className="font-medium">{quickStats.perfectGPAStudents}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Certificates:</span>
                    <span className="font-medium">{quickStats.certificatePercentage}%</span>
                  </div>
                </div>
              </div>
              
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <h4 className="font-semibold text-purple-900 mb-2">Recent Activity</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Departments:</span>
                    <span className="font-medium">{quickStats.totalDepartments}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Last Year:</span>
                    <span className="font-medium">{quickStats.lastYearGraduates}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center min-h-80">
              <div className="text-center">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No data available yet. Start by registering students.</p>
                <Button onClick={handleRegisterStudent}>
                  Register First Student
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
