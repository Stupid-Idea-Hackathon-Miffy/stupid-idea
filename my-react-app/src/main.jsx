import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import Decor from "./components/Decor.jsx";
import "./styles.css";
import "./theme.css"; // Reel-Love theme: loaded last so it overrides styles.css + backend.css

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Decor />
    <App />
  </React.StrictMode>
);
