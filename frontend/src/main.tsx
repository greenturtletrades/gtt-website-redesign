
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initialiseAnalyticsGuard } from "./analytics/google-analytics";

initialiseAnalyticsGuard();
createRoot(document.getElementById("root")!).render(<App />);
