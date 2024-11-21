import React from 'react';
import { useState, useEffect } from 'react';
import { GameAction, GamePhase, Resources, ActionResult } from '../../types/game';
import {
  ChevronDown,
  Sword,
  Building,
  Users,
  Flask,
  Move,
  Shield
} from 'lucide-react';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';

interface ActionPanelProps {
  playerResources: Resources;
  currentPhase: GamePhase;
  onActionSubmit: (action: GameAction) => Promise<ActionResult>;
  disabled?: boolean;
  selectedRegionId?: string;
}

const ActionPanel = ({
  playerResources,
  currentPhase,
  onActionSubmit,
  disabled = false,
  selectedRegionId
}: ActionPanelProps) => {
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Reset states when phase changes
  useEffect(() => {
    setSelectedAction(null);
    setError(null);
    setSuccess(null);
  }, [currentPhase]);

  const actions = [
    {
      id: 'military',
      label: 'Military Action',
      icon: <Sword className="w-5 h-5" />,
      description: 'Deploy units or engage in combat',
      phase: ['action'],
      subActions: [
        { id: 'attack', label: 'Attack', cost: { energy: 100, materials: 50 } },
        { id: 'defend', label: 'Defend', cost: { energy: 50, materials: 100 } }
      ]
    },
    {
      id: 'build',
      label: 'Construction',
      icon: <Building className="w-5 h-5" />,
      description: 'Build structures and defenses',
      phase: ['preparation'],
      subActions: [
        { id: 'fortress', label: 'Build Fortress', cost: { materials: 200, technology: 50 } },
        { id: 'factory', label: 'Build Factory', cost: { materials: 150, energy: 100 } }
      ]
    },
    {
      id: 'diplomatic',
      label: 'Diplomacy',
      icon: <Users className="w-5 h-5" />,
      description: 'Negotiate with other players',
      phase: ['preparation', 'action'],
      subActions: [
        { id: 'alliance', label: 'Propose Alliance', cost: { intelligence: 50 } },
        { id: 'trade', label: 'Trade Resources', cost: { intelligence: 25 } }
      ]
    },
    {
      id: 'research',
      label: 'Research',
      icon: <Flask className="w-5 h-5" />,
      description: 'Develop new technologies',
      phase: ['preparation'],
      subActions: [
        { id: 'military-tech', label: 'Military Research', cost: { technology: 150, intelligence: 50 } },
        { id: 'economic-tech', label: 'Economic Research', cost: { technology: 100, intelligence: 100 } }
      ]
    },
    {
      id: 'movement',
      label: 'Movement',
      icon: <Move className="w-5 h-5" />,
      description: 'Move units between regions',
      phase: ['action'],
      subActions: [
        { id: 'reposition', label: 'Reposition Units', cost: { energy: 50 } },
        { id: 'retreat', label: 'Strategic Retreat', cost: { energy: 75 } }
      ]
    },
    {
      id: 'defense',
      label: 'Defense',
      icon: <Shield className="w-5 h-5" />,
      description: 'Fortify and defend regions',
      phase: ['preparation', 'action'],
      subActions: [
        { id: 'fortify', label: 'Fortify Region', cost: { materials: 100, energy: 50 } },
        { id: 'shield', label: 'Deploy Shields', cost: { energy: 150, technology: 50 } }
      ]
    }
  ];

  const handleActionSelect = (actionId: string) => {
    setSelectedAction(selectedAction === actionId ? null : actionId);
    setError(null);
    setSuccess(null);
  };

  const handleSubActionClick = async (actionId: string, subAction: { id: string, label: string, cost: Partial<Resources> }) => {
    if (!selectedRegionId) {
      setError('Please select a region first');
      return;
    }

    // Check if player has enough resources
    for (const [resource, amount] of Object.entries(subAction.cost)) {
      if ((playerResources[resource] || 0) < amount) {
        setError(`Insufficient ${resource} for this action`);
        return;
      }
    }

    setLoading(true);
    setError(null);
    
    try {
      const result = await onActionSubmit({
        id: crypto.randomUUID(),
        type: actionId,
        source: selectedRegionId,
        target: selectedRegionId,
        resources: subAction.cost,
        timestamp: Date.now()
      });

      if (result.success) {
        setSuccess(`${subAction.label} action completed successfully`);
        setSelectedAction(null);
      } else {
        setError('Action failed: ' + result.messages.join(', '));
      }
    } catch (err) {
      setError('Failed to execute action');
    } finally {
      setLoading(false);
    }
  };

  const canShowAction = (action: typeof actions[0]) => {
    return action.phase.includes(currentPhase);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Actions</h2>
        <div className="text-sm text-gray-500">
          Phase: {currentPhase.charAt(0).toUpperCase() + currentPhase.slice(1)}
        </div>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert>
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Action Buttons */}
      <div className="space-y-2">
        {actions.filter(canShowAction).map((action) => (
          <div key={action.id} className="space-y-2">
            <button
              onClick={() => handleActionSelect(action.id)}
              disabled={disabled || loading}
              className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                selectedAction === action.id
                  ? 'bg-blue-50 border-blue-200 text-blue-700'
                  : 'bg-gray-50 hover:bg-gray-100 border-gray-200'
              } border`}
            >
              <div className="flex items-center space-x-3">
                <div className={`${
                  selectedAction === action.id ? 'text-blue-600' : 'text-gray-600'
                }`}>
                  {action.icon}
                </div>
                <div className="text-left">
                  <div className="font-medium">{action.label}</div>
                  <div className="text-sm text-gray-500">{action.description}</div>
                </div>
              </div>
              <ChevronDown className={`w-5 h-5 transition-transform ${
                selectedAction === action.id ? 'transform rotate-180' : ''
              }`} />
            </button>

            {/* Sub-actions */}
            {selectedAction === action.id && (
              <div className="ml-8 space-y-2">
                {action.subActions.map((subAction) => (
                  <button
                    key={subAction.id}
                    onClick={() => handleSubActionClick(action.id, subAction)}
                    disabled={disabled || loading}
                    className="w-full flex items-center justify-between p-2 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-sm font-medium">{subAction.label}</span>
                    <div className="text-xs text-gray-500 space-x-2">
                      {Object.entries(subAction.cost).map(([resource, amount]) => (
                        <span key={resource} className="inline-flex items-center">
                          {resource}: {amount}
                        </span>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* No actions available message */}
      {actions.filter(canShowAction).length === 0 && (
        <div className="text-center py-4 text-gray-500">
          No actions available during this phase
        </div>
      )}
    </div>
  );
};

export default ActionPanel;