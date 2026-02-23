import { en, Dictionary } from './dictionaries/en';
import { he } from './dictionaries/he';

export type Locale = 'en' | 'he';
export type { Dictionary };

export const dictionaries: Record<Locale, Dictionary> = {
  en,
  he
};

export const getDictionary = (locale: Locale): Dictionary => {
  return dictionaries[locale] ?? dictionaries.he;
};
