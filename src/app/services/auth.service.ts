import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  Auth, authState, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, deleteUser,
} from '@angular/fire/auth';
import { Firestore, doc, docData, getDoc, setDoc } from '@angular/fire/firestore';
import { Observable, catchError, map, of, shareReplay, switchMap } from 'rxjs';
import { UserProfile } from '../models';

export interface RegisterData {
  nom: string;
  prenom: string;
  age: number;
  email: string;
  password: string;
  photo: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private auth = inject(Auth);
  private db = inject(Firestore);
  private router = inject(Router);

  readonly user$ = authState(this.auth);

  /** Profil Firestore de l'utilisateur connecté, mis à jour en temps réel. */
  readonly profile$: Observable<UserProfile | null> = this.user$.pipe(
    switchMap(u =>
      u
        ? (docData(doc(this.db, 'users', u.uid), { idField: 'id' }) as Observable<UserProfile | undefined>).pipe(
            map(p => p ?? null),
            catchError(() => of(null))
          )
        : of(null)
    ),
    shareReplay({ bufferSize: 1, refCount: false })
  );

  constructor() {
    // Si un admin désactive le compte pendant la session : déconnexion immédiate.
    this.profile$.subscribe(p => {
      if (p && p.active === false) this.logout();
    });
  }

  get uid(): string | null {
    return this.auth.currentUser?.uid ?? null;
  }

  /** Lecture ponctuelle (utilisée par les guards). */
  async currentProfile(): Promise<UserProfile | null> {
    await this.auth.authStateReady();
    const u = this.auth.currentUser;
    if (!u) return null;
    const snap = await getDoc(doc(this.db, 'users', u.uid));
    return snap.exists() ? ({ id: snap.id, ...snap.data() } as UserProfile) : null;
  }

  async register(d: RegisterData): Promise<void> {
    const cred = await createUserWithEmailAndPassword(this.auth, d.email.trim(), d.password);
    try {
      await setDoc(doc(this.db, 'users', cred.user.uid), {
        nom: d.nom.trim(),
        prenom: d.prenom.trim(),
        age: Number(d.age),
        email: d.email.trim(),
        photo: d.photo,
        role: 'user',
        active: true,
        favorites: [],
        createdAt: Date.now(),
      });
    } catch (e) {
      // Évite un compte Auth sans profil Firestore (inscription « à moitié »)
      await deleteUser(cred.user).catch(() => undefined);
      throw e;
    }
  }

  async login(email: string, password: string): Promise<void> {
    const cred = await signInWithEmailAndPassword(this.auth, email.trim(), password);
    const snap = await getDoc(doc(this.db, 'users', cred.user.uid));
    if (!snap.exists()) {
      await signOut(this.auth);
      throw new Error(
        'Profil introuvable dans Firestore. Supprimez ce compte dans Firebase Authentication puis réinscrivez-vous.'
      );
    }
    if (snap.data()['active'] !== true) {
      await signOut(this.auth);
      throw new Error('Compte désactivé par un administrateur.');
    }
  }

  async logout(): Promise<void> {
    await signOut(this.auth);
    await this.router.navigateByUrl('/login', { replaceUrl: true });
  }

  errorMessage(e: any): string {
    switch (e?.code) {
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
      case 'auth/user-not-found':
        return 'Email ou mot de passe incorrect.';
      case 'auth/email-already-in-use':
        return 'Cet email est déjà utilisé.';
      case 'auth/invalid-email':
        return 'Adresse email invalide.';
      case 'auth/weak-password':
        return 'Mot de passe trop faible (6 caractères minimum).';
      case 'auth/too-many-requests':
        return 'Trop de tentatives. Réessayez dans quelques minutes.';
      case 'auth/network-request-failed':
        return 'Pas de connexion réseau.';
      case 'permission-denied':
        return 'Accès refusé par les règles Firestore.';
      default:
        return e?.message ?? 'Erreur inconnue.';
    }
  }
}
