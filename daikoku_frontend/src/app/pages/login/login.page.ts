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

  private readonly CLIENT_ID = '505769461708-ig4rvbm5c6mtu53bfickqb9ok9mq1l7b.apps.googleusercontent.com';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ionViewDidEnter() {
    const maxIntentos = 50;
    let intentos = 0;

    const interval = setInterval(() => {
      intentos++;
      const btn = document.getElementById('google-btn');
      const g = (window as any)['google'];

      if (g && btn) {
        clearInterval(interval);
        g.accounts.id.initialize({
          client_id: this.CLIENT_ID,
          callback: (response: any) => this.handleGoogleLogin(response)
        });
       g.accounts.id.renderButton(btn, {
  theme: 'outline',
  size: 'large',
  width: 280,
  locale: 'es'
});
      } else if (intentos >= maxIntentos) {
        clearInterval(interval);
        console.error('Google Sign-In no cargó a tiempo.');
      }
    }, 100);
  }

  handleGoogleLogin(response: any) {
    this.error = '';
    this.loading = true;

    this.authService.googleLogin(response.credential).subscribe({
      next: (res: any) => {
        this.loading = false;
        if (!res.user.full_register) {
          this.router.navigate(['/onboarding']);
        } else {
          this.router.navigate(['/home']);
        }
      },
      error: () => {
        this.loading = false;
        this.error = 'No se pudo iniciar sesión con Google.';
      }
    });
  }

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
    this.email    = '';
    this.password = '';
    this.error    = '';
    this.loading  = false;
  }
}