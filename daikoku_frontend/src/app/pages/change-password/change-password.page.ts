import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonButtons, IonBackButton, IonButton,
  IonInput, IonItem, IonLabel, IonText, IonSpinner
} from '@ionic/angular/standalone';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-change-password',
  templateUrl: './change-password.page.html',
  styleUrls: ['./change-password.page.scss'],
  imports: [
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonBackButton,
    IonButton,
    IonInput,
    IonItem,
    IonLabel,
    IonText,
    IonSpinner
  ],
})
export class ChangePasswordPage {

  oldPassword = '';
  newPassword = '';
  newPassword2 = '';

  error = '';
  success = false;
  loading = false;

  constructor(private authService: AuthService, private router: Router) {}

  cambiar() {
    this.error = '';
    this.success = false;

    if (!this.oldPassword || !this.newPassword || !this.newPassword2) {
      this.error = 'Completa todos los campos.';
      return;
    }

    if (this.newPassword !== this.newPassword2) {
      this.error = 'Las contraseñas no coinciden.';
      return;
    }

    this.loading = true;

    this.authService.changePassword(
      this.oldPassword,
      this.newPassword
    ).subscribe({
      next: () => {
        this.loading = false;
        this.success = true;

        setTimeout(() => {
          this.router.navigate(['/perfil']);
        }, 800);
      },
      error: (err) => {
        this.loading = false;

        this.error =
          err.error?.old_password?.[0] ||
          err.error?.new_password?.[0] ||
          'No se pudo cambiar la contraseña.';
      }
    });
  }
}
