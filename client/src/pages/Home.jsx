import Hero from '../components/sections/Hero';
import FeatureGrid from '../components/sections/FeatureGrid';
import GestureShowcase from '../components/sections/GestureShowcase';
import AIModelsTable from '../components/sections/AIModelsTable';
import CTASection from '../components/sections/CTASection';

export default function Home() {
  return (
    <>
      <Hero />
      <FeatureGrid limit={6} />
      <GestureShowcase />
      <AIModelsTable />
      <CTASection />
    </>
  );
}
