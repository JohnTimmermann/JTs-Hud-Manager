import { useState, useEffect } from "react";
import { Container, ButtonContained } from "../../components";
import { MdPlayArrow, MdStop, MdVisibility, MdVisibilityOff } from "react-icons/md";

export const HUDPage = () => {
  const [hudStatus, setHudStatus] = useState<'closed' | 'visible' | 'hidden' | 'minimized'>('closed');
  const [displays, setDisplays] = useState<DisplayInfo[]>([]);
  const [selectedDisplay, setSelectedDisplay] = useState<number>(0);

  useEffect(() => {
    // Get available displays from Electron
    const loadDisplays = async () => {
      try {
        const availableDisplays = await window.electron.getDisplays();
        setDisplays(availableDisplays);
      } catch (error) {
        console.error('Failed to load displays:', error);
        // Fallback to mock data if IPC fails
        const mockDisplays: DisplayInfo[] = [
          { id: 0, label: "Primary Display (1920x1080)", bounds: { x: 0, y: 0, width: 1920, height: 1080 }, primary: true },
        ];
        setDisplays(mockDisplays);
      }
    };
    
    loadDisplays();
  }, []);

  useEffect(() => {
    // Check HUD status periodically and sync with UI
    const checkHudStatus = async () => {
      try {
        const status = await window.electron.getHudStatus();
        setHudStatus(status as 'closed' | 'visible' | 'hidden' | 'minimized');
      } catch (error) {
        console.error('Failed to get HUD status:', error);
      }
    };

    // Check status immediately
    checkHudStatus();

    // Then check every 2 seconds
    const interval = setInterval(checkHudStatus, 2000);

    return () => clearInterval(interval);
  }, []);

  const startHUD = () => {
    window.electron.startOverlay();
  };

  const closeHUD = () => {
    window.electron.closeOverlay();
  };

  const toggleHUD = () => {
    window.electron.toggleOverlay();
  };

  const moveToDisplay = (displayId: number) => {
    window.electron.moveHudToDisplay(displayId);
    setSelectedDisplay(displayId);
  };

  return (
    <section className="relative flex size-full flex-col gap-1">
      <div className="sticky top-0 z-10 flex h-16 w-full shrink-0 items-center justify-center bg-background-primary px-2">
        <div className="flex w-full items-center justify-between">
          <h3 className="noDrag capitalize">HUD Overlay Controls</h3>
        </div>
      </div>
      <Container>
        <div className="flex flex-col gap-6 p-6">
        
        {/* HUD Status */}
        <div className="rounded-lg bg-background-secondary p-4">
          <h3 className="mb-3 text-lg font-semibold text-text">HUD Status</h3>
          <div className="flex items-center gap-3">
            <div className={`h-3 w-3 rounded-full ${
              hudStatus === 'visible' ? 'bg-green-500' : 
              hudStatus === 'hidden' ? 'bg-yellow-500' : 
              hudStatus === 'minimized' ? 'bg-blue-500' : 
              'bg-gray-500'
            }`} />
            <span className="text-text-secondary">
              {hudStatus === 'visible' ? 'Visible & Active' :
               hudStatus === 'hidden' ? 'Hidden' :
               hudStatus === 'minimized' ? 'Minimized' :
               'Not Running'}
            </span>
          </div>
        </div>

        {/* HUD Controls */}
        <div className="rounded-lg bg-background-secondary p-4">
          <h3 className="mb-4 text-lg font-semibold text-text">Controls</h3>
          <div className="flex flex-wrap gap-3">
            
            <ButtonContained
              onClick={startHUD}
              disabled={hudStatus === 'visible'}
              className="flex items-center gap-2"
            >
              <MdPlayArrow className="size-5" />
              Start HUD
            </ButtonContained>

            <ButtonContained
              onClick={toggleHUD}
              disabled={hudStatus === 'closed'}
              className="flex items-center gap-2"
            >
              {hudStatus === 'visible' ? (
                <>
                  <MdVisibilityOff className="size-5" />
                  Hide HUD
                </>
              ) : (
                <>
                  <MdVisibility className="size-5" />
                  Show HUD
                </>
              )}
            </ButtonContained>

            <ButtonContained
              onClick={closeHUD}
              disabled={hudStatus === 'closed'}
              className="flex items-center gap-2"
            >
              <MdStop className="size-5" />
              Close HUD
            </ButtonContained>

          </div>
        </div>

        {/* Display Selection */}
        <div className="rounded-lg bg-background-secondary p-4">
          <h3 className="mb-4 text-lg font-semibold text-text">Display Selection</h3>
          <div className="flex flex-col gap-3">
            <p className="text-sm text-text-secondary">
              Choose which display to show the HUD overlay on:
            </p>
            
            <select 
              value={selectedDisplay} 
              onChange={(e) => setSelectedDisplay(Number(e.target.value))}
              className="rounded-lg border border-border bg-background-primary p-2 text-text"
            >
              {displays.map((display) => (
                <option key={display.id} value={display.id}>
                  {display.label}
                </option>
              ))}
            </select>

            <ButtonContained
              onClick={() => moveToDisplay(selectedDisplay)}
              disabled={hudStatus === 'closed'}
              className="w-fit"
            >
              Move HUD to Selected Display
            </ButtonContained>
          </div>
        </div>

        {/* Keyboard Shortcuts Info */}
        <div className="rounded-lg bg-background-secondary p-4">
          <h3 className="mb-4 text-lg font-semibold text-text">Global Keyboard Shortcuts</h3>
          <div className="grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
            <div className="flex justify-between">
              <span className="text-text-secondary">Focus HUD (Make Interactive):</span>
              <span className="font-mono text-text">Ctrl+Alt+H</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Close HUD:</span>
              <span className="font-mono text-text">Ctrl+Alt+C</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Toggle HUD Visibility:</span>
              <span className="font-mono text-text">Ctrl+Alt+X</span>
            </div>
          </div>
          <div className="mt-4 rounded-lg bg-background-light p-3">
            <h4 className="mb-2 text-sm font-semibold text-text">When HUD is Interactive:</h4>
            <div className="grid grid-cols-1 gap-1 text-xs md:grid-cols-2">
              <div className="flex justify-between">
                <span className="text-text-secondary">Exit Interactive Mode:</span>
                <span className="font-mono text-text">Escape</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Close HUD:</span>
                <span className="font-mono text-text">Ctrl+Shift+C</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tips */}
        <div className="rounded-lg bg-background-light p-4">
          <h3 className="mb-2 text-lg font-semibold text-text">Tips</h3>
          <ul className="space-y-1 text-sm text-text-secondary">
            <li>• The HUD overlay appears fullscreen and stays on top of all applications</li>
            <li>• Use Ctrl+Alt+H to make the HUD interactive (allows mouse input)</li>
            <li>• In interactive mode, you can move and control the HUD window</li>
            <li>• Press Escape to return to click-through mode</li>
            <li>• Global shortcuts work from any application, even when HUD is click-through</li>
          </ul>
        </div>

        </div>
      </Container>
    </section>
  );
};