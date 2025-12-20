import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@repo/ui/globals.css";
import "./index.css";
import App from "./App.tsx";
import { SWRConfig } from "swr";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <SWRConfig value={{ revalidateOnFocus: false, dedupingInterval: 500 }}>
      <App />
    </SWRConfig>
  </StrictMode>,
);
