import { MdDelete, MdEdit } from "react-icons/md";
import { useTeams } from "./useTeams";
import { PrimaryButton } from "../../components/PrimaryButton";
import { apiUrl } from "../../api/api";

interface TeamsTableProps {
  setOpenState: (open: boolean) => void;
}

export const TeamsTable = ({ setOpenState }: TeamsTableProps) => {
  const { filteredTeams} = useTeams();
  return (
    <div className="overflow-y-auto relative flex-1 w-full">
      <table className="table-fixed w-full">
        <thead className="sticky top-0 border-b border-border bg-background-secondary shadow">
          <tr>
            <th className="p-4 text-sm" align="left">
              Logo
            </th>
            <th className="p-4 text-sm" align="center">
              Name
            </th>
            <th className="p-4 text-sm" align="center">
              Short Name
            </th>
            <th className="p-4 text-sm" align="center">
              Country
            </th>
            <th className="p-4 text-sm" align="right">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border bg-background-secondary">
          {filteredTeams.map((team: Team, index) => (
            <TeamRow
              key={index}
              team={team}
              setOpenState={setOpenState}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};

interface TeamRowProps {
  team: Team;
  setOpenState: (open: boolean) => void;
}

const TeamRow = ({ team, setOpenState }: TeamRowProps) => {
  const { setIsEditing, setSelectedTeam, deleteTeam } = useTeams();

  const handleEditClick = () => {
    setIsEditing(true);
    setOpenState(true);
    setSelectedTeam(team);
  };

  return (
    <tr id={"team_" + team._id}>
      <td className="px-4 py-2" align="left">
        <img
          src={`${apiUrl}/teams/logo/${team._id}?t=${new Date().getTime()}`}
          alt="Team Logo"
          className="size-12"
        />
      </td>
      <td className="px-4 py-2 text-lg font-semibold" align="center">
        {team.name}
      </td>
      <td className="px-4 py-2" align="center">
        {team.shortName}
      </td>
      <td className="px-4 py-2 font-semibold" align="center">
        {team.country}
      </td>
      <td className="px-4 py-2" align="right">
        <div className="inline-flex">
          <PrimaryButton onClick={() => handleEditClick()}>
            <MdEdit className="size-5" />
          </PrimaryButton>

          <PrimaryButton onClick={() => deleteTeam(team._id)}>
            <MdDelete className="size-5" />
          </PrimaryButton>
        </div>
      </td>
    </tr>
  );
};
