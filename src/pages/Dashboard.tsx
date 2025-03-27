
import { Users, Building2, UserRound, UserRoundX, GraduationCap, Award, Trophy, BarChart3 } from "lucide-react";
import StatsCard from "@/components/ui/StatsCard";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Dashboard = () => {
  // For the demo, we'll use mock data
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  
  useEffect(() => {
    // Simulate data loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  const handleRegisterStudent = () => {
    navigate('/students?tab=register');
  };
  
  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto w-full animation-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <Button 
          variant="default"
          onClick={handleRegisterStudent}
          className="flex items-center gap-2"
        >
          <span>Register Student</span>
        </Button>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard 
          title="Total Students" 
          value={isLoading ? "—" : "0"} 
          subtitle="Registered in system"
          trend={{ value: 5 }}
          icon={<Users className="w-5 h-5" />}
          delay={100}
        />
        
        <StatsCard 
          title="Departments" 
          value={isLoading ? "—" : "0"} 
          subtitle="Across university"
          icon={<Building2 className="w-5 h-5" />}
          delay={200}
        />
        
        <StatsCard 
          title="Male Students" 
          value={isLoading ? "—" : "0"} 
          subtitle="0% of students"
          icon={<UserRound className="w-5 h-5" />}
          delay={300}
        />
        
        <StatsCard 
          title="Female Students" 
          value={isLoading ? "—" : "0"} 
          subtitle="0% of students"
          icon={<UserRoundX className="w-5 h-5" />}
          delay={400}
        />
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard 
          title="Last Year Graduates" 
          value={isLoading ? "—" : "0"} 
          subtitle="Class of 2024"
          trend={{ value: 8 }}
          icon={<GraduationCap className="w-5 h-5" />}
          delay={500}
        />
        
        <StatsCard 
          title="Certificates Issued" 
          value={isLoading ? "—" : "0"} 
          subtitle="97% of graduates"
          trend={{ value: 3 }}
          icon={<Award className="w-5 h-5" />}
          delay={600}
        />
        
        <StatsCard 
          title="Best Performing Department" 
          value={isLoading ? "—" : "N/A"} 
          subtitle="Average GPA: 0.0"
          icon={<Trophy className="w-5 h-5" />}
          delay={700}
        />
        
        <StatsCard 
          title="Perfect GPA" 
          value={isLoading ? "—" : "4.0"} 
          subtitle="0 students achieved perfect GPA"
          icon={<BarChart3 className="w-5 h-5" />}
          delay={800}
        />
      </div>
      
      <div className="mt-8">
        <h3 className="text-lg font-medium mb-4">Graduate Statistics</h3>
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm animation-fade-in min-h-80 flex items-center justify-center">
          <p className="text-gray-500">No data available yet. Add students to see statistics.</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
