import { Navigate, Route, Routes } from "react-router-dom";
import { Shell } from "./components/Shell";
import { OverviewPage } from "./pages/OverviewPage";
import { LivePage } from "./pages/LivePage";
import { IncidentsPage } from "./pages/IncidentsPage";
import { SearchPage } from "./pages/SearchPage";
import { PatrolsPage } from "./pages/PatrolsPage";
import { AnalyticsPage } from "./pages/AnalyticsPage";
import { DronesPage } from "./pages/DronesPage";
import { RescuePage } from "./pages/RescuePage";
import { PlaybackPage } from "./pages/PlaybackPage";
import { EvidencePage } from "./pages/EvidencePage";
import { SeaPage } from "./pages/SeaPage";

export function App() {
  return (
    <Routes>
      <Route path="/rescue" element={<RescuePage />} />
      <Route element={<Shell />}>
        <Route path="/" element={<Navigate to="/overview" replace />} />
        <Route path="/overview" element={<OverviewPage />} />
        <Route path="/live" element={<LivePage />} />
        <Route path="/incidents" element={<IncidentsPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/patrols" element={<PatrolsPage />} />
        <Route path="/playback" element={<PlaybackPage />} />
        <Route path="/evidence" element={<EvidencePage />} />
        <Route path="/sea" element={<SeaPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/drones" element={<DronesPage />} />
      </Route>
    </Routes>
  );
}
