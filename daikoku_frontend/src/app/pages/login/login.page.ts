import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  IonContent, IonInput, IonButton, IonItem,
  IonLabel, IonText, IonSpinner
} from '@ionic/angular/standalone';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  imports: [
    FormsModule,
    IonContent, IonInput, IonButton, IonItem,
    IonLabel, IonText, IonSpinner, RouterLink
  ],
})
export class LoginPage {

  email    = '';
  password = '';
  error    = '';
  loading  = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  login() {
    this.error   = '';
    this.loading = true;

    this.authService.login(this.email, this.password).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/home']);
      },
      error: () => {
        this.loading = false;
        this.error = 'Email o contraseña incorrectos.';
      }
    });
  }
}