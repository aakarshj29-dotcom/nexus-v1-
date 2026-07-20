'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ShieldAlert, Loader2, ArrowRight, Sparkles, LogIn } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function AuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading, login, signup, signInWithGoogle } = useAuth();
  const { success: toastSuccess, error: toastError, info: toastInfo } = useToast();

  const [isSignUp, setIsSignUp] = React.useState(false);
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const isMockMode = typeof window !== 'undefined' && process.env.NEXT_PUBLIC_MOCK_AUTH === 'true';

  // Redirect if user is already logged in
  React.useEffect(() => {
    if (!loading && user) {
      if (user.onboardingComplete) {
        const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
        router.replace(callbackUrl);
      } else {
        router.replace('/onboarding');
      }
    }
  }, [user, loading, router, searchParams]);

  const validateForm = () => {
    if (!email || !password) {
      setErrorMsg('Please fill in all fields.');
      return false;
    }
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return false;
    }
    setErrorMsg(null);
    return true;
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);
      setErrorMsg(null);

      if (isSignUp) {
        await signup(email, password);
        toastSuccess('Account Created', 'Your account has been registered successfully.');
      } else {
        await login(email, password);
        toastSuccess('Signed In', 'Welcome back to Nexus!');
      }
    } catch (err: unknown) {
      console.error('Authentication error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Authentication failed. Please check your credentials.';
      setErrorMsg(errorMessage);
      toastError('Authentication Failed', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsSubmitting(true);
      setErrorMsg(null);
      await signInWithGoogle();
      toastSuccess('Signed In', 'Signed in with Google successfully.');
    } catch (err: unknown) {
      console.error('Google Auth error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Google sign-in failed.';
      setErrorMsg(errorMessage);
      toastError('Google Authentication Failed', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMockBypass = () => {
    toastInfo('Mock Auth Active', 'Signing in to local mock workspace environment.');
    router.replace('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30 font-[family-name:var(--font-geist-sans)]">
      <Card className="w-full max-w-md border shadow-lg relative overflow-hidden bg-background">
        {/* Animated Accent Header Grid */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-primary via-indigo-500 to-purple-600" />

        <CardHeader className="space-y-2 text-center pt-8">
          <div className="flex justify-center mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-xl shadow-md">
              N
            </div>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">
            {isSignUp ? 'Create your Nexus account' : 'Sign in to Nexus V1'}
          </CardTitle>
          <CardDescription>
            {isSignUp
              ? 'Get started with your collaborative workspace today.'
              : 'Enter your credentials or use dynamic mock login.'}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Mock Mode Alert Banner */}
          {isMockMode && (
            <Alert className="bg-amber-500/10 border-amber-500/20 text-amber-800 dark:text-amber-400">
              <Sparkles className="h-4 w-4 text-amber-500" />
              <AlertTitle className="font-semibold text-xs">Offline Mock Mode Enabled</AlertTitle>
              <AlertDescription className="text-xs">
                You can instantly bypass authentication via mock credentials.
              </AlertDescription>
            </Alert>
          )}

          {/* Error message alert */}
          {errorMsg && (
            <Alert variant="destructive">
              <ShieldAlert className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{errorMsg}</AlertDescription>
            </Alert>
          )}

          {/* Mock bypass button */}
          {isMockMode ? (
            <div className="space-y-4">
              <Button
                onClick={handleMockBypass}
                className="w-full font-semibold shadow-sm"
                size="lg"
              >
                <LogIn className="mr-2 h-4 w-4" /> Continue as Mock User
              </Button>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or standard auth
                  </span>
                </div>
              </div>
            </div>
          ) : null}

          {/* Form */}
          <form onSubmit={handleEmailAuth} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none">Email Address</label>
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isSubmitting}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium leading-none">Password</label>
              </div>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isSubmitting}
                className="w-full"
              />
            </div>

            <Button
              type="submit"
              className="w-full mt-2 font-semibold"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {isSignUp ? 'Sign Up' : 'Sign In'}
            </Button>
          </form>

          {/* Google SSO button */}
          {!isMockMode ? (
            <>
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or connect with
                  </span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full font-medium"
                onClick={handleGoogleSignIn}
                disabled={isSubmitting}
              >
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </Button>
            </>
          ) : null}
        </CardContent>

        <CardFooter className="justify-center border-t py-4 bg-muted/10">
          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 transition-all"
            disabled={isSubmitting}
          >
            {isSignUp ? 'Already have an account? Sign In' : 'New to Nexus V1? Sign Up'}
            <ArrowRight className="h-3 w-3" />
          </button>
        </CardFooter>
      </Card>
    </div>
  );
}
