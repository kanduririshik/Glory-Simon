import { Link } from 'react-router-dom';
import { GlassCard } from '@/components/ui/GlassCard';

export default function PageNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <GlassCard className="p-8 text-center max-w-md">
        <h1 className="text-6xl font-bold text-gradient-blue">404</h1>
        <p className="text-muted-foreground mt-4">Page not found</p>
        <Link to="/" className="inline-block mt-6 px-4 py-2 rounded-xl bg-primary text-white text-sm hover:opacity-90">Go to Dashboard</Link>
      </GlassCard>
    </div>
  );
}
