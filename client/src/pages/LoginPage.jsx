import LoginForm from '@/components/auth/LoginForm';

export default function LoginPage() {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left panel - branding */}
      <div className="hidden lg:flex flex-col justify-center items-center bg-primary p-12 text-primary-foreground">
        <div className="max-w-md space-y-6">
          <h1 className="text-4xl font-bold">SubManager</h1>
          <p className="text-lg text-primary-foreground/80">
            The complete subscription management platform for modern businesses. Manage billing, invoicing, and customer relationships in one place.
          </p>
          <div className="space-y-3 text-sm text-primary-foreground/70">
            <div className="flex items-center gap-2">
              <div className="size-1.5 rounded-full bg-primary-foreground/50" />
              <span>Automated recurring billing</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="size-1.5 rounded-full bg-primary-foreground/50" />
              <span>Real-time analytics dashboard</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="size-1.5 rounded-full bg-primary-foreground/50" />
              <span>Stripe payment integration</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <h1 className="text-2xl font-bold text-primary">SubManager</h1>
          </div>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
