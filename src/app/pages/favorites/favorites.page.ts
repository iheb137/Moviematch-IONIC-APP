import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonThumbnail, IonLabel, IonButton, IonIcon,
  IonNote, ToastController,
} from '@ionic/angular';
import { AuthService } from '../../services/auth.service';
import { MovieService } from '../../services/movie.service';
import { Movie } from '../../models';

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [RouterLink, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonThumbnail, IonLabel, IonButton, IonIcon, IonNote],
  template: `
    <ion-header>
      <ion-toolbar><ion-title>Ma playlist ({{ favMovies().length }})</ion-title></ion-toolbar>
    </ion-header>

    <ion-content>
      @if (favMovies().length === 0) {
        <div class="center">
          <p>Votre playlist est vide.</p>
          <ion-button fill="outline" routerLink="/tabs/movies">Parcourir les films</ion-button>
        </div>
      } @else {
        <ion-list>
          @for (m of favMovies(); track m.id) {
            <ion-item lines="full">
              <ion-thumbnail slot="start" class="poster">
                @if (m.posterUrl) { <img [src]="m.posterUrl" [alt]="'Affiche de ' + m.title" loading="lazy" /> }
              </ion-thumbnail>
              <ion-label>
                <h2>{{ m.title }}</h2>
                <ion-note>{{ m.releaseDate.slice(0, 4) }}</ion-note>
              </ion-label>
              <ion-button fill="clear" color="medium" slot="end" (click)="remove(m)" aria-label="Retirer de ma playlist">
                <ion-icon slot="icon-only" name="trash-outline"></ion-icon>
              </ion-button>
            </ion-item>
          }
        </ion-list>
      }
    </ion-content>
  `,
  styles: [`
    .center { display: flex; flex-direction: column; align-items: center; padding: 48px 24px; text-align: center; color: var(--ion-color-medium); }
    .poster { --size: 48px; height: 72px; --border-radius: 6px; }
  `],
})
export class FavoritesPage {
  private auth = inject(AuthService);
  private movieService = inject(MovieService);
  private toast = inject(ToastController);

  private movies = toSignal(this.movieService.movies$, { initialValue: [] as Movie[] });
  private profile = toSignal(this.auth.profile$, { initialValue: null });

  favMovies = computed(() => {
    const ids = new Set(this.profile()?.favorites ?? []);
    return this.movies().filter(m => ids.has(m.id));
  });

  async remove(m: Movie) {
    const uid = this.auth.uid;
    if (!uid) return;
    try {
      await this.movieService.toggleFavorite(uid, m.id, true);
    } catch (e) {
      const t = await this.toast.create({ message: this.auth.errorMessage(e), color: 'danger', duration: 2500 });
      await t.present();
    }
  }
}
