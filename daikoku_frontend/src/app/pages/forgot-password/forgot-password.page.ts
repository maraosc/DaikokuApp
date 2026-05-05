import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonContent, IonInput, IonButton,
  IonItem, IonLabel, IonText, IonSpinner,
  IonHeader, IonToolbar, IonTitle,
  IonButtons, IonBackButton
} from '@ionic/angular/standalone';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.page.html',
  styleUrls: ['./forgot-password.page.scss'],
  imports: [
    FormsModule,
    IonContent,
    IonInput,
    IonButton,
    IonItem,
    IonLabel,
    IonText,
    IonSpinner,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton
  ]
})
export class ForgotPasswordPage {

  email = '';
  error = '';
  success = false;
  loading = false;

  constructor(private authService: AuthService) {}

  enviar() {
    this.error = '';
    this.success = false;

    if (!this.email) {
      this.error = 'Ingresa tu correo.';
      return;
    }

    this.loading = true;

    this.authService.forgotPassword(this.email).subscribe({
      next: () => {
        this.loading = false;
        this.success = true;
      },
      error: () => {
        this.loading = false;
        this.error = 'No se pudo enviar el correo.';
      }
    });
  }
}