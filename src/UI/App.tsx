import { Routes, Route, Navigate, MemoryRouter } from "react-router-dom";
import { Dashboard } from "./pages/Dashboard/Dashboard";
import { MatchesPage } from "./pages/Matches/MatchPage";
import { PlayersPage } from "./pages/Players/PlayersPage";
import { TeamsPage } from "./pages/Teams/TeamsPage";
import { AppProviders } from "./context/AppProviders";
import { Layout } from "./pages/Layout";
import { CoachesPage } from "./pages/Coaches/CoachesPage";
import { HUDPage } from "./pages/HUD/HUDPage";

const AuthenticatedRoutes = () => (
  <AppProviders>
    <MemoryRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<MatchesPage />} />
          <Route path="matches" element={<Navigate to="/" />} />
          <Route path="players" element={<PlayersPage />} />
          <Route path="teams" element={<TeamsPage />} />
          <Route path="coaches" element={<CoachesPage />} />
          <Route path="hud" element={<HUDPage />} />
          <Route path="dashboard" element={<Dashboard />} />
        </Route>
      </Routes>
    </MemoryRouter>
  </AppProviders>
);

export const App = () => {
  return <AuthenticatedRoutes />;
};
