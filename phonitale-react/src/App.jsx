import React, { useEffect } from 'react';
import { Routes, Route, useParams, useNavigate } from 'react-router-dom';
import { Spin, Layout } from 'antd';
import { useExperiment } from './context/ExperimentContext';

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

const GROUP_CODE_MAP = {
  tksdk: 'kss',
  wodnr: 'naive',
  audtjr: 'phonitale',
  tndud: 'og',
};

// Wrapper component to handle group code logic
function GroupWrapper({ children }) {
  const { groupCode } = useParams();
  const { setGroup } = useExperiment();
  const navigate = useNavigate(); // Import useNavigate

  useEffect(() => {
    const groupName = GROUP_CODE_MAP[groupCode];
    if (groupName) {
      setGroup(groupName);
    } else {
      console.error("[GroupWrapper] Invalid group code:", groupCode);
      navigate('/invalid-group'); // Redirect to a dedicated invalid group page
    }
  }, [groupCode, setGroup, navigate]);

  // Render children once the group is set (or determined to be invalid)
  return <>{children}</>;
}

function App() {
  // isLoadingWords is now mainly used in ExperimentContext for initial load
  // App component doesn't need direct access unless for a global loading state
  // const { isLoadingWords } = useExperiment(); 
  // if (isLoadingWords) { ... } // This logic is better placed inside GroupSpecificRoutes if needed

  return (
    <Routes>
      {/* Route for handling invalid group codes */}
      <Route path="/invalid-group" element={<div>Invalid Group Code. Please check your link.</div>} />

      {/* Route to handle potential root access without group code */}
      <Route path="/" element={<div>Please access the experiment using your assigned group link.</div>} />

      {/* Group specific routes are now handled by GroupWrapper */}
      <Route path="/:groupCode/*" element={<GroupWrapper><GroupSpecificRoutes /></GroupWrapper>} />

      {/* Optional: Add a global 404 Not Found route */}
      <Route path="*" element={<div>Page Not Found</div>} />
    </Routes>
  );
}

// Component containing routes accessible only after a valid group code is processed
function GroupSpecificRoutes() {
  const { isLoadingWords, group } = useExperiment(); // Check loading state and group

  // Show loading spinner while CSV is loading or group is not yet set
  if (isLoadingWords || !group) {
    return (
      <Layout style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Spin size="large" tip="Loading experiment data..." />
      </Layout>
    );
  }

  // Once loading is complete and group is set, render the group-specific routes
  return (
    <Routes>
      {/* Default route for the group (e.g., /tksdk/) goes to consent */}
      <Route path="/" element={<ConsentPage />} /> 
      <Route path="/consent" element={<ConsentPage />} />
      <Route path="/instruction" element={<InstructionPage />} />

      {/* Round specific routes */}
      {/* Note: The leading slash is important here as these are nested routes */} 
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

       {/* Catch-all for invalid paths within a valid group code */} 
      <Route path="*" element={<div>Sub-page Not Found within group.</div>} />
    </Routes>
  );
}

export default App;
