import React from 'react';
import { Battery, Box, Brain, Heart, Zap } from 'lucide-react';
import { ResourceType, Resources } from '../../types/game';

interface ResourceDisplayProps {
  resources: Resources;
  showLabels?: boolean;
  showTrends?: boolean;
  compact?: boolean;
  className?: string;
}

const ResourceDisplay = ({ 
  resources, 
  showLabels = true, 
  showTrends = false,
  compact = false,
  className = '' 
}: ResourceDisplayProps) => {
  const getResourceIcon = (type: ResourceType) => {
    switch (type) {
      case ResourceType.ENERGY:
        return <Zap className="h-5 w-5 text-yellow-500" />;
      case ResourceType.MATERIALS:
        return <Box className="h-5 w-5 text-brown-500" />;
      case ResourceType.TECHNOLOGY:
        return <Battery className="h-5 w-5 text-blue-500" />;
      case ResourceType.INTELLIGENCE:
        return <Brain className="h-5 w-5 text-purple-500" />;
      case ResourceType.MORALE:
        return <Heart className="h-5 w-5 text-red-500" />;
    }
  };

  const getResourceName = (type: ResourceType) => {
    return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
  };

  const formatNumber = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toString();
  };

  const getResourceTrend = (type: ResourceType) => {
    // This would be connected to actual trend data in a real implementation
    const trendValue = Math.random() * 2 - 1; // Mock trend between -1 and 1
    
    if (trendValue > 0.2) {
      return <span className="text-green-500 text-xs">↑</span>;
    } else if (trendValue < -0.2) {
      return <span className="text-red-500 text-xs">↓</span>;
    }
    return <span className="text-gray-500 text-xs">→</span>;
  };

  return (
    <div className={`flex ${compact ? 'flex-col space-y-2' : 'flex-row space-x-4'} ${className}`}>
      {Object.entries(resources).map(([type, value]) => (
        <div 
          key={type}
          className={`flex items-center ${compact ? 'justify-between' : 'space-x-2'} 
            bg-white rounded-lg shadow-sm p-2 ${compact ? 'w-full' : 'min-w-[120px]'}`}
        >
          <div className="flex items-center space-x-2">
            {getResourceIcon(type as ResourceType)}
            {showLabels && (
              <span className="text-sm font-medium text-gray-700">
                {getResourceName(type as ResourceType)}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-1">
            <span className="font-mono text-sm font-medium text-gray-900">
              {formatNumber(value)}
            </span>
            {showTrends && getResourceTrend(type as ResourceType)}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ResourceDisplay;