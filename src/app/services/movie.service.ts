import { Injectable, inject } from '@angular/core';
import { Auth, authState } from '@angular/fire/auth';
import {
  Firestore, collection, collectionData, doc, addDoc, deleteDoc, updateDoc, arrayUnion, arrayRemove, writeBatch,
} from '@angular/fire/firestore';
import { Observable, catchError, map, of, shareReplay, switchMap } from 'rxjs';
import { Movie } from '../models';
import { environment } from '../../environments/environment';

export type NewMovie = Omit<Movie, 'id' | 'source'>;

@Injectable({ providedIn: 'root' })
export class MovieService {
  private db = inject(Firestore);
  private auth = inject(Auth);

  /** Tous les films (TMDB importés + ajoutés par l'admin), en temps réel. */
  readonly movies$: Observable<Movie[]> = authState(this.auth).pipe(
    switchMap(u =>
      u
        ? (collectionData(collection(this.db, 'movies'), { idField: 'id' }) as Observable<Movie[]>).pipe(
            map(list => [...list].sort((a, b) => a.title.localeCompare(b.title))),
            catchError(() => of([] as Movie[]))
          )
        : of([] as Movie[])
    ),
    shareReplay({ bufferSize: 1, refCount: false })
  );

  toggleFavorite(uid: string, movieId: string, isFav: boolean) {
    return updateDoc(doc(this.db, 'users', uid), {
      favorites: isFav ? arrayRemove(movieId) : arrayUnion(movieId),
    });
  }

  addMovie(m: NewMovie) {
    return addDoc(collection(this.db, 'movies'), { ...m, source: 'admin' });
  }

  deleteMovie(id: string) {
    return deleteDoc(doc(this.db, 'movies', id));
  }

  /** Importe les films populaires TMDB (20 par page). Idempotent : ID = tmdb_<id>. */
  async importFromTmdb(pages = 3): Promise<number> {
    const batch = writeBatch(this.db);
    let count = 0;
    for (let p = 1; p <= pages; p++) {
      const res = await fetch(
        `https://api.themoviedb.org/3/movie/popular?api_key=${environment.tmdbApiKey}&language=fr-FR&page=${p}`
      );
      if (res.status === 401) throw new Error('Clé TMDB invalide (environment.ts).');
      if (!res.ok) throw new Error(`TMDB a répondu ${res.status}.`);
      const data = await res.json();
      for (const m of data.results ?? []) {
        batch.set(doc(this.db, 'movies', `tmdb_${m.id}`), {
          title: m.title ?? 'Sans titre',
          overview: m.overview ?? '',
          posterUrl: m.poster_path ? `https://image.tmdb.org/t/p/w342${m.poster_path}` : '',
          releaseDate: m.release_date ?? '',
          source: 'tmdb',
        });
        count++;
      }
    }
    await batch.commit();
    return count;
  }
}
