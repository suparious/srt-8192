import React from 'react';
import Layout from '../components/Layout';
import { GameCycle } from '../types/game';
import { Activity, Users, Trophy, Clock, ChevronRight, Shield } from 'lucide-react';

const IndexPage = () => {
  // Example game cycle state - would be fetched from backend
  const [gameCycle, setGameCycle] = React.useState<GameCycle>({
    current: 1024,
    total: 8192,
    phase: 'action',
    timeRemaining: 300,
  });

  const [activeGames, setActiveGames] = React.useState(1842);
  const [onlinePlayers, setOnlinePlayers] = React.useState(5280);

  const formatTimeRemaining = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <Layout title="Welcome to 8192">
      <div className="space-y-8">
        {/* Game Status Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center space-x-4">
              <Activity className="h-8 w-8 text-blue-500" />
              <div>
                <h3 className="text-sm font-medium text-blue-900">Active Games</h3>
                <p className="text-2xl font-bold text-blue-600">{activeGames}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Users className="h-8 w-8 text-blue-500" />
              <div>
                <h3 className="text-sm font-medium text-blue-900">Online Players</h3>
                <p className="text-2xl font-bold text-blue-600">{onlinePlayers}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Clock className="h-8 w-8 text-blue-500" />
              <div>
                <h3 className="text-sm font-medium text-blue-900">Cycle Progress</h3>
                <p className="text-2xl font-bold text-blue-600">
                  {gameCycle.current}/{gameCycle.total}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Game Modes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Quick Match */}
          <div className="group relative bg-white rounded-lg border border-gray-200 p-6 hover:border-blue-500 transition-colors">
            <div className="flex justify-between items-start">
              <div className="flex items-center space-x-4">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <Shield className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Quick Match</h2>
                  <p className="mt-1 text-sm text-gray-500">Join a game instantly</p>
                </div>
              </div>
              <ChevronRight className="h-6 w-6 text-gray-400 group-hover:text-blue-500 transition-colors" />
            </div>
            <button className="mt-4 w-full game-btn-primary">
              Play Now
            </button>
          </div>

          {/* Ranked Match */}
          <div className="group relative bg-white rounded-lg border border-gray-200 p-6 hover:border-blue-500 transition-colors">
            <div className="flex justify-between items-start">
              <div className="flex items-center space-x-4">
                <div className="bg-purple-100 p-3 rounded-lg">
                  <Trophy className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Ranked Match</h2>
                  <p className="mt-1 text-sm text-gray-500">Compete for leaderboard positions</p>
                </div>
              </div>
              <ChevronRight className="h-6 w-6 text-gray-400 group-hover:text-blue-500 transition-colors" />
            </div>
            <button className="mt-4 w-full game-btn-primary">
              Find Match
            </button>
          </div>
        </div>

        {/* Current Cycle Information */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Current Cycle Information</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-4 border-b border-gray-200">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Phase</h3>
                <p className="mt-1 text-sm text-gray-500">Current game phase</p>
              </div>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                {gameCycle.phase.charAt(0).toUpperCase() + gameCycle.phase.slice(1)}
              </span>
            </div>
            <div className="flex justify-between items-center pb-4 border-b border-gray-200">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Time Remaining</h3>
                <p className="mt-1 text-sm text-gray-500">Until next phase</p>
              </div>
              <span className="text-lg font-mono font-medium text-gray-900">
                {formatTimeRemaining(gameCycle.timeRemaining)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Progress</h3>
                <p className="mt-1 text-sm text-gray-500">Cycle completion</p>
              </div>
              <div className="w-32">
                <div className="bg-gray-200 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className="bg-blue-600 h-full rounded-full"
                    style={{ width: `${(gameCycle.current / gameCycle.total) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default IndexPage;