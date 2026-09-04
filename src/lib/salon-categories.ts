import { Feather } from '@expo/vector-icons';

import { SalonCategory } from '@/lib/types';

export const SALON_CATEGORIES: {
  value: SalonCategory;
  label: string;
  icon: keyof typeof Feather.glyphMap;
}[] = [
  { value: 'hair', label: 'Hair', icon: 'scissors' },
  { value: 'nails', label: 'Nails', icon: 'feather' },
  { value: 'skin', label: 'Skin', icon: 'sun' },
  { value: 'brows_lashes', label: 'Brows & Lashes', icon: 'eye' },
  { value: 'barber', label: 'Barber', icon: 'user' },
  { value: 'spa', label: 'Spa', icon: 'droplet' },
  { value: 'makeup', label: 'Makeup', icon: 'star' },
  { value: 'other', label: 'Other', icon: 'grid' },
];

export function salonCategoryLabel(category: SalonCategory | null): string | null {
  return SALON_CATEGORIES.find((c) => c.value === category)?.label ?? null;
}
