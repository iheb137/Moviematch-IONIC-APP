import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, IonNote, IonButton, IonIcon,
} from '@ionic/angular';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, IonNote, IonButton, IonIcon],
  template: `
    <ion-header>
      <ion-toolbar><ion-title>Profil</ion-title></ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      @if (profile(); as p) {
        <div class="head">
          @if (p.photo) { <img class="photo" [src]="p.photo" alt="Photo de profil" /> }
          <h1>{{ p.prenom }} {{ p.nom }}</h1>
        </div>
        <ion-list inset>
          <ion-item><ion-label>Âge</ion-label><ion-note slot="end">{{ p.age }} ans</ion-note></ion-item>
          <ion-item><ion-label>Email</ion-label><ion-note slot="end">{{ p.email ?? '—' }}</ion-note></ion-item>
          <ion-item><ion-label>Rôle</ion-label><ion-note slot="end">{{ p.role === 'admin' ? 'Administrateur' : 'Utilisateur' }}</ion-note></ion-item>
          <ion-item><ion-label>Films dans ma playlist</ion-label><ion-note slot="end">{{ p.favorites.length }}</ion-note></ion-item>
        </ion-list>
      }
      <ion-button expand="block" color="medium" fill="outline" (click)="logout()">
        <ion-icon slot="start" name="log-out-outline"></ion-icon>Se déconnecter
      </ion-button>
    </ion-content>
  `,
  styles: [`
    .head { text-align: center; margin: 16px 0; }
    .photo { width: 120px; height: 120px; border-radius: 50%; object-fit: cover; border: 3px solid var(--ion-color-primary); }
    h1 { margin: 12px 0 0; font-size: 1.5rem; font-weight: 700; }
  `],
})
export class ProfilePage {
  private auth = inject(AuthService);
  profile = toSignal(this.auth.profile$, { initialValue: null });
  logout() { return this.auth.logout(); }
}
