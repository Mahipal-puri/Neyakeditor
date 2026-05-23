import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import SectionHeading from '../components/ui/SectionHeading';
import TemplateGallery from '../components/sections/TemplateGallery';
import CTASection from '../components/sections/CTASection';
import { fetchTemplates } from '../lib/templatesApi';

export default function Templates() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchTemplates().then((result) => {
      if (cancelled) return;
      setData(result);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <header className="pt-36 pb-8 container-page">
        <SectionHeading
          eyebrow="Templates"
          title="Start from a"
          highlight="ready-made look"
          description="Pick a preset, drop your image, and customise with gestures. Powered by our /api/templates endpoint — set UNSPLASH_ACCESS_KEY in .env to enrich the catalog with real photos."
        />
      </header>

      <section className="container-page">
        {loading ? (
          <div className="mt-20 flex items-center justify-center gap-3 text-slate-400">
            <Loader2 size={20} className="animate-spin text-neon-cyan" />
            Loading templates from the API…
          </div>
        ) : (
          <TemplateGallery
            templates={data?.templates}
            notice={data?.notice}
          />
        )}
      </section>

      <CTASection />
    </>
  );
}
