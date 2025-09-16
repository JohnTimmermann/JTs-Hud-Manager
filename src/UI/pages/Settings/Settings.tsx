import { useEffect, useState } from "react";
import { ButtonContained } from "../../components";
import axios from "axios";
import { apiUrl } from "../../api/api";

interface SettingsProps {
  onClose: () => void;
}

export const Settings = ({ onClose }: SettingsProps) => {
  const [autoSwitch, setAutoSwitch] = useState(true);
  const [layout, setLayout] = useState("vertical");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    getSettings();
  }, []);

  const getSettings = async () => {
    try {
      const response = await axios.get(`${apiUrl}/settings`);
      if (response.data) {
        setAutoSwitch(response.data.autoSwitch);
        setLayout(response.data.layout);
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    }
  };

  const saveSettings = async () => {
    setIsSubmitting(true);
    try {
      await axios.put(`${apiUrl}/settings`, { autoSwitch, layout });
      setIsSubmitting(false);
    } catch (error) {
      setErrorMessage("Error saving settings: " + error);
      setIsSubmitting(false);
    }
    setIsSubmitting(false);
    onClose();
  };

  const handleToggle = () => {
    setAutoSwitch(!autoSwitch);
  };

  return (
    <div className="flex flex-col gap-6 overflow-y-auto">
      <h2 className="border-b border-border pb-2 font-bold">Settings</h2>
      <div className="container flex flex-col gap-6 overflow-y-auto">
        <div className="rounded-lg bg-background-secondary p-6 shadow-md">
          <h2 className="mb-4 text-xl font-semibold">HUDs Directory</h2>
          <ButtonContained onClick={() => window.electron.openHudsDirectory()}>
            Open Directory
          </ButtonContained>
        </div>

        <div className="rounded-lg bg-background-secondary p-6 shadow-md">
          <h2 className="mb-4 text-xl font-semibold">
            Select Language (Coming Soon)
          </h2>
          <select className="w-full rounded-lg border border-gray-300 p-2">
            <option value="en">English</option>
            <option disabled value="es">
              Spanish
            </option>
            <option disabled value="fr">
              French
            </option>
            <option disabled value="de">
              German
            </option>
          </select>
        </div>

        <div className="rounded-lg bg-background-secondary p-6 shadow-md">
          <h2 className="mb-4 text-xl font-semibold">
            Auto-switch Sides (Coming Soon)
          </h2>
          <div className="flex items-center text-text-disabled">
            <label className="switch">
              <input
                type="checkbox"
                className="bg-text-disabled"
                disabled
                checked={autoSwitch}
                onChange={handleToggle}
              />
              <span className="slider round"></span>
            </label>
            <span className="ml-2">{autoSwitch ? "On" : "Off"}</span>
          </div>
        </div>

      </div>

      <div className="inline-flex w-full justify-end gap-2 border-t border-border p-2">
        {errorMessage && (
          <p className="my-1 text-end text-red-500">{errorMessage}</p>
        )}
        <div className="mt-1 flex justify-end gap-1">
          {isSubmitting ? (
            <ButtonContained disabled>Saving...</ButtonContained>
          ) : (
            <ButtonContained onClick={() => saveSettings()}>
              Save
            </ButtonContained>
          )}
          <ButtonContained color="secondary" onClick={onClose}>
            Cancel
          </ButtonContained>
        </div>
      </div>
    </div>
  );
};

export default Settings;
