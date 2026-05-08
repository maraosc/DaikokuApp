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

  private traducirError(texto: string): string {
    const t = texto.toLowerCase();
    if (t.includes('too short') || t.includes('8 characters'))
      return 'La contraseña debe tener al menos 8 caracteres.';
    if (t.includes('too common'))
      return 'La contraseña es demasiado común. Usa una más segura.';
    if (t.includes('entirely numeric'))
      return 'La contraseña no puede contener solo números.';
    if (t.includes('too similar'))
      return 'La contraseña es muy similar a tu nombre de usuario.';
    if (t.includes('incorrect'))
      return 'La contraseña actual es incorrecta.';
    return texto;
  }

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

        const msg =
          err.error?.old_password?.[0] ||
          err.error?.new_password?.[0] ||
          '';

        this.error = msg
          ? this.traducirError(msg)
          : 'No se pudo cambiar la contraseña.';
      }
    });
  }
}