'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useProfile } from '@/hooks/use-profile';
import { Button } from '@/components/ui/button';
import { UsernameInput } from '@/components/profile/username-input';
import { AvatarUploader } from '@/components/profile/avatar-uploader';
import { AuthLoading } from '@/components/ui/auth-loading';
import { Loader2, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Input } from '@/components/ui/input';

enum Step {
  WELCOME = 0,
  USERNAME = 1,
  AVATAR = 2,
  BIO = 3,
  FINISH = 4,
}

export default function OnboardingPage() {
  const router = useRouter();
  const { profile, loading, claimUsername, completeOnboarding } = useProfile();
  const [step, setStep] = useState<Step>(Step.WELCOME);
  const [username, setUsername] = useState('');
  const [isUsernameValid, setIsUsernameValid] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && profile) {
      if (profile.onboardingComplete) {
        router.replace('/dashboard');
      } else {
        setDisplayName(profile.displayName || '');
        if (profile.username) {
          setUsername(profile.username);
          setIsUsernameValid(true);
        }
      }
    }
  }, [profile, loading, router]);

  if (loading || !profile) {
    return <AuthLoading />;
  }

  const nextStep = () => setStep((s) => s + 1);
  const prevStep = () => setStep((s) => s - 1);

  const handleFinish = async () => {
    try {
      setIsSubmitting(true);

      // Finalize username if changed
      if (username !== profile.username) {
        await claimUsername(username);
      }

      // Complete onboarding
      await completeOnboarding({
        displayName,
        bio,
      });

      router.replace('/dashboard');
    } catch (error) {
      console.error('Onboarding failed:', error);
      alert('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case Step.WELCOME:
        return (
          <div className="space-y-6 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold">Welcome to Nexus</h1>
              <p className="text-muted-foreground">
                Let&apos;s get your profile set up so you can start collaborating.
              </p>
            </div>
            <div className="pt-4">
              <Button onClick={nextStep} size="lg" className="px-8">
                Get Started <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        );

      case Step.USERNAME:
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="space-y-2 text-center">
              <h1 className="text-2xl font-bold">Choose your username</h1>
              <p className="text-sm text-muted-foreground">
                This is how others will find and mention you.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Display Name</label>
                <Input
                  placeholder="Your Name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Username</label>
                <UsernameInput
                  value={username}
                  onChange={setUsername}
                  onValidChange={setIsUsernameValid}
                  initialUsername={profile.username}
                />
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="ghost" onClick={prevStep}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button onClick={nextStep} disabled={!isUsernameValid || !displayName}>
                Next <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        );

      case Step.AVATAR:
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="space-y-2 text-center">
              <h1 className="text-2xl font-bold">Add a profile picture</h1>
              <p className="text-sm text-muted-foreground">
                Help your team recognize you.
              </p>
            </div>

            <div className="py-8">
              <AvatarUploader
                currentImageUrl={profile.avatarUrl}
              />
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="ghost" onClick={prevStep}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button onClick={nextStep}>
                Next <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        );

      case Step.BIO:
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="space-y-2 text-center">
              <h1 className="text-2xl font-bold">Tell us about yourself</h1>
              <p className="text-sm text-muted-foreground">
                A short bio to let others know who you are.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Bio (Optional)</label>
              <textarea
                className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Software Engineer at Nexus..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="ghost" onClick={prevStep}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button onClick={nextStep}>
                Next <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        );

      case Step.FINISH:
        return (
          <div className="space-y-6 text-center animate-in fade-in zoom-in duration-500">
            <div className="flex justify-center">
              <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-10 w-10 text-primary" />
              </div>
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-bold">You&apos;re all set!</h1>
              <p className="text-muted-foreground">
                Your profile is ready. Welcome to the Nexus community.
              </p>
            </div>
            <div className="pt-4">
              <Button
                onClick={handleFinish}
                size="lg"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Go to Dashboard
              </Button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
      <div className="max-w-md w-full space-y-8 bg-background p-8 rounded-2xl border shadow-sm">
        {/* Progress bar */}
        <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300 ease-in-out"
            style={{ width: `${(step / Step.FINISH) * 100}%` }}
          />
        </div>

        {renderStep()}
      </div>
    </div>
  );
}
