import { useState } from "react";
import { ButtonContained } from "./ButtonContained";
import axios from "axios";
import { apiUrl } from "../api/api";

export const RecordGSIButton = ({
  onRecorded,
}: {
  onRecorded?: () => void;
}) => {
  const [recording, setRecording] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleRecord = async () => {
    setRecording(true);
    setError("");
    try {
      await axios.post(`${apiUrl}/gsi/record/start`);
    } catch {
      setError("Failed to start recording");
      setRecording(false);
    }
  };

  const handleStop = async () => {
    setSaving(true);
    setError("");
    try {
      await axios.post(`${apiUrl}/gsi/record/stop`);
      setRecording(false);
      setSaving(false);
      if (onRecorded) onRecorded();
    } catch {
      setError("Failed to save recording");
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <ButtonContained
        onClick={recording ? handleStop : handleRecord}
        disabled={saving}
        className={`px-3 py-1 text-sm ${recording ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}`}
      >
        {saving
          ? "Saving..."
          : recording
            ? "Stop & Save Recording"
            : "Record GSI Data"}
      </ButtonContained>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
};
