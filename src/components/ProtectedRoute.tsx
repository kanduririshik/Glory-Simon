import { useAuth } from '@/lib/AuthContext';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isLoadingAuth } = useAuth();

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="h-10 w-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <p className="text-sm text-muted-foreground">Glory Simon Interiors</p>
      </div>
    );
  }

  return <>{children}</>;
}
