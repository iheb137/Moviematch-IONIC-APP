import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel } from '@ionic/angular';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-tabs',
  standalone: true,
  imports: [IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel],
  template: `
    <ion-tabs>
      <ion-tab-bar slot="bottom">
        <ion-tab-button tab="movies"><ion-icon name="film-outline"></ion-icon><ion-label>Films</ion-label></ion-tab-button>
        <ion-tab-button tab="favorites"><ion-icon name="heart-outline"></ion-icon><ion-label>Playlist</ion-label></ion-tab-button>
        <ion-tab-button tab="matching"><ion-icon name="people-outline"></ion-icon><ion-label>Matching</ion-label></ion-tab-button>
        <ion-tab-button tab="profile"><ion-icon name="person-circle-outline"></ion-icon><ion-label>Profil</ion-label></ion-tab-button>
        @if (isAdmin()) {
          <ion-tab-button tab="admin"><ion-icon name="shield-checkmark-outline"></ion-icon><ion-label>Admin</ion-label></ion-tab-button>
        }
      </ion-tab-bar>
    </ion-tabs>
  `,
})
export class TabsPage {
  private profile = toSignal(inject(AuthService).profile$, { initialValue: null });
  isAdmin = computed(() => this.profile()?.role === 'admin');
}
