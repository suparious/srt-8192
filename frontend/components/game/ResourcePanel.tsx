import React, { useState } from 'react';
import { 
  Zap, 
  Box, 
  Cpu, 
  Brain, 
  Heart,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  ArrowRightLeft
} from 'lucide-react';
import {
  Resources,
  ResourceType,
  ResourceModifiers
} from '../../types/game';

interface ResourcePanelProps {
  resources: Resources;
  modifiers?: ResourceModifiers;
  productionRates?: Partial<Resources>;
  maintenanceCosts?: Partial<Resources>;
  maxStorage?: Partial<Resources>;
  onTradeClick?: (resource: ResourceType) => void;
  className?: string;
}

const ResourcePanel = ({
  resources,
  modifiers,
  productionRates = {},
  maintenanceCosts = {},
  maxStorage = {},
  onTradeClick,
  className = ''
}: ResourcePanelProps) => {
  const [expandedResource, setExpandedResource] = useState<ResourceType | null>(null);

  const resourceIcons = {
    [ResourceType.ENERGY]: Zap,
    [ResourceType.MATERIALS]: Box,
    [ResourceType.TECHNOLOGY]: Cpu,
    [ResourceType.INTELLIGENCE]: Brain,
    [ResourceType.MORALE]: Heart
  };

  const resourceColors = {
    [ResourceType.ENERGY]: 'text-yellow-500',
    [ResourceType.MATERIALS]: 'text-brown-500',
    [ResourceType.TECHNOLOGY]: 'text-blue-500',
    [ResourceType.INTELLIGENCE]: 'text-purple-500',
    [ResourceType.MORALE]: 'text-red-500'
  };

  const formatNumber = (value: number): string => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}k`;
    }
    return value.toFixed(0);
  };

  const getNetChange = (resource: ResourceType): number => {
    const production = productionRates[resource] || 0;
    const maintenance = maintenanceCosts[resource] || 0;
    return production - maintenance;
  };

  const getStoragePercentage = (resource: ResourceType): number => {
    if (!maxStorage[resource]) return 0;
    return (resources[resource] / maxStorage[resource]) * 100;
  };

  const renderResourceCard = (type: ResourceType) => {
    const Icon = resourceIcons[type];
    const isExpanded = expandedResource === type;
    const netChange = getNetChange(type);
    const storagePercentage = getStoragePercentage(type);

    return (
      <div
        className={`bg-white rounded-lg shadow-sm border transition-all duration-200
          ${isExpanded ? 'border-blue-500' : 'border-gray-200'}
          ${storagePercentage >= 90 ? 'ring-2 ring-yellow-400' : ''}
          hover:border-blue-300`}
      >
        {/* Main Resource Display */}
        <div 
          className="p-4 cursor-pointer"
          onClick={() => setExpandedResource(isExpanded ? null : type)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Icon className={`w-6 h-6 ${resourceColors[type]}`} />
              <div>
                <h3 className="font-medium text-gray-900">
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </h3>
                <p className="text-sm text-gray-500">
                  {formatNumber(resources[type])}
                  {maxStorage[type] && (
                    <span className="ml-1 text-gray-400">
                      / {formatNumber(maxStorage[type])}
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {netChange !== 0 && (
                <div className={`flex items-center space-x-1 
                  ${netChange > 0 ? 'text-green-500' : 'text-red-500'}`}
                >
                  {netChange > 0 ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  <span className="text-sm">{formatNumber(Math.abs(netChange))}/s</span>
                </div>
              )}
            </div>
          </div>

          {/* Storage Bar */}
          {maxStorage[type] && (
            <div className="mt-2">
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${
                    storagePercentage >= 90 ? 'bg-yellow-500' :
                    storagePercentage >= 75 ? 'bg-blue-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(100, storagePercentage)}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="px-4 pb-4 pt-2 border-t border-gray-100">
            <div className="space-y-2">
              {/* Production Rate */}
              {productionRates[type] !== undefined && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Production</span>
                  <span className="text-green-500">
                    +{formatNumber(productionRates[type])}/s
                  </span>
                </div>
              )}

              {/* Maintenance Cost */}
              {maintenanceCosts[type] !== undefined && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Maintenance</span>
                  <span className="text-red-500">
                    -{formatNumber(maintenanceCosts[type])}/s
                  </span>
                </div>
              )}

              {/* Efficiency */}
              {modifiers?.efficiency !== undefined && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Efficiency</span>
                  <span className="text-blue-500">
                    {(modifiers.efficiency * 100).toFixed(0)}%
                  </span>
                </div>
              )}

              {/* Trade Button */}
              {onTradeClick && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onTradeClick(type);
                  }}
                  className="mt-2 w-full flex items-center justify-center space-x-2 
                    px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-md 
                    text-sm font-medium text-gray-700 transition-colors"
                >
                  <ArrowRightLeft className="w-4 h-4" />
                  <span>Trade</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Critical Warnings */}
        {resources[type] < (maintenanceCosts[type] || 0) && (
          <div className="px-4 pb-3">
            <div className="flex items-center space-x-2 text-xs text-red-500">
              <AlertCircle className="w-4 h-4" />
              <span>Insufficient resources for maintenance</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}>
      {Object.values(ResourceType).map((type) => renderResourceCard(type))}
    </div>
  );
};

export default ResourcePanel;