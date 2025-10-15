import { useState } from "react";
import PlayerSilhouette from "../../assets/player_silhouette.webp";
import { PlayerForm } from "./PlayersForm";
import { Topbar } from "../MainPanel/Topbar";
import { PlayersTable } from "./PlayersTable";

export const PlayersPage = () => {
  const [open, setOpen] = useState(false);
  return (
    <section className="relative flex size-full flex-col gap-1">
      <Topbar header="Players" buttonText="Player" openForm={setOpen} />
      <PlayersTable setOpenState={setOpen} />
      <PlayerForm open={open} setOpen={setOpen} />
    </section>
  );
};

export { PlayerSilhouette };
