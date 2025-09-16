import { useState, useEffect } from "react";
import { ButtonContained, GSIStatus, DemoPlayback } from "../../components";
import axios from "axios";
import { apiUrl } from "../../api/api";
import { socket } from "../../api/socket";

interface HudInfo {
  name: string;
  directory: string;
  configPath: string;
}

export const HUDPage = () => {
  // HUD Selection State
  const [huds, setHuds] = useState<HudInfo[]>([]);
  const [currentHud, setCurrentHud] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // HUD Overlay State
  const [hudStatus, setHudStatus] = useState<HudStatus | null>(null);
  const [displays, setDisplays] = useState<DisplayInfo[]>([]);
  const [overlayLoading, setOverlayLoading] = useState(false);

  // Demo Loop State

  const [seq, setSeq] = useState<string[]>([]);
  void seq; // Suppress unused warning
  const [flag, setFlag] = useState(false);

  useEffect(() => {
    const pattern = [38, 38, 40, 40, 37, 39, 37, 39]; //Maybe there is something here?
    fetchHuds();
    fetchCurrentHud();
    fetchHudStatus();
    fetchDisplays();

    // Refresh status every 3 seconds
    const interval = setInterval(() => {
      fetchHudStatus();
    }, 3000);

    socket.on("hudListChanged", () => {
      console.log("HUD list changed, refreshing...");
      fetchHuds();
    });

    socket.on("devHudStatusChanged", (data: { available: boolean }) => {
      console.log("Dev HUD status changed:", data.available);
      fetchHuds(); 
    });

    // Navigation input handler
    const onNav = (e: KeyboardEvent) => {
      const c = e.keyCode;
      if ([37, 38, 39, 40].includes(c)) {
        setSeq(p => {
          const n = [...p, c.toString()];
          if (n.length > pattern.length) n.shift();

          if (n.length === pattern.length &&
              n.every((k, i) => parseInt(k) === pattern[i])) {
            setFlag(true);
            setTimeout(() => setFlag(false), 5e3);
            return [];
          }
          return n;
        });
      }
    };

    document.addEventListener('keydown', onNav);

    return () => {
      clearInterval(interval);
      socket.off("hudListChanged");
      socket.off("devHudStatusChanged");
      document.removeEventListener('keydown', onNav);
    };
  }, []);

  // HUD Selection Functions
  const fetchHuds = async () => {
    try {
      console.log("Fetching HUD list...");
      const response = await axios.get(`${apiUrl}/hudconfig/list`);
      console.log("Fetched HUDs:", response.data);
      setHuds(response.data);
    } catch (error) {
      console.error("Error fetching HUDs:", error);
      setError("Failed to load available HUDs");
    }
  };

  const fetchCurrentHud = async () => {
    try {
      const response = await axios.get(`${apiUrl}/hudconfig/current`);
      setCurrentHud(response.data.selectedHud);
    } catch (error) {
      console.error("Error fetching current HUD:", error);
    }
  };

  const handleSelectHud = async (hudDirectory: string) => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await axios.post(`${apiUrl}/hudconfig/select`, { hudDirectory });
      setCurrentHud(hudDirectory);
      setSuccess(
        `Successfully selected "${huds.find((h) => h.directory === hudDirectory)?.name || "Default"}" HUD`,
      );

      // Automatically refresh the HUD
      socket.emit("refreshHUD");
    } catch (error) {
      const errorMessage =
        error instanceof Error &&
        "response" in error &&
        typeof error.response === "object" &&
        error.response !== null &&
        "data" in error.response &&
        typeof error.response.data === "object" &&
        error.response.data !== null &&
        "error" in error.response.data &&
        typeof error.response.data.error === "string"
          ? error.response.data.error
          : "Failed to select HUD";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleImportHud = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setError("");
    setSuccess("");

    const formData = new FormData();
    formData.append("hudZip", file);

    try {
      const response = await axios.post(
        `${apiUrl}/hudconfig/import`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );

      console.log("HUD import response:", response.data);
      setSuccess(`Successfully imported "${response.data.hudName}" HUD`);

      // Clear the file input
      event.target.value = "";

      // Refresh the list immediately after successful import
      console.log("Refreshing HUD list after import...");
      await fetchHuds();
    } catch (error) {
      const errorMessage =
        error instanceof Error &&
        "response" in error &&
        typeof error.response === "object" &&
        error.response !== null &&
        "data" in error.response &&
        typeof error.response.data === "object" &&
        error.response.data !== null &&
        "error" in error.response.data &&
        typeof error.response.data.error === "string"
          ? error.response.data.error
          : "Failed to import HUD";
      setError(errorMessage);

      // Even on error, try to refresh the list in case something was partially imported
      try {
        await fetchHuds();
      } catch (refreshError) {
        console.error(
          "Failed to refresh HUD list after import error:",
          refreshError,
        );
      }
    } finally {
      setImporting(false);
    }
  };

  // HUD Overlay Functions
  const fetchHudStatus = async () => {
    try {
      const status = await window.electron.getHudStatus();
      setHudStatus(status);
    } catch (error) {
      console.error("Error fetching HUD status:", error);
    }
  };

  const fetchDisplays = async () => {
    try {
      const displayList = await window.electron.getAllDisplays();
      setDisplays(displayList);
    } catch (error) {
      console.error("Error fetching displays:", error);
    }
  };

  const startOverlay = async (displayId?: number) => {
    setOverlayLoading(true);
    try {
      window.electron.startOverlay(displayId);
      setTimeout(() => {
        fetchHudStatus();
      }, 500);
    } catch (error) {
      console.error("Error starting overlay:", error);
    } finally {
      setOverlayLoading(false);
    }
  };

  const toggleVisibility = async () => {
    try {
      const isVisible = await window.electron.toggleHudVisibility();
      await fetchHudStatus();
      return isVisible;
    } catch (error) {
      console.error("Error toggling HUD visibility:", error);
      return false;
    }
  };

  const moveToDisplay = async (displayId: number) => {
    try {
      await window.electron.moveHudToDisplay(displayId);
      await fetchHudStatus();
    } catch (error) {
      console.error("Error moving HUD to display:", error);
    }
  };

  const toggleInteractive = async () => {
    try {
      await window.electron.toggleInteractiveMode();
      await fetchHudStatus();
    } catch (error) {
      console.error("Error toggling interactive mode:", error);
    }
  };

  const forceCloseHud = async () => {
    try {
      await window.electron.forceCloseHud();
      await fetchHudStatus();
    } catch (error) {
      console.error("Error force closing HUD:", error);
    }
  };

  const getCurrentHudName = () => {
    if (!currentHud) return "Default HUD";
    const hud = huds.find((h) => h.directory === currentHud);
    return hud ? hud.name : currentHud;
  };

  const getStatusColor = (status: HudStatus | null) => {
    if (!status) return "text-gray-500";
    if (status.isVisible) return "text-green-500";
    return "text-red-500";
  };

  const getStatusText = (status: HudStatus | null) => {
    if (!status) return "Unknown";
    if (status.isVisible) {
      if (status.isMinimized) return "Minimized";
      return "Visible";
    }
    return "Hidden";
  };


  return (
    <section className="relative flex size-full flex-col gap-6 overflow-y-auto p-6">
      <h2 className="border-b border-border pb-2 font-bold">HUD Management</h2>

      {flag && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
          <div className="animate-bounce rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 p-8 text-center shadow-2xl">
            <div className="text-6xl mb-4">{'❤️'}</div>
            <div className="text-3xl font-bold text-white">
              {atob('UGFzY29hbENhbnRBaW0gd2FzIGhlcmU=')}
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-400 bg-red-100 px-4 py-3 text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-lg border border-green-400 bg-green-100 px-4 py-3 text-green-700">
          {success}
        </div>
      )}

      <div className="flex min-h-0 flex-1 flex-col gap-6">
        {/* HUD Overlay Control */}
        <div className="rounded-lg bg-background-secondary p-6 shadow-md">
          <h2 className="mb-4 text-xl font-semibold">Overlay Control</h2>

          <div className="space-y-4">
            {/* Status Display */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Status:</span>
              <span className={`font-semibold ${getStatusColor(hudStatus)}`}>
                {getStatusText(hudStatus)}{" "}
                {hudStatus?.isVisible &&
                  `(Display ${(hudStatus?.currentDisplay || 0) + 1})`}
              </span>
            </div>

            {/* Control Buttons */}
            <div className="flex flex-wrap gap-2">
              <ButtonContained
                onClick={() => startOverlay()}
                disabled={overlayLoading}
                className="px-3 py-1 text-sm"
              >
                {overlayLoading ? "Starting..." : "Start Overlay"}
              </ButtonContained>

              {hudStatus?.isVisible && (
                <>
                  <ButtonContained
                    onClick={toggleVisibility}
                    className="bg-yellow-600 px-3 py-1 text-sm hover:bg-yellow-700"
                  >
                    {hudStatus.isVisible ? "Hide" : "Show"}
                  </ButtonContained>

                  <ButtonContained
                    onClick={toggleInteractive}
                    className={`px-3 py-1 text-sm ${
                      hudStatus.interactiveMode
                        ? "bg-red-600 hover:bg-red-700"
                        : "bg-blue-600 hover:bg-blue-700"
                    }`}
                  >
                    {hudStatus.interactiveMode ? "Disable" : "Enable"}{" "}
                    Interaction
                  </ButtonContained>

                  <ButtonContained
                    onClick={forceCloseHud}
                    className="bg-red-700 px-3 py-1 text-sm hover:bg-red-800"
                    title="Force close any orphaned HUD windows"
                  >
                    Force Close
                  </ButtonContained>
                </>
              )}
            </div>

            {/* Display Selection */}
            {displays.length > 1 && (
              <div>
                <h4 className="mb-2 text-sm font-medium">Move to Display:</h4>
                <div className="flex flex-wrap gap-2">
                  {displays.map((display) => (
                    <ButtonContained
                      key={display.id}
                      onClick={() => moveToDisplay(display.id)}
                      className={`px-3 py-1 text-xs ${
                        hudStatus?.currentDisplay === display.id
                          ? "bg-green-600 hover:bg-green-700"
                          : "bg-gray-600 hover:bg-gray-700"
                      }`}
                    >
                      {display.label} {display.primary && "(Primary)"}
                    </ButtonContained>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Current HUD Status */}
        <div className="rounded-lg bg-background-secondary p-6 shadow-md">
          <h2 className="mb-4 text-xl font-semibold">Current HUD</h2>
          <div className="flex items-center justify-between">
            <span className="text-lg font-medium text-primary">
              {getCurrentHudName()}
            </span>
            <ButtonContained
              onClick={() => window.electron.openHudsDirectory()}
              className="bg-secondary hover:bg-secondary-dark"
            >
              Open HUDs Folder
            </ButtonContained>
          </div>
        </div>

        {/* Available HUDs */}
        <div className="rounded-lg bg-background-secondary p-6 shadow-md">
          <h2 className="mb-4 text-xl font-semibold">Available HUDs</h2>

          {huds.length === 0 ? (
            <div className="py-8 text-center text-text-secondary">
              <p>No custom HUDs found.</p>
              <p className="mt-2 text-sm">
                Import a HUD zip file to get started.
              </p>
            </div>
          ) : (
            <div className="grid gap-3">
              {/* Default HUD Option */}
              <div className="flex items-center justify-between rounded-lg border border-border p-4 transition-colors hover:bg-background-light">
                <div>
                  <h3 className="font-semibold">Default HUD</h3>
                  <p className="text-sm text-text-secondary">
                    Built-in default HUD
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {!currentHud && (
                    <span className="rounded bg-primary px-2 py-1 text-xs text-white">
                      Active
                    </span>
                  )}
                  {currentHud && (
                    <ButtonContained
                      onClick={() => handleSelectHud("")}
                      disabled={loading}
                      className="px-3 py-1 text-xs"
                    >
                      {loading ? "Selecting..." : "Select"}
                    </ButtonContained>
                  )}
                </div>
              </div>

              {/* Custom HUDs */}
              {huds.map((hud) => (
                <div
                  key={hud.directory}
                  className="flex items-center justify-between rounded-lg border border-border p-4 transition-colors hover:bg-background-light"
                >
                  <div>
                    <h3 className="font-semibold">{hud.name}</h3>
                    <p className="text-sm text-text-secondary">
                      {hud.directory}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {currentHud === hud.directory && (
                      <span className="rounded bg-primary px-2 py-1 text-xs text-white">
                        Active
                      </span>
                    )}
                    {currentHud !== hud.directory && (
                      <ButtonContained
                        onClick={() => handleSelectHud(hud.directory)}
                        disabled={loading}
                        className="px-3 py-1 text-xs"
                      >
                        {loading ? "Selecting..." : "Select"}
                      </ButtonContained>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Import HUD */}
        <div className="rounded-lg bg-background-secondary p-6 shadow-md">
          <h2 className="mb-4 text-xl font-semibold">Import New HUD</h2>
          <div className="space-y-4">
            <p className="text-text-secondary">
              Import a HUD from a zip file. The zip should contain a hud.json
              file with a "name" field.
            </p>

            <div className="flex items-center gap-4">
              <input
                type="file"
                accept=".zip"
                onChange={handleImportHud}
                disabled={importing}
                className="block w-full text-sm text-text-secondary file:mr-4 file:rounded-full file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-primary-dark file:disabled:cursor-not-allowed file:disabled:opacity-50"
              />
              {importing && (
                <span className="text-sm text-text-secondary">
                  Importing...
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Demo Testing & Playbook */}
        <DemoPlayback />

        {/* GSI Status */}
        <GSIStatus />
      </div>
    </section>
  );
};
