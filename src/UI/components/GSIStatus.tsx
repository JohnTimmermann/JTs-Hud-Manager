import { useState, useEffect } from "react";
import axios from "axios";
import { apiUrl } from "../api/api";
import { ButtonContained } from "./ButtonContained";

interface GSIStatusData {
  isConnected: boolean;
  lastHeartbeat: string | null;
  connectionQuality: 'excellent' | 'good' | 'poor' | 'disconnected';
  totalPackets: number;
  packetsPerSecond: number;
  statusText: string;
  configFileInstalled: boolean;
}

export const GSIStatus = () => {
  const [gsiStatus, setGsiStatus] = useState<GSIStatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [installing, setInstalling] = useState(false);
  const [installMessage, setInstallMessage] = useState("");

  useEffect(() => {
    fetchGSIStatus();
    
    // Poll for status updates every 3 seconds
    const interval = setInterval(fetchGSIStatus, 3000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchGSIStatus = async () => {
    try {
      const response = await axios.get(`${apiUrl}/gsistatus/status`);
      setGsiStatus(response.data);
      setError("");
    } catch (err) {
      setError("Failed to fetch GSI status");
      console.error("Error fetching GSI status:", err);
    } finally {
      setLoading(false);
    }
  };

  const resetStatistics = async () => {
    try {
      await axios.post(`${apiUrl}/gsistatus/reset`);
      await fetchGSIStatus();
    } catch (err) {
      setError("Failed to reset GSI statistics");
      console.error("Error resetting GSI stats:", err);
    }
  };

  const reinstallGSIConfig = async () => {
    setInstalling(true);
    setInstallMessage("");
    setError("");
    
    try {
      const response = await axios.post(`${apiUrl}/gsistatus/reinstall`);
      setInstallMessage(`GSI config installed successfully to: ${response.data.installedTo}`);
      
      // Refresh the GSI status to show updated config file status
      setTimeout(async () => {
        await fetchGSIStatus();
      }, 1000);
    } catch (err) {
      if (err instanceof Error && 'response' in err && 
          typeof err.response === 'object' && err.response !== null &&
          'data' in err.response && 
          typeof err.response.data === 'object' && err.response.data !== null &&
          'error' in err.response.data && 
          typeof err.response.data.error === 'string') {
        setError(`Failed to install GSI config: ${err.response.data.error}`);
        if ('details' in err.response.data && typeof err.response.data.details === 'string') {
          console.error("GSI installation details:", err.response.data.details);
        }
      } else {
        setError("Failed to install GSI config file");
      }
      console.error("Error installing GSI config:", err);
    } finally {
      setInstalling(false);
    }
  };

  const getStatusColor = (quality: string): string => {
    switch (quality) {
      case 'excellent':
        return 'text-green-500';
      case 'good':
        return 'text-blue-500';
      case 'poor':
        return 'text-yellow-500';
      case 'disconnected':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const getStatusIcon = (quality: string): string => {
    switch (quality) {
      case 'excellent':
        return '🟢';
      case 'good':
        return '🟡';
      case 'poor':
        return '🟠';
      case 'disconnected':
        return '🔴';
      default:
        return '⚫';
    }
  };

  if (loading) {
    return (
      <div className="rounded-lg bg-background-secondary p-6 shadow-md">
        <h2 className="mb-4 text-xl font-semibold">GSI Status</h2>
        <p className="text-text-secondary">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-background-secondary p-6 shadow-md">
        <h2 className="mb-4 text-xl font-semibold">GSI Status</h2>
        <p className="text-red-500">{error}</p>
        <ButtonContained onClick={fetchGSIStatus} className="mt-4">
          Retry
        </ButtonContained>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-background-secondary p-6 shadow-md">
      <h2 className="mb-4 text-xl font-semibold">Game State Integration (GSI)</h2>
      
      {gsiStatus && (
        <div className="space-y-4">
          {/* Connection Status */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Connection Status:</span>
            <div className="flex items-center gap-2">
              <span>{getStatusIcon(gsiStatus.connectionQuality)}</span>
              <span className={`font-semibold ${getStatusColor(gsiStatus.connectionQuality)}`}>
                {gsiStatus.connectionQuality.charAt(0).toUpperCase() + gsiStatus.connectionQuality.slice(1)}
              </span>
            </div>
          </div>

          {/* Status Text */}
          <div className="text-sm text-text-secondary">
            {gsiStatus.statusText}
          </div>

          {/* Statistics */}
          {gsiStatus.isConnected && (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-text-secondary">Packets/sec:</span>
                <span className="ml-2 font-medium">{gsiStatus.packetsPerSecond}</span>
              </div>
              <div>
                <span className="text-text-secondary">Total packets:</span>
                <span className="ml-2 font-medium">{gsiStatus.totalPackets.toLocaleString()}</span>
              </div>
            </div>
          )}

          {/* Last Heartbeat */}
          {gsiStatus.lastHeartbeat && (
            <div className="text-sm">
              <span className="text-text-secondary">Last data:</span>
              <span className="ml-2 font-medium">
                {new Date(gsiStatus.lastHeartbeat).toLocaleTimeString()}
              </span>
            </div>
          )}

          {/* Config File Status */}
          <div className="flex items-center justify-between border-t border-border pt-4">
            <div>
              <span className="text-sm font-medium">Config File:</span>
              <div className="text-xs text-text-secondary mt-1">
                gamestate_integration_openhud.cfg
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span>{gsiStatus.configFileInstalled ? '✅' : '❌'}</span>
              <span className={`text-sm font-medium ${
                gsiStatus.configFileInstalled ? 'text-green-500' : 'text-red-500'
              }`}>
                {gsiStatus.configFileInstalled ? 'Installed' : 'Not Found'}
              </span>
            </div>
          </div>

          {/* Install/Error Messages */}
          {installMessage && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800">
              ✅ {installMessage}
            </div>
          )}
          
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
              ❌ {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 pt-2">
            <ButtonContained onClick={resetStatistics} className="px-3 py-1 text-xs">
              Reset Stats
            </ButtonContained>
            
            <ButtonContained 
              onClick={reinstallGSIConfig}
              disabled={installing}
              className="px-3 py-1 text-xs bg-primary hover:bg-primary-dark"
            >
              {installing ? "Installing..." : "Reinstall GSI Config"}
            </ButtonContained>
            
            <ButtonContained 
              onClick={() => {
                window.electron.openHudsDirectory();
              }}
              className="px-3 py-1 text-xs bg-secondary hover:bg-secondary-dark"
            >
              Help
            </ButtonContained>
          </div>

          {/* Help Text */}
          {!gsiStatus.isConnected && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm">
              <h4 className="font-semibold text-yellow-800 mb-2">Troubleshooting:</h4>
              <ul className="text-yellow-700 space-y-1 list-disc list-inside">
                <li>Make sure CS2 is running</li>
                <li>Copy gamestate_integration_openhud.cfg to CS2/game/csgo/cfg/</li>
                <li>Restart CS2 after installing the config file</li>
                <li>Check that the config file contains the correct localhost URL</li>
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};