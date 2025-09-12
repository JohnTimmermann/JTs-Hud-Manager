import { ButtonContained, Searchbar } from "../../components";
import { useLocation } from "react-router-dom";
import { usePlayers, useTeams } from "../../hooks";
import { MdOutlineTableRows, MdOutlineRememberMe } from "react-icons/md";

interface TopBarProps {
  header: string;
  buttonText?: string;
  openForm?: (open: boolean) => void;
  layout?: "card" | "table";
  setLayout?: (layout: "card" | "table") => void;
}

export const Topbar = ({
  header,
  buttonText,
  openForm,
  layout,
  setLayout,
}: TopBarProps) => {
  const location = useLocation();
  const { searchPlayers } = usePlayers();
  const { searchTeams } = useTeams();

  switch (location.pathname) {
    case "/players":
      break;

    case "/teams":
      break;

    default:
      break;
  }

  return (
    <div
      id="TopBar"
      className="sticky top-0 z-10 flex h-16 w-full shrink-0 items-center justify-center bg-background-primary px-2"
    >
      <div className="flex w-full items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="noDrag capitalize">{header}</h3>
          {location.pathname === "/players" && (
            <Searchbar dataSearch={searchPlayers} />
          )}
          {location.pathname === "/teams" && (
            <Searchbar dataSearch={searchTeams} />
          )}
        </div>
        <div className="flex items-center justify-center gap-4">
          {location.pathname === "/players" &&
            (layout == "card" ? (
              <MdOutlineTableRows
                onClick={() => setLayout?.("table")}
                className="flex size-12 cursor-pointer items-center justify-center self-end rounded-lg p-2 hover:bg-background-light"
              />
            ) : (
              <MdOutlineRememberMe
                onClick={() => setLayout?.("card")}
                className="flex size-12 cursor-pointer items-center justify-center self-end rounded-lg p-2 hover:bg-background-light"
              />
            ))}
          {openForm && (
            <ButtonContained onClick={() => openForm(true)}>
              Create {buttonText}
            </ButtonContained>
          )}
        </div>
      </div>
    </div>
  );
};
