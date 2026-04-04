import { Check, Circle } from 'lucide-react';

const STEPS = [
  { key: 'draft', label: 'Draft' },
  { key: 'quotation', label: 'Quotation Sent' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'active', label: 'Active' },
  { key: 'closed', label: 'Closed' },
];

const STATUS_ORDER = { draft: 0, quotation: 1, confirmed: 2, active: 3, paused: 3, closed: 4 };

export default function StatusStepper({ currentStatus }) {
  const currentIndex = STATUS_ORDER[currentStatus] ?? 0;
  const isPaused = currentStatus === 'paused';

  return (
    <div className="flex items-center w-full mb-6">
      {STEPS.map((step, i) => {
        const isCompleted = i < currentIndex;
        const isCurrent = i === currentIndex;
        const isUpcoming = i > currentIndex;

        return (
          <div key={step.key} className="flex items-center flex-1 last:flex-none">
            {/* Step circle */}
            <div className="flex flex-col items-center">
              <div className={`size-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
                isCompleted ? 'bg-primary border-primary text-primary-foreground' :
                isCurrent ? (isPaused && step.key === 'active' ? 'bg-yellow-500 border-yellow-500 text-white' : 'bg-primary/20 border-primary text-primary') :
                'bg-muted border-muted-foreground/20 text-muted-foreground'
              }`}>
                {isCompleted ? <Check className="size-4" /> : i + 1}
              </div>
              <span className={`text-xs mt-1 whitespace-nowrap ${
                isCurrent ? 'font-semibold text-foreground' : 'text-muted-foreground'
              }`}>
                {isPaused && step.key === 'active' ? 'Paused' : step.label}
              </span>
            </div>

            {/* Connector line */}
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 ${
                i < currentIndex ? 'bg-primary' : 'bg-muted-foreground/20'
              }`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
