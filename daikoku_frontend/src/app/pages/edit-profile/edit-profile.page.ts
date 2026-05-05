import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonButtons, IonBackButton, IonButton,
  IonInput, IonItem, IonLabel, IonText, IonSpinner
} from '@ionic/angular/standalone';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-edit-profile',
  templateUrl: './edit-profile.page.html',
  styleUrls: ['./edit-profile.page.scss'],
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
export class EditProfilePage implements OnInit {

  username = '';
  email = '';

  error = '';
  success = false;
  loading = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    const user = this.authService.getUser();

    this.username = user?.username || '';
    this.email = user?.email || '';
  }

  guardar() {
    this.error = '';
    this.success = false;

    if (!this.username.trim()) {
      this.error = 'Ingresa un nombre de usuario.';
      return;
    }

    if (!this.email.trim()) {
      this.error = 'Ingresa un correo.';
      return;
    }

    this.loading = true;

    this.authService.updateProfile(this.username.trim(), this.email.trim()).subscribe({
      next: (user: any) => {
        this.loading = false;
        this.success = true;

        localStorage.setItem('user', JSON.stringify(user));

        setTimeout(() => {
          this.router.navigate(['/perfil']);
        }, 800);
      },
      error: (err) => {
        this.loading = false;

        this.error =
          err.error?.username?.[0] ||
          err.error?.email?.[0] ||
          'No se pudo actualizar el perfil.';
      }
    });
  }
}
