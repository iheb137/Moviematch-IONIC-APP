import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/** Connecté ET profil actif. */
export const authGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const p = await auth.currentProfile();
  return p?.active ? true : router.createUrlTree(['/login']);
};

/** Réservé au rôle admin. */
export const adminGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const p = await auth.currentProfile();
  return p?.active && p.role === 'admin' ? true : router.createUrlTree(['/tabs/movies']);
};

/** Login/inscription : si déjà connecté, on va directement aux films. */
export const guestGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const p = await auth.currentProfile();
  return p?.active ? router.createUrlTree(['/tabs/movies']) : true;
};
