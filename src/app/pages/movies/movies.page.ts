import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonThumbnail, IonLabel, IonButton, IonIcon,
  IonSearchbar, IonSpinner, IonNote, ToastController,
} from '@ionic/angular';
import { AuthService } from '../../services/auth.service';
import { MovieService } from '../../services/movie.service';
import { Movie } from '../../models';

@Component({
  selector: 'app-movies',
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonThumbnail, IonLabel, IonButton, IonIcon,
            IonSearchbar, IonSpinner, IonNote],
  template: `
    <ion-header>
      <ion-toolbar><ion-title>Films</ion-title></ion-toolbar>
      <ion-toolbar>
        <ion-searchbar placeholder="Rechercher un titre" [debounce]="150" (ionInput)="onSearch($event)"></ion-searchbar>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      @if (movies() === undefined) {
        <div class="center"><ion-spinner></ion-spinner></div>
      } @else if (movies()!.length === 0) {
        <div class="center empty">
          <p>Aucun film dans le catalogue.</p>
          <p>Un administrateur peut importer les films populaires depuis l'onglet Admin.</p>
        </div>
      } @else {
        <ion-list>
          @for (m of filtered(); track m.id) {
            <ion-item lines="full">
              <ion-thumbnail slot="start" class="poster">
                @if (m.posterUrl) { <img [src]="m.posterUrl" [alt]="'Affiche de ' + m.title" loading="lazy" /> }
                @else { <div class="noposter"><ion-icon name="film-outline"></ion-icon></div> }
              </ion-thumbnail>
              <ion-label>
                <h2>{{ m.title }}</h2>
                <ion-note>{{ m.releaseDate.slice(0, 4) || 'Date inconnue' }}@if (m.source === 'admin') { · ajouté par l'admin }</ion-note>
                <p class="overview">{{ m.overview }}</p>
              </ion-label>
              <ion-button fill="clear" slot="end" (click)="toggle(m)"
                          [attr.aria-label]="favs().has(m.id) ? 'Retirer de ma playlist' : 'Ajouter à ma playlist'">
                <ion-icon slot="icon-only" color="danger" [name]="favs().has(m.id) ? 'heart' : 'heart-outline'"></ion-icon>
              </ion-button>
            </ion-item>
          } @empty {
            <div class="center empty"><p>Aucun film ne correspond à « {{ search() }} ».</p></div>
          }
        </ion-list>
      }
    </ion-content>
  `,
  styles: [`
    .center { display: flex; flex-direction: column; align-items: center; padding: 48px 24px; text-align: center; }
    .empty p { color: var(--ion-color-medium); margin: 4px 0; max-width: 36ch; }
    .poster { --size: 64px; height: 96px; --border-radius: 6px; }
    .noposter { width: 64px; height: 96px; display: grid; place-items: center; background: var(--ion-color-step-150, #333); border-radius: 6px; }
    .overview { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; white-space: normal; }
  `],
})
export class MoviesPage {
  private auth = inject(AuthService);
  private movieService = inject(MovieService);
  private toast = inject(ToastController);

  movies = toSignal(this.movieService.movies$);
  private profile = toSignal(this.auth.profile$, { initialValue: null });
  favs = computed(() => new Set(this.profile()?.favorites ?? []));
  search = signal('');

  filtered = computed<Movie[]>(() => {
    const q = this.search().trim().toLowerCase();
    const list = this.movies() ?? [];
    return q ? list.filter(m => m.title.toLowerCase().includes(q)) : list;
  });

  onSearch(ev: Event) {
    this.search.set(((ev as CustomEvent).detail?.value as string) ?? '');
  }

  async toggle(m: Movie) {
    const uid = this.auth.uid;
    if (!uid) return;
    try {
      await this.movieService.toggleFavorite(uid, m.id, this.favs().has(m.id));
    } catch (e) {
      const t = await this.toast.create({ message: this.auth.errorMessage(e), color: 'danger', duration: 2500 });
      await t.present();
    }
  }
}
