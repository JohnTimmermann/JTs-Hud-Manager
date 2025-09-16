import { useState, useEffect } from "react";
import { ButtonContained } from "./ButtonContained";
import { RecordGSIButton } from "./RecordGSIButton";
import axios from "axios";
import { apiUrl } from "../api/api";
import { socket } from "../api/socket";

interface Demo {
  filename: string;
  size: number;
  created: string;
  packetCount: number;
  duration: string;
  hasTimestamps: boolean;
}

interface PlaybackStatus {
  playing: boolean;
  loaded: boolean;
  currentPacket: number;
  totalPackets: number;
  progress: number;
  speed: number;
}

interface LoopStatus {
  looping: boolean;
  filename: string | null;
  playing: boolean;
}

export const DemoPlayback = () => {
  const [demos, setDemos] = useState<Demo[]>([]);
  const [selectedDemo, setSelectedDemo] = useState<string | null>(null);
  const [playbackStatus, setPlaybackStatus] = useState<PlaybackStatus>({
    playing: false,
    loaded: false,
    currentPacket: 0,
    totalPackets: 0,
    progress: 0,
    speed: 1
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [customSpeed, setCustomSpeed] = useState("1");
  const [loopStatus, setLoopStatus] = useState<LoopStatus>({
    looping: false,
    filename: null,
    playing: false
  });

  useEffect(() => {
    fetchDemos();
    fetchPlaybackStatus();
    fetchLoopStatus();

    // Listen for demo progress updates
    socket.on("demoProgress", (progress: { currentPacket: number; totalPackets: number; progress: number }) => {
      setPlaybackStatus(prev => ({
        ...prev,
        currentPacket: progress.currentPacket,
        totalPackets: progress.totalPackets,
        progress: progress.progress
      }));
    });

    socket.on("demoFinished", () => {
      setSuccess("Demo playback finished");
      fetchPlaybackStatus();
    });

    return () => {
      socket.off("demoProgress");
      socket.off("demoFinished");
    };
  }, []);

  const fetchDemos = async () => {
    try {
      const response = await axios.get(`${apiUrl}/gsi/demos`);
      setDemos(response.data.demos);
    } catch (error) {
      console.error("Error fetching demos:", error);
      setError("Failed to load demo files");
    }
  };

  const fetchPlaybackStatus = async () => {
    try {
      const response = await axios.get(`${apiUrl}/gsi/demo/status`);
      setPlaybackStatus(response.data);
    } catch (error) {
      console.error("Error fetching playback status:", error);
    }
  };

  const fetchLoopStatus = async () => {
    try {
      const response = await axios.get(`${apiUrl}/gsi/loop-status`);
      setLoopStatus(response.data);
    } catch (error) {
      console.error("Error fetching loop status:", error);
    }
  };

  const deleteDemo = async (filename: string) => {
    if (!confirm(`Are you sure you want to delete "${filename}"? This action cannot be undone.`)) {
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await axios.post(`${apiUrl}/gsi/demo/delete`, { filename });
      setSuccess(`Demo "${filename}" deleted successfully`);

      // If this was the selected demo, clear selection
      if (selectedDemo === filename) {
        setSelectedDemo(null);
      }

      // Refresh demo list
      await fetchDemos();
      await fetchPlaybackStatus();
    } catch (err) {
      const errorMessage = (err as { response?: { data?: { error?: string } } }).response?.data?.error || "Failed to delete demo";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const changeSpeed = async (speed: number) => {
    setLoading(true);
    setError("");

    try {
      await axios.post(`${apiUrl}/gsi/demo/speed`, { speed });
      setCustomSpeed(speed.toString());
      await fetchPlaybackStatus();
    } catch (err) {
      const errorMessage = (err as { response?: { data?: { error?: string } } }).response?.data?.error || "Failed to change speed";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const startDemo = async (speed: number = 1) => {
    if (!selectedDemo) {
      setError("Please select a demo to play");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await axios.post(`${apiUrl}/gsi/demo/start`, {
        filename: selectedDemo,
        speed
      });
      setSuccess(`Started demo playback`);
      await fetchPlaybackStatus();
      await fetchLoopStatus();
    } catch (err) {
      const errorMessage = (err as { response?: { data?: { error?: string } } }).response?.data?.error || "Failed to start demo";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const stopDemo = async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await axios.post(`${apiUrl}/gsi/demo/stop`);
      setSuccess("Demo playback stopped");
      await fetchPlaybackStatus();
    } catch {
      setError("Failed to stop demo");
    } finally {
      setLoading(false);
    }
  };

  const toggleDemo = async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await axios.post(`${apiUrl}/gsi/demo/toggle`);
      setSuccess(response.data.message);
      await fetchPlaybackStatus();
    } catch (err) {
      const errorMessage = (err as { response?: { data?: { error?: string } } }).response?.data?.error || "Failed to toggle demo";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const toggleLoop = async (filename?: string) => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await axios.post(`${apiUrl}/gsi/toggle-loop`, { filename });
      setSuccess(response.data.message);
      await fetchLoopStatus();
      await fetchPlaybackStatus();
    } catch (err) {
      const errorMessage = (err as { response?: { data?: { error?: string } } }).response?.data?.error || "Failed to toggle loop";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatFileSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const exportDemo = async (filename: string) => {
    try {
      const demoResponse = await fetch(`/testdata/${filename}`);
      const demoData = await demoResponse.json();

      // Create download link
      const blob = new Blob([JSON.stringify(demoData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setSuccess(`Demo "${filename}" exported successfully`);
    } catch (error) {
      console.error("Error exporting demo:", error);
      setError("Failed to export demo");
    }
  };

  const importDemo = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const fileContent = await file.text();
      const demoData = JSON.parse(fileContent);

      // Validate demo format
      if (!demoData.version || !demoData.packets || !Array.isArray(demoData.packets)) {
        setError("Invalid demo file format");
        return;
      }

      // Create FormData to upload
      const formData = new FormData();
      const blob = new Blob([fileContent], { type: 'application/json' });
      formData.append('demo', blob, file.name);

      await axios.post(`${apiUrl}/gsi/import-demo`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setSuccess(`Demo "${file.name}" imported successfully`);
      await fetchDemos();
    } catch (err) {
      const errorMessage = (err as { response?: { data?: { error?: string } } }).response?.data?.error || "Failed to import demo";
      setError(errorMessage);
    } finally {
      setLoading(false);
      // Reset file input
      event.target.value = '';
    }
  };

  return (
    <div className="rounded-lg bg-background-secondary p-6 shadow-md">
      <h2 className="mb-4 text-xl font-semibold">Demo Testing & Playback</h2>

      {error && (
        <div className="mb-4 rounded-lg border border-red-400 bg-red-100 px-4 py-3 text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 rounded-lg border border-green-400 bg-green-100 px-4 py-3 text-green-700">
          {success}
        </div>
      )}

      <div className="space-y-4">
        {/* Recording */}
        <div className="flex items-center gap-4">
          <RecordGSIButton onRecorded={() => {
            setSuccess("GSI data recorded successfully");
            fetchDemos();
          }} />
        </div>

        {/* Demo Selection */}
        {demos.length > 0 && (
          <div>
            <h3 className="mb-3 font-medium">Select Demo to Replay:</h3>
            <div className="space-y-2">
              {demos.map((demo) => (
                <div
                  key={demo.filename}
                  className={`flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-colors hover:bg-background-light ${
                    selectedDemo === demo.filename
                      ? "border-primary bg-primary/10"
                      : "border-border"
                  }`}
                  onClick={() => setSelectedDemo(demo.filename)}
                >
                  <div>
                    <div className="font-medium">{demo.filename}</div>
                    <div className="text-sm text-text-secondary">
                      {formatDate(demo.created)} • {demo.packetCount.toLocaleString()} packets • {demo.duration}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-sm text-text-secondary">
                      {formatFileSize(demo.size)}
                    </div>
                    <ButtonContained
                      onClick={(e) => {
                        e.stopPropagation();
                        exportDemo(demo.filename);
                      }}
                      disabled={loading}
                      className="bg-blue-600 px-2 py-1 text-xs hover:bg-blue-700"
                      title="Export this demo"
                    >
                      Export
                    </ButtonContained>
                    <ButtonContained
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteDemo(demo.filename);
                      }}
                      disabled={loading}
                      className="bg-red-600 px-2 py-1 text-xs hover:bg-red-700"
                      title="Delete this demo"
                    >
                      Delete
                    </ButtonContained>
                  </div>
                </div>
              ))}
            </div>

            {/* Import Demo */}
            <div className="mt-4 flex items-center gap-2">
              <input
                type="file"
                accept=".json"
                onChange={importDemo}
                className="hidden"
                id="demo-import"
              />
              <ButtonContained
                onClick={() => document.getElementById('demo-import')?.click()}
                disabled={loading}
                className="bg-green-600 px-3 py-1 text-sm hover:bg-green-700"
              >
                Import Demo
              </ButtonContained>
              <span className="text-xs text-text-secondary">
                Import .json demo files
              </span>
            </div>
          </div>
        )}

        {/* Simple Play/Stop Controls */}
        {demos.length > 0 && selectedDemo && (
          <div className="flex items-center gap-3">
            {!playbackStatus.loaded ? (
              <ButtonContained
                onClick={() => startDemo(1)}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700"
              >
                {loading ? "Starting..." : "Play"}
              </ButtonContained>
            ) : (
              <ButtonContained
                onClick={stopDemo}
                disabled={loading}
                className="bg-red-600 hover:bg-red-700"
              >
                Stop
              </ButtonContained>
            )}

            {(playbackStatus.loaded || playbackStatus.playing) && (
              <ButtonContained
                onClick={toggleDemo}
                disabled={loading}
                className={`${
                  playbackStatus.playing
                    ? "bg-yellow-600 hover:bg-yellow-700"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {playbackStatus.playing ? "Pause" : "Resume"}
              </ButtonContained>
            )}

            <div className="text-sm text-text-secondary">
              Playing: <span className="font-medium text-text-primary">{selectedDemo}</span>
            </div>
          </div>
        )}

        {/* Playback Status */}
        {playbackStatus.loaded && (
          <div className="rounded-lg border border-border p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-medium">
                {playbackStatus.playing ? "Playing" : "Paused"}
              </span>
              <span className="text-sm text-text-secondary">
                {playbackStatus.speed}x speed
              </span>
            </div>

            <div className="mb-2 h-2 w-full rounded-full bg-gray-200">
              <div
                className="h-2 rounded-full bg-primary transition-all duration-300"
                style={{ width: `${playbackStatus.progress}%` }}
              />
            </div>

            <div className="flex justify-between text-sm text-text-secondary">
              <span>
                Packet {playbackStatus.currentPacket.toLocaleString()} of {playbackStatus.totalPackets.toLocaleString()}
              </span>
              <span>{playbackStatus.progress.toFixed(1)}%</span>
            </div>
          </div>
        )}


        {/* Playback Controls - Speed and Loop */}
        {(playbackStatus.loaded || playbackStatus.playing) && (
          <div className="space-y-3">
            <div>
              <h4 className="mb-2 text-sm font-medium">Speed Control:</h4>
              <div className="flex flex-wrap gap-2">
                {[0.25, 0.5, 1, 1.5, 2, 4, 8].map(speed => (
                  <ButtonContained
                    key={speed}
                    onClick={() => changeSpeed(speed)}
                    disabled={loading}
                    className={`px-2 py-1 text-xs ${
                      playbackStatus.speed === speed
                        ? "bg-purple-800 hover:bg-purple-900"
                        : "bg-purple-600 hover:bg-purple-700"
                    }`}
                  >
                    {speed}x
                  </ButtonContained>
                ))}

                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={customSpeed}
                    onChange={(e) => setCustomSpeed(e.target.value)}
                    min="0.1"
                    max="50"
                    step="0.1"
                    className="w-16 rounded border border-border bg-background px-2 py-1 text-xs"
                    placeholder="1.0"
                  />
                  <ButtonContained
                    onClick={() => changeSpeed(parseFloat(customSpeed) || 1)}
                    disabled={loading || !customSpeed}
                    className="bg-purple-600 px-2 py-1 text-xs hover:bg-purple-700"
                  >
                    Set
                  </ButtonContained>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">Loop:</span>
              <ButtonContained
                onClick={() => loopStatus.looping ? toggleLoop() : toggleLoop(selectedDemo || demos[0]?.filename)}
                disabled={loading}
                className={`px-3 py-1 text-sm ${
                  loopStatus.looping
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-gray-600 hover:bg-gray-700"
                }`}
              >
                {loopStatus.looping ? "On" : "Off"}
              </ButtonContained>
              {loopStatus.looping && (
                <span className="flex items-center text-sm text-green-500">
                  <span className="mr-1 animate-pulse">●</span>
                  Looping
                </span>
              )}
            </div>
          </div>
        )}

        {demos.length === 0 && (
          <div className="py-8 text-center text-text-secondary">
            <p>No recorded demos found.</p>
            <p className="mt-2 text-sm">
              Record some GSI data first to create demo files.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};