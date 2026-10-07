import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonInput, IonButton, IonText, IonSpinner,
  IonIcon, IonButtons, IonBackButton,
} from '@ionic/angular';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonInput, IonButton,
            IonText, IonSpinner, IonIcon, IonButtons, IonBackButton],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start"><ion-back-button defaultHref="/login"></ion-back-button></ion-buttons>
        <ion-title>Inscription</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div class="wrap">
        <button type="button" class="avatar" (click)="takePhoto()" [attr.aria-label]="photo() ? 'Reprendre la photo' : 'Prendre une photo'">
          @if (photo()) { <img [src]="photo()" alt="Votre photo" /> }
          @else { <ion-icon name="camera-outline"></ion-icon><span>Prendre une photo</span> }
        </button>

        <form (ngSubmit)="submit()">
          <ion-list inset>
            <ion-item><ion-input label="Nom" labelPlacement="floating" name="nom" [(ngModel)]="nom"></ion-input></ion-item>
            <ion-item><ion-input label="Prénom" labelPlacement="floating" name="prenom" [(ngModel)]="prenom"></ion-input></ion-item>
            <ion-item><ion-input label="Âge" labelPlacement="floating" type="number" name="age" min="1" max="120" [(ngModel)]="age"></ion-input></ion-item>
            <ion-item><ion-input label="Email" labelPlacement="floating" type="email" name="email" autocomplete="email" [(ngModel)]="email"></ion-input></ion-item>
            <ion-item><ion-input label="Mot de passe (6 caractères min.)" labelPlacement="floating" type="password" name="password" autocomplete="new-password" [(ngModel)]="password"></ion-input></ion-item>
          </ion-list>

          @if (error()) {
            <ion-text color="danger"><p class="msg">{{ error() }}</p></ion-text>
          }

          <ion-button expand="block" type="submit" [disabled]="loading()">
            @if (loading()) { <ion-spinner name="crescent"></ion-spinner> } @else { Créer mon compte }
          </ion-button>
        </form>

        <ion-button expand="block" fill="clear" routerLink="/login">J'ai déjà un compte</ion-button>
      </div>
    </ion-content>
  `,
  styles: [`
    .wrap { max-width: 480px; margin: 0 auto; }
    .avatar {
      display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px;
      width: 128px; height: 128px; margin: 8px auto 16px; border-radius: 50%; overflow: hidden;
      border: 2px dashed var(--ion-color-primary); background: transparent; color: var(--ion-color-primary);
      font: inherit; font-size: 0.8rem; cursor: pointer;
    }
    .avatar:focus-visible { outline: 3px solid var(--ion-color-primary); outline-offset: 3px; }
    .avatar ion-icon { font-size: 2rem; }
    .avatar img { width: 100%; height: 100%; object-fit: cover; }
    .msg { padding: 0 16px; }
  `],
})
export class RegisterPage {
  private auth = inject(AuthService);
  private router = inject(Router);

  nom = '';
  prenom = '';
  age: number | null = null;
  email = '';
  password = '';
  photo = signal('');
  loading = signal(false);
  error = signal('');

  async takePhoto() {
    this.error.set('');
    try {
      const img = await Camera.getPhoto({
        quality: 50,
        width: 300,
        height: 300,
        correctOrientation: true,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
      });
      this.photo.set(img.dataUrl ?? '');
    } catch (e: any) {
      const msg = String(e?.message ?? '');
      if (!/cancel/i.test(msg)) this.error.set('Caméra indisponible : ' + msg);
    }
  }

  private validate(): string | null {
    if (!this.photo()) return 'Prenez une photo avec la caméra.';
    if (!this.nom.trim() || !this.prenom.trim()) return 'Nom et prénom sont obligatoires.';
    const age = Number(this.age);
    if (!Number.isInteger(age) || age < 1 || age > 120) return 'Âge invalide.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email.trim())) return 'Adresse email invalide.';
    if (this.password.length < 6) return 'Mot de passe : 6 caractères minimum.';
    return null;
  }

  async submit() {
    const err = this.validate();
    this.error.set(err ?? '');
    if (err) return;
    this.loading.set(true);
    try {
      await this.auth.register({
        nom: this.nom, prenom: this.prenom, age: Number(this.age),
        email: this.email, password: this.password, photo: this.photo(),
      });
      await this.router.navigateByUrl('/tabs/movies', { replaceUrl: true });
    } catch (e) {
      this.error.set(this.auth.errorMessage(e));
    } finally {
      this.loading.set(false);
    }
  }
}