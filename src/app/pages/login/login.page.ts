import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonInput, IonButton, IonText, IonSpinner,
} from '@ionic/angular';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonInput, IonButton, IonText, IonSpinner],
  template: `
    <ion-header>
      <ion-toolbar><ion-title>Connexion</ion-title></ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div class="wrap">
        <h1 class="brand">MovieMatch</h1>
        <p class="tagline">Vos films préférés, et les gens qui les aiment aussi.</p>

        <form (ngSubmit)="submit()">
          <ion-list inset>
            <ion-item>
              <ion-input label="Email" labelPlacement="floating" type="email" name="email"
                         autocomplete="email" [(ngModel)]="email"></ion-input>
            </ion-item>
            <ion-item>
              <ion-input label="Mot de passe" labelPlacement="floating" type="password" name="password"
                         autocomplete="current-password" [(ngModel)]="password"></ion-input>
            </ion-item>
          </ion-list>

          @if (error()) {
            <ion-text color="danger"><p class="msg">{{ error() }}</p></ion-text>
          }

          <ion-button expand="block" type="submit" [disabled]="loading()">
            @if (loading()) { <ion-spinner name="crescent"></ion-spinner> } @else { Se connecter }
          </ion-button>
        </form>

        <ion-button expand="block" fill="clear" routerLink="/register">Créer un compte</ion-button>
      </div>
    </ion-content>
  `,
  styles: [`
    .wrap { max-width: 480px; margin: 0 auto; }
    .brand { font-size: 2.2rem; font-weight: 800; letter-spacing: -0.02em; margin: 24px 0 4px; }
    .tagline { color: var(--ion-color-medium); margin: 0 0 16px; }
    .msg { padding: 0 16px; }
  `],
})
export class LoginPage {
  private auth = inject(AuthService);
  private router = inject(Router);

  email = '';
  password = '';
  loading = signal(false);
  error = signal('');

  async submit() {
    this.error.set('');
    if (!this.email.trim() || !this.password) {
      this.error.set('Renseignez l\'email et le mot de passe.');
      return;
    }
    this.loading.set(true);
    try {
      await this.auth.login(this.email, this.password);
      await this.router.navigateByUrl('/tabs/movies', { replaceUrl: true });
    } catch (e) {
      this.error.set(this.auth.errorMessage(e));
    } finally {
      this.loading.set(false);
    }
  }
}