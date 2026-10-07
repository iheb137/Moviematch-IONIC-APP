import { Component } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  addOutline, cameraOutline, cloudDownloadOutline, filmOutline, heart, heartOutline, logOutOutline,
  peopleOutline, personCircleOutline, shieldCheckmarkOutline, trashOutline,
} from 'ionicons/icons';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [IonApp, IonRouterOutlet],
  template: `<ion-app><ion-router-outlet></ion-router-outlet></ion-app>`,
})
export class AppComponent {
  constructor() {
    addIcons({
      addOutline, cameraOutline, cloudDownloadOutline, filmOutline, heart, heartOutline, logOutOutline,
      peopleOutline, personCircleOutline, shieldCheckmarkOutline, trashOutline,
    });
  }
}
