import SignupForm from '@/components/auth/SignupForm';

export default function SignupPage() {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-center items-center bg-primary p-12 text-primary-foreground">
        <div className="max-w-md space-y-6">
          <h1 className="text-4xl font-bold">SubManager</h1>
          <p className="text-lg text-primary-foreground/80">
            Join thousands of businesses managing their subscriptions smarter.
          </p>
        </div>
      </div>
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <h1 className="text-2xl font-bold text-primary">SubManager</h1>
          </div>
          <SignupForm />
        </div>
      </div>
    </div>
  );
}
