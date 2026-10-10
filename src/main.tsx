import {StrictMode, Suspense, lazy} from 'react';
import {createRoot} from 'react-dom/client';
import {BrowserRouter, Route, Routes} from 'react-router-dom';
import Home from './routes/Home.tsx';
import CaseStudy from './routes/CaseStudy.tsx';
import NotFound from './routes/NotFound.tsx';
import './index.css';

/**
 * The console is code-split: none of the admin UI ships in the bundle a normal
 * visitor downloads, and nothing on the public site links to this route.
 */
const AdminApp = lazy(() => import('./admin/AdminApp.tsx'));

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/work/:slug" element={<CaseStudy />} />
        <Route
          path="/kz-console/*"
          element={
            <Suspense fallback={<div className="min-h-screen bg-[#0B1322]" />}>
              <AdminApp />
            </Suspense>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
