import "./App.css";
import { SettingsProvider } from "./contexts/SettingsContext";
import MainLayout from "./components/layout/MainLayout";

export default function App() {
  return (
    <SettingsProvider>
      <MainLayout />
    </SettingsProvider>
  );
}
