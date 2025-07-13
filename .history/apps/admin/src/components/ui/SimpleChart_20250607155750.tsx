import React from 'react';

interface BarChartProps {
  data: Array<{
    label: string;
    value: number;
    color?: string;
  }>;
  title?: string;
  className?: string;
}

export const SimpleBarChart: React.FC<BarChartProps> = ({ 
  data, 
  title, 
  className = "" 
}) => {
  const maxValue = Math.max(...data.map(item => item.value));
  
  return (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>
      {title && (
        <div className="px-4 py-3 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
        </div>
      )}
      <div className="p-4 space-y-2">
        {data.map((item, index) => (
          <div key={index} className="flex items-center space-x-3">
            <div className="w-14 text-xs text-gray-600 text-right font-medium truncate">
              {item.label}
            </div>
            <div className="flex-1 bg-gray-100 rounded h-4 relative overflow-hidden">
              <div 
                className={`h-full rounded transition-all duration-300 ease-out ${
                  item.color || 'bg-blue-500'
                }`}
                style={{ 
                  width: `${maxValue ? (item.value / maxValue) * 100 : 0}%` 
                }}
              />
              {item.value > 0 && (
                <div className="absolute inset-0 flex items-center justify-end pr-2">
                  <span className="text-xs font-medium text-gray-700">
                    {item.value}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

interface PieChartProps {
  data: Array<{
    label: string;
    value: number;
    color: string;
  }>;
  title?: string;
  className?: string;
}

export const SimplePieChart: React.FC<PieChartProps> = ({ 
  data, 
  title, 
  className = "" 
}) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  
  return (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>
      {title && (
        <div className="px-4 py-3 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
        </div>
      )}
      <div className="p-4">
        <div className="flex items-center space-x-4">
          {/* Simplified Donut Chart */}
          <div className="relative w-24 h-24 flex-shrink-0">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="48"
                cy="48"
                r="40"
                fill="none"
                stroke="#f3f4f6"
                strokeWidth="8"
              />
              {data.map((item, index) => {
                const percentage = total ? (item.value / total) * 100 : 0;
                const circumference = 2 * Math.PI * 40;
                const strokeLength = (percentage / 100) * circumference;
                const strokeOffset = data.slice(0, index).reduce((sum, d) => {
                  const prevPercentage = total ? (d.value / total) * 100 : 0;
                  return sum + (prevPercentage / 100) * circumference;
                }, 0);
                
                const colorClass = item.color.includes('blue') ? '#3b82f6' :
                                 item.color.includes('pink') ? '#ec4899' :
                                 item.color.includes('green') ? '#10b981' : '#6b7280';
                
                return (
                  <circle
                    key={index}
                    cx="48"
                    cy="48"
                    r="40"
                    fill="none"
                    stroke={colorClass}
                    strokeWidth="8"
                    strokeDasharray={`${strokeLength} ${circumference}`}
                    strokeDashoffset={-strokeOffset}
                    strokeLinecap="round"
                  />
                );
              })}
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-bold text-gray-700">{total}</span>
            </div>
          </div>
          
          {/* Compact Legend */}
          <div className="flex-1 space-y-1">
            {data.map((item, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${item.color}`} />
                  <span className="text-gray-700">{item.label}</span>
                </div>
                <div className="text-gray-600 font-medium">
                  {item.value} ({total ? Math.round((item.value / total) * 100) : 0}%)
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red';
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  color = 'blue',
  className = ""
}) => {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200',
    green: 'bg-green-50 border-green-200',
    purple: 'bg-purple-50 border-purple-200',
    orange: 'bg-orange-50 border-orange-200',
    red: 'bg-red-50 border-red-200'
  };

  const iconColorClasses = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    purple: 'text-purple-600',
    orange: 'text-orange-600',
    red: 'text-red-600'
  };

  const textColorClasses = {
    blue: 'text-blue-900',
    green: 'text-green-900',
    purple: 'text-purple-900',
    orange: 'text-orange-900',
    red: 'text-red-900'
  };

  return (
    <div className={`p-4 rounded-lg border ${colorClasses[color]} ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-600 truncate">{title}</p>
          <p className={`text-2xl font-bold mt-1 ${textColorClasses[color]}`}>{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1 truncate">{subtitle}</p>
          )}
        </div>
        {icon && (
          <div className={`ml-3 flex-shrink-0 ${iconColorClasses[color]}`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}; 