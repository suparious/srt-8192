import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  BarChart2, 
  AlertTriangle,
  Shield, 
  Zap,
  Users,
  ChevronUp,
  ChevronDown,
  Menu
} from 'lucide-react';
import {
  GameState,
  GamePhase,
  Resources,
  AIMetrics
} from '../../types/game';

interface HUDProps {
  gameState: GameState;
  resources: Resources;
  aiThreat: AIMetrics;
  cycleProgress: number;
  phase: GamePhase;
  timeRemaining: number;
  playerCount: number;
  notifications?: string[];
  onMenuClick?: () => void;
}

const HUD = ({
  gameState,
  resources,
  aiThreat,
  cycleProgress,
  phase,
  timeRemaining,
  playerCount,
  notifications = [],
  onMenuClick
}: HUDProps) => {
  const [minimized, setMinimized] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [currentNotification, setCurrentNotification] = useState<string>('');

  // Handle notifications queue
  useEffect(() => {
    if (notifications.length > 0 && !showNotification) {
      setCurrentNotification(notifications[0]);
      setShowNotification(true);
      
      const timer = setTimeout(() => {
        setShowNotification(false);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [notifications, showNotification]);

  const formatTimeRemaining = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getPhaseColor = (phase: GamePhase): string => {
    switch (phase) {
      case 'preparation':
        return 'text-blue-500';
      case 'action':
        return 'text-green-500';
      case 'resolution':
        return 'text-yellow-500';
      case 'intermission':
        return 'text-purple-500';
      default:
        return 'text-gray-500';
    }
  };

  const getThreatLevel = (threat: number): { color: string; text: string } => {
    if (threat >= 0.8) {
      return { color: 'text-red-500', text: 'Critical' };
    } else if (threat >= 0.6) {
      return { color: 'text-orange-500', text: 'High' };
    } else if (threat >= 0.4) {
      return { color: 'text-yellow-500', text: 'Moderate' };
    } else {
      return { color: 'text-green-500', text: 'Low' };
    }
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      {/* Top Bar */}
      <div className={`bg-gray-900/95 backdrop-blur-sm border-b border-gray-700 text-white transition-all duration-300 ${minimized ? 'h-12' : 'h-24'}`}>
        <div className="max-w-7xl mx-auto px-4 h-full">
          <div className="flex items-center justify-between h-12">
            {/* Left Section */}
            <div className="flex items-center space-x-4">
              <button 
                onClick={onMenuClick}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <Menu className="w-5 h-5" />
              </button>

              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-blue-400" />
                <span className="font-mono">{formatTimeRemaining(timeRemaining)}</span>
              </div>

              <div className="flex items-center space-x-2">
                <BarChart2 className="w-5 h-5 text-green-400" />
                <span>{Math.floor(cycleProgress * 8192)}/8192</span>
              </div>
            </div>

            {/* Center Section */}
            <div className="flex items-center space-x-4">
              <span className={`font-medium ${getPhaseColor(phase)}`}>
                {phase.charAt(0).toUpperCase() + phase.slice(1)} Phase
              </span>
            </div>

            {/* Right Section */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-blue-400" />
                <span>{playerCount}</span>
              </div>

              <div className="flex items-center space-x-2">
                <AlertTriangle className={`w-5 h-5 ${getThreatLevel(aiThreat.aggressionLevel).color}`} />
                <span className={getThreatLevel(aiThreat.aggressionLevel).color}>
                  {getThreatLevel(aiThreat.aggressionLevel).text}
                </span>
              </div>

              <button 
                onClick={() => setMinimized(!minimized)}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                {minimized ? (
                  <ChevronDown className="w-5 h-5" />
                ) : (
                  <ChevronUp className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Expanded Content */}
          {!minimized && (
            <div className="h-12 flex items-center justify-between">
              {/* Resources */}
              <div className="flex items-center space-x-6">
                {Object.entries(resources).map(([resource, amount]) => (
                  <div key={resource} className="flex items-center space-x-2">
                    <Zap className="w-4 h-4 text-yellow-400" />
                    <span className="font-mono text-sm">
                      {amount.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>

              {/* AI Activity */}
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Shield className="w-4 h-4 text-purple-400" />
                  <span className="text-sm">Defense Level: {Math.floor(aiThreat.techProgress * 100)}%</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Notifications */}
      {showNotification && (
        <div className="absolute top-24 left-1/2 transform -translate-x-1/2">
          <div className="bg-gray-900/90 text-white px-4 py-2 rounded-lg shadow-lg border border-gray-700 backdrop-blur-sm">
            {currentNotification}
          </div>
        </div>
      )}
    </div>
  );
};

export default HUD;