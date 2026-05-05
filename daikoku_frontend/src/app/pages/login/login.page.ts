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
  styleUrls: ['./login.page.scss'],
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
  localStorage.clear();

  this.error = '';
  this.loading = true;

  this.authService.login(this.email, this.password).subscribe({
    next: () => {
      this.authService.getUserFromBackend().subscribe({
        next: (user: any) => {
          localStorage.setItem('user', JSON.stringify(user));

          this.loading = false;

          if (user.full_register) {
            this.router.navigate(['/home']);
          } else {
            this.router.navigate(['/onboarding']);
          }
        },
        error: () => {
          this.loading = false;
          this.router.navigate(['/onboarding']);
        }
      });
    },

    error: (err) => {
      this.loading = false;

      this.error =
        err.error?.detail ||
        err.error?.email?.[0] ||
        err.error?.password?.[0] ||
        err.error?.non_field_errors?.[0] ||
        'Email o contraseña incorrectos.';
    }
  });
}

    ionViewWillEnter() {
      this.email = '';
      this.password = '';
      this.error = '';
      this.loading = false;
}
}