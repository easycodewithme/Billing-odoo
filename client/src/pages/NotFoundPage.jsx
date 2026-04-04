import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50 px-4">
      <h1 className="text-6xl font-bold text-muted-foreground">404</h1>
      <p className="text-lg text-muted-foreground">Page not found</p>
      <p className="text-sm text-muted-foreground">
        The page you are looking for does not exist or has been moved.
      </p>
      <Button onClick={() => navigate('/dashboard')}>Go to Dashboard</Button>
    </div>
  );
}
