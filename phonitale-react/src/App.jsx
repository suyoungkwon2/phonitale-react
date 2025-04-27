import React from 'react';
import { Routes, Route } from 'react-router-dom';

// Import Page Components
import ConsentPage from './pages/ConsentPage';
import InstructionPage from './pages/InstructionPage';
import RoundStartPage from './pages/RoundStartPage';
import LearningStartPage from './pages/LearningStartPage';
import LearningPage from './pages/LearningPage';
import RecognitionStartPage from './pages/RecognitionStartPage';
import RecognitionPage from './pages/RecognitionPage';
import GenerationStartPage from './pages/GenerationStartPage';
import GenerationPage from './pages/GenerationPage';
import SurveyStartPage from './pages/SurveyStartPage';
import SurveyPage from './pages/SurveyPage';
import EndPage from './pages/EndPage';
// Import MainLayout if you want routes without the layout, otherwise pages handle it
// import MainLayout from './components/MainLayout'; 

function App() {
  return (
    <Routes>
      {/* Main experiment flow routes - assuming MainLayout is applied within each page */}
      <Route path="/" element={<ConsentPage />} />
      <Route path="/consent" element={<ConsentPage />} /> { /* Explicit consent route */}
      <Route path="/instruction" element={<InstructionPage />} />

      {/* Round specific routes */}
      <Route path="/round/:roundNumber/start" element={<RoundStartPage />} />
      <Route path="/round/:roundNumber/learning/start" element={<LearningStartPage />} />
      <Route path="/round/:roundNumber/learning" element={<LearningPage />} />
      <Route path="/round/:roundNumber/recognition/start" element={<RecognitionStartPage />} />
      <Route path="/round/:roundNumber/recognition" element={<RecognitionPage />} />
      <Route path="/round/:roundNumber/generation/start" element={<GenerationStartPage />} />
      <Route path="/round/:roundNumber/generation" element={<GenerationPage />} />

      {/* Survey routes */}
      <Route path="/survey/start" element={<SurveyStartPage />} />
      <Route path="/survey" element={<SurveyPage />} />

      {/* End route */}
      <Route path="/end" element={<EndPage />} />

      {/* Optional: Add a 404 Not Found route */}
      {/* <Route path="*" element={<div>Page Not Found</div>} /> */}
    </Routes>
  );
}

export default App;
