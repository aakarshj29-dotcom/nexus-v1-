'use client';

import { useState, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Camera, Loader2, User } from 'lucide-react';
import { useProfile } from '@/hooks/use-profile';

interface AvatarUploaderProps {
  currentImageUrl?: string | null;
  onUploadComplete?: (url: string) => void;
}

export const AvatarUploader = ({
  currentImageUrl,
  onUploadComplete,
}: AvatarUploaderProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadAvatar } = useProfile();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Basic validation
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      alert('File size should be less than 2MB.');
      return;
    }

    try {
      setIsUploading(true);
      const url = await uploadAvatar(file);
      onUploadComplete?.(url);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload avatar.');
    } finally {
      setIsUploading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative group">
        <Avatar className="h-24 w-24 border-2 border-primary/10">
          <AvatarImage src={currentImageUrl || undefined} />
          <AvatarFallback className="bg-muted text-muted-foreground">
            <User className="h-12 w-12" />
          </AvatarFallback>
        </Avatar>
        <button
          onClick={triggerFileInput}
          disabled={isUploading}
          className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          type="button"
        >
          {isUploading ? (
            <Loader2 className="h-6 w-6 text-white animate-spin" />
          ) : (
            <Camera className="h-6 w-6 text-white" />
          )}
        </button>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={triggerFileInput}
        disabled={isUploading}
        type="button"
      >
        {currentImageUrl ? 'Change Avatar' : 'Upload Avatar'}
      </Button>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
    </div>
  );
};
