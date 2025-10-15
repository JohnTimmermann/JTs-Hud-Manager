import { MdDelete, MdEdit } from "react-icons/md";
import { PrimaryButton } from "../../components/PrimaryButton";
import { usePlayers } from "../../hooks";
import { apiUrl } from "../../api/api";
import { PlayerSilhouette } from "./PlayersPage";

interface PlayersTableProps {
  setOpenState: (open: boolean) => void;
}

export const PlayersTable = ({ setOpenState }: PlayersTableProps) => {
  const { filteredPlayers } = usePlayers();
  return (
    <div className="overflow-y-auto relative flex-1 w-full">
      <table className="table-fixed w-full">
        <thead className="sticky top-0 border-b border-border bg-background-secondary shadow">
          <tr>
            <th className="p-4 text-sm" align="left">
              Avatar
            </th>
            <th className="p-4 text-sm" align="center">
              Username
            </th>
            <th className="p-4 text-sm" align="center">
              Name
            </th>
            <th className="p-4 text-sm" align="center">
              Country
            </th>
            <th className="p-4 text-sm" align="center">
              SteamID
            </th>
            <th className="p-4 text-sm" align="center">
              Team
            </th>
            <th className="p-4 text-sm" align="right">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border bg-background-secondary">
          {filteredPlayers.map((player: Player, index) => (
            <PlayerRow key={index} player={player} setOpenState={setOpenState} />
          ))}
        </tbody>
      </table>
    </div>
  );
};

interface PlayerRowProps {
  player: Player;
  setOpenState: (open: boolean) => void;
}

const PlayerRow = ({ player, setOpenState }: PlayerRowProps) => {
  const { deletePlayer, setIsEditing, setSelectedPlayer } = usePlayers();

  const handleEditClick = () => {
    setIsEditing(true);
    setOpenState(true);
    setSelectedPlayer(player);
  };

  return (
    <tr>
      <td className="px-4 py-2" align="left">
        <img
          src={
            player.avatar
            //Browser caches avatars, so we append a timestamp to the URL
              ? `${apiUrl}/players/avatar/${player._id}?t=${new Date().getTime()}`
              : PlayerSilhouette
          }
          alt="Player avatar"
          className="size-20"
        />
      </td>
      <td className="px-4 py-2 font-semibold" align="center">
        {player.username}
      </td>
      <td className="px-4 py-2" align="center">
        {player.firstName + " " + player.lastName}
      </td>
      <td className="px-4 py-2 font-semibold" align="center">
        {player.country}
      </td>
      <td className="px-4 py-2 font-semibold" align="center">
        {player.steamid}
      </td>
      <td className="px-4 py-2 font-semibold" align="center">
        {player?.team && (
          <img
            src={apiUrl + "/teams/logo/" + player.team}
            alt="Team Logo"
            className="size-12"
          />
        )}
      </td>
      <td className="px-4 py-2" align="right">
        <div className="inline-flex">
          <PrimaryButton onClick={() => handleEditClick()}>
            <MdEdit className="size-5" />
          </PrimaryButton>

          <PrimaryButton onClick={() => deletePlayer(player._id)}>
            <MdDelete className="size-5" />
          </PrimaryButton>
        </div>
      </td>
    </tr>
  );
};
