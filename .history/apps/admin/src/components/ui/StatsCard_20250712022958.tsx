
import { cn } from "@/lib/utils";
import { StatCardProps } from "@/types";

export function StatsCard({ 
  title, 
  value, 
  subtitle, 
  trend, 
  icon, 
  delay = 0,
  theme = "default"
}: StatCardProps & { theme?: "default" | "blue" | "green" | "purple" | "orange" | "pink" | "indigo" | "teal" }) {
  
  // Define color themes for different cards
  const themes = {
    default: {
      bg: "bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200",
      iconBg: "bg-gradient-to-br from-blue-500 to-indigo-600 text-white",
      title: "text-blue-700",
      value: "text-blue-900",
      subtitle: "text-blue-600",
      hover: "hover:shadow-blue-200/50"
    },
    blue: {
      bg: "bg-gradient-to-br from-blue-50 to-cyan-100 border-blue-200",
      iconBg: "bg-gradient-to-br from-blue-500 to-cyan-600 text-white",
      title: "text-blue-700",
      value: "text-blue-900",
      subtitle: "text-blue-600",
      hover: "hover:shadow-blue-200/50"
    },
    green: {
      bg: "bg-gradient-to-br from-green-50 to-emerald-100 border-green-200",
      iconBg: "bg-gradient-to-br from-green-500 to-emerald-600 text-white",
      title: "text-green-700",
      value: "text-green-900",
      subtitle: "text-green-600",
      hover: "hover:shadow-green-200/50"
    },
    purple: {
      bg: "bg-gradient-to-br from-purple-50 to-violet-100 border-purple-200",
      iconBg: "bg-gradient-to-br from-purple-500 to-violet-600 text-white",
      title: "text-purple-700",
      value: "text-purple-900",
      subtitle: "text-purple-600",
      hover: "hover:shadow-purple-200/50"
    },
    orange: {
      bg: "bg-gradient-to-br from-orange-50 to-amber-100 border-orange-200",
      iconBg: "bg-gradient-to-br from-orange-500 to-amber-600 text-white",
      title: "text-orange-700",
      value: "text-orange-900",
      subtitle: "text-orange-600",
      hover: "hover:shadow-orange-200/50"
    },
    pink: {
      bg: "bg-gradient-to-br from-pink-50 to-rose-100 border-pink-200",
      iconBg: "bg-gradient-to-br from-pink-500 to-rose-600 text-white",
      title: "text-pink-700",
      value: "text-pink-900",
      subtitle: "text-pink-600",
      hover: "hover:shadow-pink-200/50"
    },
    indigo: {
      bg: "bg-gradient-to-br from-indigo-50 to-blue-100 border-indigo-200",
      iconBg: "bg-gradient-to-br from-indigo-500 to-blue-600 text-white",
      title: "text-indigo-700",
      value: "text-indigo-900",
      subtitle: "text-indigo-600",
      hover: "hover:shadow-indigo-200/50"
    },
    teal: {
      bg: "bg-gradient-to-br from-teal-50 to-cyan-100 border-teal-200",
      iconBg: "bg-gradient-to-br from-teal-500 to-cyan-600 text-white",
      title: "text-teal-700",
      value: "text-teal-900",
      subtitle: "text-teal-600",
      hover: "hover:shadow-teal-200/50"
    }
  };

  const currentTheme = themes[theme];

  return (
    <div 
      className={cn(
        "rounded-xl border p-6 shadow-sm hover:shadow-lg transition-all duration-300 animation-scale-in flex flex-col h-full transform hover:-translate-y-1",
        currentTheme.bg,
        currentTheme.hover
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className={cn("text-sm font-semibold uppercase tracking-wide", currentTheme.title)}>
            {title}
          </h3>
          <div className="mt-2 flex items-baseline">
            <p className={cn("text-3xl font-bold", currentTheme.value)}>
              {value}
            </p>
          </div>
          {subtitle && (
            <p className={cn("text-sm mt-1 font-medium", currentTheme.subtitle)}>
              {subtitle}
            </p>
          )}
        </div>
        <div className={cn(
          "p-3 rounded-xl shadow-sm",
          currentTheme.iconBg
        )}>
          {icon}
        </div>
      </div>
      
      {trend && (
        <div className="mt-auto pt-4 border-t border-white/20">
          <span className={cn(
            "inline-flex items-center text-sm font-semibold",
            trend.value > 0 ? "text-green-600" : trend.value < 0 ? "text-red-500" : "text-gray-600"
          )}>
            <span className={cn(
              "mr-2 flex-shrink-0 self-center text-xs px-2 py-1 rounded-full",
              trend.value > 0 ? "bg-green-100 text-green-800" : trend.value < 0 ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-800"
            )}>
              {trend.value > 0 ? '+' : ''}{trend.value}%
            </span>
            {trend.label || "vs last period"}
          </span>
        </div>
      )}
    </div>
  );
}

export default StatsCard;
