import { Loader2 } from 'lucide-react';

export default function LoadingSpinner({ className = '' }) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <Loader2 className="size-8 animate-spin text-muted-foreground" />
    </div>
  );
}
