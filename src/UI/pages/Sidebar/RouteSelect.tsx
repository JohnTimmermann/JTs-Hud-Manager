import { NavLink } from "react-router-dom";
import { IconType } from "react-icons";
import {
  MdOutlinePerson,
  MdGroups,
  MdDashboard,
  MdAddCircle,
  MdDesktopWindows,
  MdPlayArrow,
} from "react-icons/md";
import { useDrawer } from "../../hooks";

interface RouteProps {
  Icon: IconType;
  title: string;
  to: string;
  target?: string;
}

const routes: RouteProps[] = [
  /* Matches redirect to home (/) */
  { Icon: MdAddCircle, title: "Matches", to: "" },
  { Icon: MdOutlinePerson, title: "Players", to: "players" },
  { Icon: MdGroups, title: "Teams", to: "teams" },
  { Icon: MdDashboard, title: "Dashboard", to: "dashboard" },
  { Icon: MdDesktopWindows, title: "HUD Overlay", to: "hud" },
];

export const RouteSelect = () => {
  const { isOpen } = useDrawer();
  return (
    <div className="relative size-full overflow-y-auto">
      <div className="relative flex flex-col items-center justify-between gap-4 py-5">
        {routes.map((route, index) => (
          <NavRoutes key={index} {...route} />
        ))}
        <div className="flex size-full w-full border-t border-border pt-4 text-text">
          <button
            className="relative flex h-7 w-full items-center gap-1 rounded-lg bg-primary py-5 hover:bg-primary-dark"
            onClick={() => window.electron.startOverlay()}
          >
            <MdPlayArrow className="absolute left-3.5 size-7" />
            {isOpen && <p className="pl-14 font-semibold">Start Overlay</p>}
          </button>
        </div>
      </div>
    </div>
  );
};

const NavRoutes = ({ Icon, title, target, to }: RouteProps) => {
  const { isOpen } = useDrawer();
  return (
    <NavLink
      to={to}
      target={target}
      className={({ isActive }) =>
        `flex w-full items-center gap-4 rounded-lg py-2 pl-3.5 ${isActive ? "bg-background-light text-text shadow" : "text-text-secondary shadow-none hover:bg-background-light"}`
      }
    >
      {({ isActive }) => (
        <div className="flex h-7 items-center">
          <Icon
            className={`size-7 ${isActive ? "text-primary-light" : "text-text-disabled"} absolute`}
          />
          {isOpen && (
            <p
              className={`font-semibold ${isActive ? "" : "text-text-disabled"} pl-10`}
            >
              {title}
            </p>
          )}
        </div>
      )}
    </NavLink>
  );
};
