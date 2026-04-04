import ResetPasswordForm from '@/components/auth/ResetPasswordForm';

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-muted/30">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-primary">SubManager</h1>
          <p className="text-sm text-muted-foreground mt-1">Reset your password</p>
        </div>
        <ResetPasswordForm />
      </div>
    </div>
  );
}
