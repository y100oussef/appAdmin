
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// For non-module environments, use a self-executing function
;(function() {
  const rootElement = document.getElementById("root");

  if (!rootElement) {
    console.error("Failed to find the root element. Make sure there is a <div id='root'></div> in your index.html");
  } else {
    createRoot(rootElement).render(<App />);
  }
})();
