import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import HomePage from './pages/HomePage';
import CatalogPage from './pages/CatalogPage';
import PredictPage from './pages/PredictPage';
import ComparePage from './pages/ComparePage';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50">
        <Header />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/catalog" element={<CatalogPage />} />
          <Route path="/predict" element={<PredictPage />} />
          <Route path="/compare" element={<ComparePage />} />
        </Routes>
        <footer className="border-t border-slate-200 py-6 mt-12">
          <p className="text-center text-xs text-slate-400">
            Fashion Campus Next-Click Prediction System | Markov Chain + GRU + Word2Vec
          </p>
        </footer>
      </div>
    </BrowserRouter>
  );
}

export default App;
