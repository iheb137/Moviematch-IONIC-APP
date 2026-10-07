import { Injectable, inject } from '@angular/core';
import { Auth, authState } from '@angular/fire/auth';
import { Firestore, collection, collectionData, doc, updateDoc } from '@angular/fire/firestore';
import { Observable, catchError, map, of, shareReplay, switchMap } from 'rxjs';
import { UserProfile } from '../models';

@Injectable({ providedIn: 'root' })
export class UserService {
  private db = inject(Firestore);
  private auth = inject(Auth);

  /** Tous les utilisateurs, en temps réel (matching + admin). */
  readonly users$: Observable<UserProfile[]> = authState(this.auth).pipe(
    switchMap(u =>
      u
        ? (collectionData(collection(this.db, 'users'), { idField: 'id' }) as Observable<UserProfile[]>).pipe(
            map(list => [...list].sort((a, b) => `${a.prenom} ${a.nom}`.localeCompare(`${b.prenom} ${b.nom}`))),
            catchError(() => of([] as UserProfile[]))
          )
        : of([] as UserProfile[])
    ),
    shareReplay({ bufferSize: 1, refCount: false })
  );

  /** Désactivation (jamais de suppression). */
  setActive(uid: string, active: boolean) {
    return updateDoc(doc(this.db, 'users', uid), { active });
  }
}
