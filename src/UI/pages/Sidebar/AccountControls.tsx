import { useState } from "react";
import { MdSettings, MdDarkMode, MdLightMode } from "react-icons/md";
import { Dialog } from "../../components";
import { useThemes } from "../../hooks/useThemes";
import { Settings } from "../Settings";
import { useDrawer } from "../../hooks";

export const AccountToggle = () => {
  const [open, setOpen] = useState(false);
  const { theme, toggleTheme } = useThemes();
  const { isOpen } = useDrawer();

  return (
    <>
      <Dialog open={open} onClose={() => setOpen(false)}>
        <Settings/>
      </Dialog>
      <div className="relative flex flex-col gap-2 pb-5 text-text-secondary">
        <button
          className="relative flex items-center rounded-lg py-2 pl-4 hover:bg-border"
          onClick={toggleTheme}
        >
          {theme === "dark" ? (
            <MdDarkMode className="size-7 shrink-0" />
          ) : (
            <MdLightMode className="size-7 shrink-0" />
          )}
          {isOpen && <p className="pl-2 font-semibold">Theme</p>}
        </button>
        <button
          onClick={() => setOpen(true)}
          className="relative flex items-center rounded-lg py-2 pl-4 hover:bg-border"
        >
          <MdSettings className="size-7 shrink-0" />
          {isOpen && <p className="pl-2 font-semibold">Settings</p>}
        </button>
      </div>
    </>
  );
};
