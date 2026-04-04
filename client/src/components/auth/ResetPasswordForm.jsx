import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { forgotPassword, resetPassword } from '../../api/auth.api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { Loader2 } from 'lucide-react';

export default function ResetPasswordForm() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  // If token is present in URL, show the reset form; otherwise, show the request form
  return token ? <ResetForm token={token} /> : <RequestForm />;
}

function RequestForm() {
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrors({ email: 'Email is required' });
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      await forgotPassword({ email });
      setSent(true);
      toast.success('Reset link sent! Check your email.');
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Failed to send reset link. Please try again.';
      toast.error(message);
      setErrors({ api: message });
    } finally {
      setSubmitting(false);
    }
  };

  if (sent) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Check your email</CardTitle>
          <CardDescription>
            We sent a password reset link to <strong>{email}</strong>. Please check your inbox and
            follow the instructions.
          </CardDescription>
        </CardHeader>
        <CardFooter className="justify-center">
          <Link to="/login" className="text-sm font-medium text-primary hover:underline">
            Back to sign in
          </Link>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Forgot password</CardTitle>
        <CardDescription>
          Enter your email address and we&apos;ll send you a link to reset your password.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={!!errors.email}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email}</p>
            )}
          </div>

          {errors.api && (
            <p className="text-sm text-destructive">{errors.api}</p>
          )}

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting && <Loader2 className="mr-2 size-4 animate-spin" />}
            Send reset link
          </Button>
        </form>
      </CardContent>
      <CardFooter className="justify-center">
        <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground">
          Back to sign in
        </Link>
      </CardFooter>
    </Card>
  );
}

function ResetForm({ token }) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const validate = () => {
    const newErrors = {};
    if (!newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters';
    }
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setSubmitting(true);
    try {
      await resetPassword({ token, newPassword, confirmPassword });
      setSuccess(true);
      toast.success('Password reset successfully!');
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Failed to reset password. The link may have expired.';
      toast.error(message);
      setErrors({ api: message });
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Password reset</CardTitle>
          <CardDescription>
            Your password has been reset successfully. You can now sign in with your new password.
          </CardDescription>
        </CardHeader>
        <CardFooter className="justify-center">
          <Link to="/login" className="text-sm font-medium text-primary hover:underline">
            Go to sign in
          </Link>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Set new password</CardTitle>
        <CardDescription>Enter your new password below.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="newPassword">New Password</Label>
            <Input
              id="newPassword"
              type="password"
              placeholder="At least 8 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              aria-invalid={!!errors.newPassword}
            />
            {errors.newPassword && (
              <p className="text-sm text-destructive">{errors.newPassword}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Confirm your new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              aria-invalid={!!errors.confirmPassword}
            />
            {errors.confirmPassword && (
              <p className="text-sm text-destructive">{errors.confirmPassword}</p>
            )}
          </div>

          {errors.api && (
            <p className="text-sm text-destructive">{errors.api}</p>
          )}

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting && <Loader2 className="mr-2 size-4 animate-spin" />}
            Reset password
          </Button>
        </form>
      </CardContent>
      <CardFooter className="justify-center">
        <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground">
          Back to sign in
        </Link>
      </CardFooter>
    </Card>
  );
}
