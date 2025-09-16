import { EventEmitter } from "events";
import { io } from "../sockets/sockets.js";

interface GSIStatusState {
  isConnected: boolean;
  lastHeartbeat: Date | null;
  connectionQuality: 'excellent' | 'good' | 'poor' | 'disconnected';
  totalPackets: number;
  packetsPerSecond: number;
}

class GSIStatusMonitor extends EventEmitter {
  private status: GSIStatusState = {
    isConnected: false,
    lastHeartbeat: null,
    connectionQuality: 'disconnected',
    totalPackets: 0,
    packetsPerSecond: 0,
  };

  private heartbeatTimeout: NodeJS.Timeout | null = null;
  private packetTimestamps: Date[] = [];
  private readonly HEARTBEAT_TIMEOUT_MS = 5000; // 5 seconds without data = disconnected
  private readonly PACKET_RATE_WINDOW_MS = 5000; // 5 second window for packet rate calculation

  constructor() {
    super();
    this.startMonitoring();
  }

  // Call this when GSI data is received
  recordPacket(): void {
    const now = new Date();
    this.status.lastHeartbeat = now;
    this.status.totalPackets++;
    
    // Add timestamp for rate calculation
    this.packetTimestamps.push(now);
    
    // Clean old timestamps outside the window
    const cutoff = new Date(now.getTime() - this.PACKET_RATE_WINDOW_MS);
    this.packetTimestamps = this.packetTimestamps.filter(timestamp => timestamp > cutoff);
    
    // Calculate packets per second
    this.status.packetsPerSecond = Math.round((this.packetTimestamps.length / this.PACKET_RATE_WINDOW_MS) * 1000);
    
    // Update connection status
    this.updateConnectionStatus();
    
    // Reset heartbeat timeout
    this.resetHeartbeatTimeout();
    
    // Emit status update
    this.emitStatusUpdate();
  }

  private updateConnectionStatus(): void {
    const wasConnected = this.status.isConnected;
    this.status.isConnected = true;
    
    // Determine connection quality based on packet rate
    if (this.status.packetsPerSecond >= 50) {
      this.status.connectionQuality = 'excellent';
    } else if (this.status.packetsPerSecond >= 20) {
      this.status.connectionQuality = 'good';
    } else if (this.status.packetsPerSecond >= 5) {
      this.status.connectionQuality = 'poor';
    } else {
      this.status.connectionQuality = 'disconnected';
      this.status.isConnected = false;
    }

    // If connection state changed, emit event
    if (wasConnected !== this.status.isConnected) {
      this.emit('connectionChange', this.status.isConnected);
    }
  }

  private resetHeartbeatTimeout(): void {
    if (this.heartbeatTimeout) {
      clearTimeout(this.heartbeatTimeout);
    }
    
    this.heartbeatTimeout = setTimeout(() => {
      this.handleHeartbeatTimeout();
    }, this.HEARTBEAT_TIMEOUT_MS);
  }

  private handleHeartbeatTimeout(): void {
    const wasConnected = this.status.isConnected;
    this.status.isConnected = false;
    this.status.connectionQuality = 'disconnected';
    this.status.packetsPerSecond = 0;
    this.packetTimestamps = [];
    
    if (wasConnected) {
      this.emit('connectionChange', false);
      this.emitStatusUpdate();
    }
  }

  private emitStatusUpdate(): void {
    // Emit to socket clients
    io.emit('gsiStatus', this.getStatus());
    
    // Emit local event
    this.emit('statusUpdate', this.getStatus());
  }

  private startMonitoring(): void {
    // Emit status every 2 seconds
    setInterval(() => {
      this.emitStatusUpdate();
    }, 2000);
  }

  getStatus(): GSIStatusState {
    return { ...this.status };
  }

  // Get human-readable status
  getStatusText(): string {
    if (!this.status.isConnected) {
      return "GSI Disconnected - Check CS2 is running and config file is installed";
    }

    switch (this.status.connectionQuality) {
      case 'excellent':
        return `GSI Connected - Excellent (${this.status.packetsPerSecond} pps)`;
      case 'good':
        return `GSI Connected - Good (${this.status.packetsPerSecond} pps)`;
      case 'poor':
        return `GSI Connected - Poor (${this.status.packetsPerSecond} pps)`;
      default:
        return "GSI Status Unknown";
    }
  }

  // Reset statistics
  reset(): void {
    this.status.totalPackets = 0;
    this.status.packetsPerSecond = 0;
    this.packetTimestamps = [];
    this.emitStatusUpdate();
  }
}

export const gsiStatusMonitor = new GSIStatusMonitor();