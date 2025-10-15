import { useState } from "react";
import { Container } from "../../components";
import { useGameData } from "../../context/useGameData";
import { Topbar } from "../MainPanel/Topbar";
import { PlayersTile } from "./PlayersTile";

export const Dashboard = () => {
  const { gameData } = useGameData();
  const [copyStatus, setCopyStatus] = useState<boolean | null>(null);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        setCopyStatus(true);
        setTimeout(() => setCopyStatus(null), 2000);
      },
      (err) => {
        console.error("Failed to copy to clipboard:", err);
        setCopyStatus(false);
        setTimeout(() => setCopyStatus(null), 2000);
      }
    );
  };

  // no-op: players list built on render from gameData when needed

  return (
    <div className="relative flex size-full flex-col gap-4">
      <Topbar header="Dashboard" />
      <Container>
        {gameData ? (
          <div className="flex gap-2">
            <PlayersTile playersFromGame={gameData.players} copyToClipboard={copyToClipboard} />
          </div>
        ) : (
          <h3>Not connected in a spectator slot/demo</h3>
        )}
        {copyStatus && (
          <div className={`p-4 fixed top-8 left-1/2 -translate-x-1/2 z-50 ${copyStatus ? "bg-green-900 text-green-500 border-green-500" : "bg-red-900 text-red-500 border-red-500"} rounded-lg`}>
            {copyStatus ? "Copied successfully!" : "Failed to copy!"}
          </div>
        )}
      </Container>
    </div>
  );
};
