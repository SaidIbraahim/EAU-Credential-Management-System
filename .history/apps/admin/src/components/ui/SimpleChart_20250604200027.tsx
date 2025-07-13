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
    <div className={`bg-white p-4 rounded-lg border ${className}`}>
      {title && (
        <h3 className="text-lg font-semibold mb-4 text-gray-800">{title}</h3>
      )}
      <div className="space-y-3">
        {data.map((item, index) => (
          <div key={index} className="flex items-center space-x-3">
            <div className="w-16 text-sm font-medium text-gray-700 text-right">
              {item.label}
            </div>
            <div className="flex-1 bg-gray-200 rounded-full h-6 relative overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-300 ease-out ${
                  item.color || 'bg-blue-500'
                }`}
                style={{ 
                  width: `${maxValue ? (item.value / maxValue) * 100 : 0}%` 
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-medium text-gray-700">
                  {item.value}
                </span>
              </div>
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
    <div className={`bg-white p-4 rounded-lg border ${className}`}>
      {title && (
        <h3 className="text-lg font-semibold mb-4 text-gray-800">{title}</h3>
      )}
      <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6">
        {/* Simple donut chart representation */}
        <div className="relative w-32 h-32">
          <div className="w-full h-full rounded-full overflow-hidden relative">
            {data.map((item, index) => {
              const percentage = total ? (item.value / total) * 100 : 0;
              return (
                <div
                  key={index}
                  className={`absolute inset-0 rounded-full ${item.color}`}
                  style={{
                    clipPath: `polygon(50% 50%, 50% 0%, ${
                      50 + 50 * Math.cos((percentage / 100) * 2 * Math.PI - Math.PI / 2)
                    }% ${
                      50 + 50 * Math.sin((percentage / 100) * 2 * Math.PI - Math.PI / 2)
                    }%, 50% 50%)`
                  }}
                />
              );
            })}
            <div className="absolute inset-4 bg-white rounded-full flex items-center justify-center">
              <span className="text-sm font-bold text-gray-700">{total}</span>
            </div>
          </div>
        </div>
        
        {/* Legend */}
        <div className="flex-1 space-y-2">
          {data.map((item, index) => (
            <div key={index} className="flex items-center space-x-2">
              <div 
                className={`w-3 h-3 rounded-full ${item.color}`}
              />
              <span className="text-sm text-gray-700">
                {item.label}: {item.value} ({total ? Math.round((item.value / total) * 100) : 0}%)
              </span>
            </div>
          ))}
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
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    green: 'bg-green-50 text-green-700 border-green-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    orange: 'bg-orange-50 text-orange-700 border-orange-200',
    red: 'bg-red-50 text-red-700 border-red-200'
  };

  return (
    <div className={`p-4 rounded-lg border ${colorClasses[color]} ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium opacity-80">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {subtitle && (
            <p className="text-xs opacity-70 mt-1">{subtitle}</p>
          )}
        </div>
        {icon && (
          <div className="ml-3 opacity-60">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}; 