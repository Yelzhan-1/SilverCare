import React, { useState } from 'react';
import { Pill } from 'lucide-react';
import { MedicationPhotoPreset } from '../types/medication';

interface MedicationVisualProps {
  preset?: MedicationPhotoPreset;
  customUrl?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  altText?: string;
}

// Real pharmaceutical photos mapping
const PRESET_PHOTO_MAP: Record<MedicationPhotoPreset, string> = {
  'pill-white': '/medications/amlodipine.jpg',
  'bottle-heart': '/medications/cardiomagnyl.jpg',
  'capsule-blue': '/medications/blue_capsules.jpg',
  'tablet-yellow': '/medications/yellow_tablets.jpg',
  'capsule-green': '/medications/green_capsules.jpg',
  'capsule-red': '/medications/blue_capsules.jpg',
  'drops-blue': '/medications/blue_capsules.jpg',
  'syrup-amber': '/medications/cardiomagnyl.jpg',
};

export const MedicationVisual: React.FC<MedicationVisualProps> = ({
  preset = 'pill-white',
  customUrl,
  size = 'md',
  className = '',
  altText = 'Фото лекарства',
}) => {
  const [hasImageError, setHasImageError] = useState(false);

  const sizeClasses = {
    sm: 'w-14 h-14 rounded-2xl',
    md: 'w-18 h-18 rounded-2xl',
    lg: 'w-24 h-24 rounded-3xl',
    xl: 'w-36 h-36 sm:w-44 sm:h-44 rounded-[32px]',
  }[size];

  const photoSrc = customUrl || PRESET_PHOTO_MAP[preset] || '/medications/amlodipine.jpg';

  if (hasImageError) {
    // Elegant fallback icon if image fails to load
    return (
      <div
        className={`flex items-center justify-center bg-amber-50 border-2 border-amber-200/80 text-amber-800 shadow-sm ${sizeClasses} ${className}`}
      >
        <Pill className="w-1/2 h-1/2 stroke-[2.2]" />
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden border-2 border-amber-900/10 shadow-[0_4px_16px_rgba(0,0,0,0.06)] bg-white shrink-0 group ${sizeClasses} ${className}`}
    >
      <img
        src={photoSrc}
        alt={altText}
        referrerPolicy="no-referrer"
        onError={() => setHasImageError(true)}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
      />
      {/* Subtle shine gloss overlay */}
      <div className="absolute inset-0 bg-gradient-to-tr from-black/5 via-transparent to-white/20 pointer-events-none" />
    </div>
  );
};
