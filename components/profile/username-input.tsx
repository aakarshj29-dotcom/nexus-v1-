'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { validateUsername, normalizeUsername } from '@/lib/validation/username';
import { usernameExists } from '@/firebase/profile-service';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

interface UsernameInputProps {
  value: string;
  onChange: (value: string) => void;
  onValidChange: (isValid: boolean) => void;
  initialUsername?: string | null;
}

export const UsernameInput = ({
  value,
  onChange,
  onValidChange,
  initialUsername,
}: UsernameInputProps) => {
  const [error, setError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAvailability = async () => {
      const normalized = normalizeUsername(value);

      if (normalized === initialUsername) {
        setError(null);
        setIsAvailable(true);
        onValidChange(true);
        return;
      }

      const validationError = validateUsername(normalized);
      if (validationError) {
        setError(validationError);
        setIsAvailable(false);
        onValidChange(false);
        return;
      }

      setError(null);
      setIsChecking(true);
      try {
        const taken = await usernameExists(normalized);
        setIsAvailable(!taken);
        setError(taken ? 'This username is already taken.' : null);
        onValidChange(!taken);
      } catch {
        setError('Error checking username availability.');
        onValidChange(false);
      } finally {
        setIsChecking(false);
      }
    };

    if (value.length >= 3) {
      const timeoutId = setTimeout(checkAvailability, 500);
      return () => clearTimeout(timeoutId);
    } else {
      setIsAvailable(null);
      if (value.length > 0) {
        setError('Username must be at least 3 characters long.');
      } else {
        setError(null);
      }
      onValidChange(false);
    }
  }, [value, initialUsername, onValidChange]);

  return (
    <div className="space-y-2">
      <div className="relative">
        <Input
          placeholder="username"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`pr-10 ${
            isAvailable === true ? 'border-green-500 focus-visible:ring-green-500' :
            isAvailable === false ? 'border-red-500 focus-visible:ring-red-500' : ''
          }`}
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          {isChecking ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : isAvailable === true ? (
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          ) : isAvailable === false ? (
            <XCircle className="h-4 w-4 text-red-500" />
          ) : null}
        </div>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      <p className="text-xs text-muted-foreground">
        3–20 characters. Lowercase, numbers, and underscores only.
      </p>
    </div>
  );
};
