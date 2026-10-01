import { Routes, Route } from 'react-router-dom';
import { Home } from './pages/Home';
import { CVRiskCalculator } from './CVRiskCalculator';
import { PreCardia } from './pages/PreCardia';
import { ReleaseNotes } from './components/ReleaseNotes';

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/prevent-calculator" element={<CVRiskCalculator />} />
        <Route path="/precardia" element={<PreCardia />} />
      </Routes>
      <ReleaseNotes />
    </>
  );
}

export default App;
