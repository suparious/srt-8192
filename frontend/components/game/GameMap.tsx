import React, { useState, useEffect } from 'react';
import { Map, Shield, Flag, AlertTriangle } from 'lucide-react';
import { Region, MilitaryUnit, RegionStatus, Coordinate } from '../../types/game';

interface GameMapProps {
  regions: Region[];
  selectedRegion?: string;
  controlledRegions: string[];
  militaryUnits: MilitaryUnit[];
  onRegionSelect: (regionId: string) => void;
  onUnitSelect?: (unitId: string) => void;
  isActive?: boolean;
}

const GameMap = ({
  regions,
  selectedRegion,
  controlledRegions,
  militaryUnits,
  onRegionSelect,
  onUnitSelect,
  isActive = true
}: GameMapProps) => {
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);
  const [mapDimensions, setMapDimensions] = useState({ width: 0, height: 0 });

  // Calculate map dimensions based on region coordinates
  useEffect(() => {
    const maxX = Math.max(...regions.map(r => r.coordinates.x)) + 1;
    const maxY = Math.max(...regions.map(r => r.coordinates.y)) + 1;
    setMapDimensions({ width: maxX * 100, height: maxY * 100 });
  }, [regions]);

  const getRegionStatusColor = (status: RegionStatus) => {
    switch (status) {
      case RegionStatus.CONTROLLED:
        return 'bg-blue-100 border-blue-500';
      case RegionStatus.CONTESTED:
        return 'bg-yellow-100 border-yellow-500';
      case RegionStatus.ENEMY_CONTROLLED:
        return 'bg-red-100 border-red-500';
      case RegionStatus.NEUTRAL:
        return 'bg-gray-100 border-gray-500';
      case RegionStatus.WASTELAND:
        return 'bg-gray-800 border-gray-900';
      default:
        return 'bg-gray-100 border-gray-500';
    }
  };

  const getRegionIcon = (region: Region) => {
    if (region.status === RegionStatus.CONTESTED) {
      return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    }
    if (controlledRegions.includes(region.id)) {
      return <Flag className="h-5 w-5 text-blue-500" />;
    }
    return <Shield className="h-5 w-5 text-gray-500" />;
  };

  const renderRegion = (region: Region) => {
    const isSelected = selectedRegion === region.id;
    const isHovered = hoveredRegion === region.id;
    const statusColor = getRegionStatusColor(region.status);
    
    return (
      <div
        key={region.id}
        className={`absolute p-4 w-24 h-24 border-2 rounded-lg cursor-pointer transition-all
          ${statusColor}
          ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
          ${isHovered ? 'transform scale-105' : ''}
          ${isActive ? 'hover:shadow-lg' : 'opacity-75 cursor-not-allowed'}
        `}
        style={{
          left: `${region.coordinates.x * 100}px`,
          top: `${region.coordinates.y * 100}px`
        }}
        onClick={() => isActive && onRegionSelect(region.id)}
        onMouseEnter={() => setHoveredRegion(region.id)}
        onMouseLeave={() => setHoveredRegion(null)}
      >
        <div className="flex flex-col items-center justify-between h-full">
          {getRegionIcon(region)}
          <span className="text-xs font-medium text-center truncate">
            {region.name}
          </span>
        </div>
      </div>
    );
  };

  const renderUnit = (unit: MilitaryUnit) => {
    const unitClasses = {
      ready: 'bg-green-100 border-green-500',
      moving: 'bg-blue-100 border-blue-500',
      engaged: 'bg-red-100 border-red-500',
      recovering: 'bg-yellow-100 border-yellow-500'
    };

    return (
      <div
        key={unit.id}
        className={`absolute w-6 h-6 border-2 rounded-full cursor-pointer
          ${unitClasses[unit.status]}
          ${isActive ? 'hover:shadow-md hover:scale-110' : 'opacity-75 cursor-not-allowed'}
          transition-all duration-200
        `}
        style={{
          left: `${unit.position.x * 100 + 40}px`,
          top: `${unit.position.y * 100 + 40}px`,
          transform: 'translate(-50%, -50%)'
        }}
        onClick={() => isActive && onUnitSelect?.(unit.id)}
      >
        <div className="relative w-full h-full">
          {/* Health bar */}
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500"
              style={{ width: `${unit.health}%` }}
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="relative w-full h-full overflow-auto border border-gray-200 rounded-lg bg-gray-50">
      <div
        className="relative"
        style={{
          width: `${mapDimensions.width}px`,
          height: `${mapDimensions.height}px`
        }}
      >
        {/* Grid lines */}
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(to right, #e5e7eb 1px, transparent 1px), linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)',
          backgroundSize: '100px 100px'
        }} />

        {/* Regions */}
        {regions.map(renderRegion)}

        {/* Units */}
        {militaryUnits.map(renderUnit)}
      </div>

      {/* Map Controls */}
      <div className="absolute bottom-4 right-4 flex flex-col space-y-2">
        <button className="p-2 bg-white rounded-full shadow-lg hover:bg-gray-50">
          <Map className="h-6 w-6 text-gray-600" />
        </button>
      </div>

      {/* Mini-map could be added here */}
    </div>
  );
};

export default GameMap;