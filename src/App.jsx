import "./App.css";
import { SettingsProvider } from "./contexts/SettingsContext";
import AppContent from "./components/AppContent";

export default function App() {
  return (
    <SettingsProvider>
      <AppContent />
    </SettingsProvider>
  );
}
