import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

console.log('index.tsx loading...');
console.log('DOM element app:', document.getElementById("app"));

createRoot(document.getElementById("app") as HTMLElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

console.log('React app rendered');
