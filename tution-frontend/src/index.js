// --- STEP 1: ALL IMPORTS MUST BE AT THE TOP ---
import React from 'react';
import ReactDOM from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';
import './theme.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { // <-- The Chart.js import should be here
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';


// --- STEP 2: ALL FUNCTION CALLS GO AFTER IMPORTS ---
ChartJS.register( // <-- The register call goes here
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);


// --- The rest of your file ---
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

reportWebVitals();