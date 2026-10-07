import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonSegment, IonSegmentButton, IonLabel, IonList, IonListHeader, IonItem,
  IonInput, IonTextarea, IonButton, IonIcon, IonToggle, IonAvatar, IonNote, IonSpinner, AlertController, ToastController,
} from '@ionic/angular';
import { AuthService } from '../../services/auth.service';
import { MovieService } from '../../services/movie.service';
import { UserService } from '../../services/user.service';
import { Movie, UserProfile } from '../../models';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [FormsModule, IonHeader, IonToolbar, IonTitle, IonContent, IonSegment, IonSegmentButton, IonLabel, IonList,
            IonListHeader, IonItem, IonInput, IonTextarea, IonButton, IonIcon, IonToggle, IonAvatar, IonNote, IonSpinner],
  template: `
    <ion-header>
      <ion-toolbar><ion-title>Administration</ion-title></ion-toolbar>
      <ion-toolbar>
        <ion-segment [value]="tab()" (ionChange)="tab.set($any($event).detail.value)">
          <ion-segment-button value="movies"><ion-label>Films</ion-label></ion-segment-button>
          <ion-segment-button value="users"><ion-label>Utilisateurs</ion-label></ion-segment-button>
        </ion-segment>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      @if (tab() === 'movies') {
        <form (ngSubmit)="addMovie()">
          <ion-list inset>
            <ion-list-header><ion-label>Ajouter un film</ion-label></ion-list-header>
            <ion-item><ion-input label="Titre" labelPlacement="floating" name="title" [(ngModel)]="form.title"></ion-input></ion-item>
            <ion-item><ion-input label="Date de sortie" labelPlacement="floating" type="date" name="releaseDate" [(ngModel)]="form.releaseDate"></ion-input></ion-item>
            <ion-item><ion-input label="URL de l'affiche (optionnel)" labelPlacement="floating" type="url" name="posterUrl" [(ngModel)]="form.posterUrl"></ion-input></ion-item>
            <ion-item><ion-textarea label="Résumé" labelPlacement="floating" name="overview" [autoGrow]="true" [(ngModel)]="form.overview"></ion-textarea></ion-item>
          </ion-list>
          <div class="ion-padding-horizontal">
            <ion-button expand="block" type="submit" [disabled]="busy()">
              <ion-icon slot="start" name="add-outline"></ion-icon>Ajouter le film
            </ion-button>
            <ion-button expand="block" fill="outline" type="button" (click)="importTmdb()" [disabled]="busy()">
              @if (busy()) { <ion-spinner name="crescent"></ion-spinner> }
              @else { <ion-icon slot="start" name="cloud-download-outline"></ion-icon>Importer les films populaires TMDB }
            </ion-button>
          </div>
        </form>

        <ion-list inset>
          <ion-list-header><ion-label>Films ajoutés par l'admin ({{ adminMovies().length }})</ion-label></ion-list-header>
          @for (m of adminMovies(); track m.id) {
            <ion-item>
              <ion-label><h3>{{ m.title }}</h3><p>{{ m.releaseDate }}</p></ion-label>
              <ion-button fill="clear" color="danger" slot="end" (click)="deleteMovie(m)" aria-label="Supprimer ce film">
                <ion-icon slot="icon-only" name="trash-outline"></ion-icon>
              </ion-button>
            </ion-item>
          } @empty {
            <ion-item><ion-note>Aucun film ajouté manuellement.</ion-note></ion-item>
          }
          <ion-item><ion-note>Catalogue total : {{ movies().length }} films</ion-note></ion-item>
        </ion-list>
      }

      @if (tab() === 'users') {
        <ion-list inset>
          <ion-list-header><ion-label>{{ users().length }} utilisateurs</ion-label></ion-list-header>
          @for (u of users(); track u.id) {
            <ion-item>
              <ion-avatar slot="start">@if (u.photo) { <img [src]="u.photo" [alt]="u.prenom" /> }</ion-avatar>
              <ion-label>
                <h3>{{ u.prenom }} {{ u.nom }} @if (u.role === 'admin') { <ion-note>(admin)</ion-note> }</h3>
                <p>{{ u.email ?? '' }} · {{ u.favorites.length || 0 }} favoris</p>
              </ion-label>
              <ion-toggle slot="end" [checked]="u.active" [disabled]="u.id === myId"
                          (ionChange)="setActive(u, $any($event).detail.checked)"
                          [attr.aria-label]="(u.active ? 'Désactiver ' : 'Activer ') + u.prenom">
              </ion-toggle>
            </ion-item>
          }
        </ion-list>
        <p class="hint">Un compte désactivé ne peut plus se connecter et disparaît du matching. Il n'est jamais supprimé.</p>
      }
    </ion-content>
  `,
  styles: [`.hint { padding: 0 24px; color: var(--ion-color-medium); font-size: 0.85rem; }`],
})
export class AdminPage {
  private auth = inject(AuthService);
  private movieService = inject(MovieService);
  private userService = inject(UserService);
  private toast = inject(ToastController);
  private alert = inject(AlertController);

  tab = signal<'movies' | 'users'>('movies');
  busy = signal(false);
  myId = this.auth.uid;

  movies = toSignal(this.movieService.movies$, { initialValue: [] as Movie[] });
  users = toSignal(this.userService.users$, { initialValue: [] as UserProfile[] });
  adminMovies = computed(() => this.movies().filter(m => m.source === 'admin'));

  form = { title: '', releaseDate: '', posterUrl: '', overview: '' };

  async addMovie() {
    if (!this.form.title.trim()) return this.notify('Le titre est obligatoire.', 'warning');
    this.busy.set(true);
    try {
      await this.movieService.addMovie({
        title: this.form.title.trim(),
        releaseDate: this.form.releaseDate,
        posterUrl: this.form.posterUrl.trim(),
        overview: this.form.overview.trim(),
      });
      this.form = { title: '', releaseDate: '', posterUrl: '', overview: '' };
      await this.notify('Film ajouté.', 'success');
    } catch (e) {
      await this.notify(this.auth.errorMessage(e), 'danger');
    } finally {
      this.busy.set(false);
    }
  }

  async importTmdb() {
    this.busy.set(true);
    try {
      const n = await this.movieService.importFromTmdb();
      await this.notify(`${n} films importés depuis TMDB.`, 'success');
    } catch (e) {
      await this.notify(this.auth.errorMessage(e), 'danger');
    } finally {
      this.busy.set(false);
    }
  }

  async deleteMovie(m: Movie) {
    const a = await this.alert.create({
      header: 'Supprimer ce film ?',
      message: m.title,
      buttons: [
        { text: 'Annuler', role: 'cancel' },
        { text: 'Supprimer', role: 'destructive', handler: () => this.movieService.deleteMovie(m.id) },
      ],
    });
    await a.present();
  }

  async setActive(u: UserProfile, active: boolean) {
    if (u.active === active) return;
    try {
      await this.userService.setActive(u.id, active);
      await this.notify(`${u.prenom} ${active ? 'réactivé' : 'désactivé'}.`, active ? 'success' : 'medium');
    } catch (e) {
      await this.notify(this.auth.errorMessage(e), 'danger');
    }
  }

  private async notify(message: string, color: string) {
    const t = await this.toast.create({ message, color, duration: 2200 });
    await t.present();
  }
}
