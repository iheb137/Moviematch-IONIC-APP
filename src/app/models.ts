export type Role = 'user' | 'admin';

export interface UserProfile {
  id: string;
  nom: string;
  prenom: string;
  age: number;
  email?: string;
  photo: string;
  role: Role;
  active: boolean;
  favorites: string[];
  createdAt?: number;
}

export interface Movie {
  id: string;
  title: string;
  overview: string;
  posterUrl: string;
  releaseDate: string;
  source: 'tmdb' | 'admin';
}

export interface Match {
  user: UserProfile;
  score: number;      // en %
  common: string[];   // IDs des films en commun
}
