import React from "react";
import { createRoot } from "react-dom/client";
import MiniWordCountdownGame from "./MiniWordCountdownGame.jsx";
import "./styles.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <MiniWordCountdownGame />
  </React.StrictMode>
);
