
import { cn } from "@/lib/utils";
import { StatCardProps } from "@/types";

export function StatsCard({ title, value, subtitle, trend, icon, delay = 0 }: StatCardProps) {
  return (
    <div 
      className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-all animation-scale-in flex flex-col h-full" 
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-sm font-medium text-gray-500">{title}</h3>
          <div className="mt-1 flex items-baseline">
            <p className="text-2xl font-semibold text-gray-900">{value}</p>
          </div>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div className="p-2 bg-primary-100 text-primary-500 rounded-lg">
          {icon}
        </div>
      </div>
      
      {trend && (
        <div className="mt-auto pt-3 border-t border-gray-100">
          <span className={cn(
            "inline-flex items-center text-xs font-medium",
            trend.value > 0 ? "text-green-600" : trend.value < 0 ? "text-accent-500" : "text-gray-500"
          )}>
            <span className={cn(
              "mr-1.5 flex-shrink-0 self-center",
              trend.value > 0 ? "text-green-500" : trend.value < 0 ? "text-accent-500" : "text-gray-500"
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
