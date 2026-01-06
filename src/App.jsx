import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { QuizPage } from './pages/QuizPage';
import { PrintPreviewPage } from './pages/PrintPreviewPage';

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/quiz/:id" element={<QuizPage />} />
          <Route path="/print/:index" element={<PrintPreviewPage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
