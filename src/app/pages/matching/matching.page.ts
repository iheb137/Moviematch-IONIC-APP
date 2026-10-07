import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonAvatar, IonLabel, IonBadge, IonSpinner,
} from '@ionic/angular';
import { AuthService } from '../../services/auth.service';
import { MovieService } from '../../services/movie.service';
import { UserService } from '../../services/user.service';
import { MATCH_THRESHOLD, computeMatches } from '../../matching';

@Component({
  selector: 'app-matching',
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonAvatar, IonLabel, IonBadge, IonSpinner],
  template: `
    <ion-header>
      <ion-toolbar><ion-title>Matching</ion-title></ion-toolbar>
    </ion-header>

    <ion-content>
      <p class="intro">
        Utilisateurs dont la playlist correspond à la vôtre à plus de {{ threshold }} %
        (films en commun ÷ films distincts des deux listes).
      </p>

      @if (matches() === undefined) {
        <div class="center"><ion-spinner></ion-spinner></div>
      } @else if (myCount() === 0) {
        <div class="center"><p>Ajoutez des films à votre playlist pour trouver des correspondances.</p></div>
      } @else {
        <ion-list>
          @for (m of matches()!; track m.user.id) {
            <ion-item lines="full">
              <ion-avatar slot="start">
                @if (m.user.photo) { <img [src]="m.user.photo" [alt]="m.user.prenom" /> }
              </ion-avatar>
              <ion-label>
                <h2>{{ m.user.prenom }} {{ m.user.nom }}, {{ m.user.age }} ans</h2>
                <p>{{ m.common.length }} film(s) en commun : {{ titles(m.common) }}</p>
              </ion-label>
              <ion-badge slot="end" color="success">{{ m.score }} %</ion-badge>
            </ion-item>
          } @empty {
            <div class="center"><p>Personne ne dépasse encore {{ threshold }} % de correspondance avec vous.</p></div>
          }
        </ion-list>
      }
    </ion-content>
  `,
  styles: [`
    .intro { padding: 12px 16px 0; margin: 0; color: var(--ion-color-medium); font-size: 0.9rem; }
    .center { display: flex; justify-content: center; padding: 48px 24px; text-align: center; color: var(--ion-color-medium); }
    ion-badge { font-size: 0.95rem; padding: 6px 10px; }
  `],
})
export class MatchingPage {
  threshold = MATCH_THRESHOLD;

  private profile = toSignal(inject(AuthService).profile$, { initialValue: null });
  private users = toSignal(inject(UserService).users$);
  private movies = toSignal(inject(MovieService).movies$, { initialValue: [] });

  private titleById = computed(() => new Map(this.movies().map(m => [m.id, m.title])));
  myCount = computed(() => this.profile()?.favorites?.length ?? 0);

  matches = computed(() => {
    const me = this.profile();
    const users = this.users();
    return me && users ? computeMatches(me, users) : undefined;
  });

  titles(ids: string[]): string {
    const map = this.titleById();
    return ids.map(id => map.get(id) ?? id).join(', ');
  }
}
