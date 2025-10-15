import { useEffect, useState } from "react";
import {
  ButtonContained,
  Container,
  TextInput,
  Dialog,
} from "../../components";
import { countries } from "../../api/countries";
import { useTeams } from "./useTeams";
import { apiUrl } from "../../api/api";

interface TeamsFormProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export const TeamsForm = ({ open, setOpen }: TeamsFormProps) => {
  const {
    createTeam,
    updateTeam,
    isEditing,
    setIsEditing,
    selectedTeam,
    setSelectedTeam,
  } = useTeams();

  const [teamName, setTeamName] = useState("");
  const [shortName, setShortName] = useState("");
  const [country, setCountry] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logo, setLogo] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [teamNameError, setTeamNameError] = useState("");
  const [logoError, setLogoError] = useState("");


  useEffect(() => {
    if (isEditing && selectedTeam) {
      setTeamName(selectedTeam.name || "");
      setShortName(selectedTeam.shortName || "");
      setCountry(selectedTeam.country || "");
      setLogo(selectedTeam.logo || "");
    } else {
      handleReset();
    }
  }, [isEditing, selectedTeam]);

  const validateForm = () => {
    let isValid = true;
    setTeamNameError("");

    if (!teamName) {
      setTeamNameError("Team name is required");
      isValid = false;
    }
    return isValid;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);

    const formData = new FormData();
    if (isEditing && selectedTeam) {
      formData.append("_id", selectedTeam._id);
    }
    formData.append("name", teamName);
    formData.append("shortName", shortName);
    formData.append("country", country);
    if (logoFile) {
      formData.append("logo", logoFile);
    } else if (selectedTeam?.logo) {
      formData.append("logo", logo);
    }

    try {
      if (isEditing && selectedTeam) {
        await updateTeam(selectedTeam._id, formData);
      } else if (createTeam) {
        await createTeam(formData);
      }
    } catch (error) {
      console.error("Error submitting team:", error);
    } finally {
      setIsSubmitting(false);
      setOpen(false);
      handleReset();
    }
  };

  const handleCancel = () => {
    handleReset();
    setOpen(false);
  };
  const handleReset = () => {
    setIsEditing(false);
    setSelectedTeam(null);
    setTeamName("");
    setShortName("");
    setCountry("");
    setLogoFile(null);
    setLogo("");
    setTeamNameError("");
    setLogoError("");
  };

  return (
    <Dialog onClose={handleCancel} open={open}>
      <div className="flex flex-1 border-b border-border">
        <h3 className="px-6 py-4 font-semibold">
          {isEditing ? `Updating: ${teamName}` : "Create Team"}
        </h3>
      </div>
      <Container>
        <div className="my-2 flex w-full flex-col gap-3">
          <TextInput
            label={"Team Name"}
            value={teamName}
            required
            onChange={(e) => setTeamName(e.target.value)}
            error={!!teamNameError} // Set error state based on teamNameError
            errorMessage={teamNameError} // Show error message below field
          />
          <TextInput
            label="Short Name"
            value={shortName}
            onChange={(e) => setShortName(e.target.value)}
          />
          <form className="mb-4">
            <label className="mb-2 block font-medium text-text">Country</label>
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
            >
              <option value="">Country</option>
              {Object.entries(countries).map(([key, value]) => (
                <option key={key} value={key}>
                  {value as string}
                </option>
              ))}
            </select>
          </form>
          <div className="flex flex-col items-center gap-4">
            {/* Show current avatar if editing and player has one */}
            {isEditing && selectedTeam?.logo && (
              <img
                src={apiUrl + "/teams/logo/" + selectedTeam._id}
                alt="Current Logo"
                className="size-36 rounded border object-cover"
              />
            )}
            <input
              type="file"
              id="logo"
              accept="image/*"
              onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => document.getElementById("logo")?.click()}
              className="rounded bg-primary px-4 py-2 text-white transition-colors hover:bg-primary-dark"
            >
              Upload Logo
            </button>
            {logoFile && (
              <span className="text-sm text-text-secondary">{logoFile.name}</span>
            )}
            {logoError && (
              <p className="pt-2 text-sm text-red-500">{logoError}</p>
            )}
          </div>
        </div>
      </Container>
      <div className="flex w-full justify-end gap-2 border-t border-border p-2">
        <div className="mt-1 flex justify-end gap-1">
          {isSubmitting ? (
            <ButtonContained disabled>Submitting...</ButtonContained>
          ) : (
            <ButtonContained onClick={handleSubmit}>Submit</ButtonContained>
          )}
          <ButtonContained onClick={handleReset}>Reset</ButtonContained>
          {isEditing && (
            <ButtonContained color="secondary" onClick={handleCancel}>
              Cancel
            </ButtonContained>
          )}
        </div>
      </div>
    </Dialog>
  );
};
