import { lazy, Suspense, useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { Hammer } from 'lucide-react';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import Home from './pages/Home';

const Features = lazy(() => import('./pages/Features'));
const Pricing = lazy(() => import('./pages/Pricing'));
const AIShowcase = lazy(() => import('./pages/AIShowcase'));
const Templates = lazy(() => import('./pages/Templates'));
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));
const Editor = lazy(() => import('./pages/Editor'));

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);
  return null;
}

function PageFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 rounded-full border-2 border-neon-cyan/30 border-t-neon-cyan animate-spin" />
    </div>
  );
}

function DigitalHammerBadge() {
  return (
    <div
      aria-label="Built by Digital Hammer"
      // z-40 keeps it below the Toaster (z-100); pointer-events-none so it
      // never blocks a click on whatever is beneath it.
      className="fixed bottom-3 right-3 z-40 pointer-events-none select-none px-3 py-1.5 rounded-full glass-strong text-xs flex items-center gap-1.5 shadow-glow-cyan/40"
    >
      <Hammer size={12} className="text-neon-cyan" />
      <span className="font-display font-semibold text-gradient">
        Digital Hammer
      </span>
    </div>
  );
}

function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <div className="text-7xl font-display font-bold text-gradient mb-4">404</div>
      <p className="text-slate-300 mb-6">This route is beyond reality.</p>
      <a
        href="/"
        className="px-6 py-3 rounded-xl bg-grad-neon text-white font-semibold shadow-glow"
      >
        Back home
      </a>
    </div>
  );
}

export default function App() {
  return (
    <>
      <Navbar />
      <ScrollToTop />
      <main className="min-h-screen">
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/features" element={<Features />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/showcase" element={<AIShowcase />} />
            <Route path="/templates" element={<Templates />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/editor" element={<Editor />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
      <DigitalHammerBadge />
    </>
  );
}
