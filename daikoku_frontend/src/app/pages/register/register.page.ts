import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  IonContent, IonInput, IonButton, IonItem,
  IonLabel, IonText, IonSpinner
} from '@ionic/angular/standalone';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  imports: [
    FormsModule,
    RouterLink,
    IonContent, IonInput, IonButton, IonItem,
    IonLabel, IonText, IonSpinner
  ],
})
export class RegisterPage implements OnInit {

  username  = '';
  email     = '';
  password  = '';
  password2 = '';
  error     = '';
  loading   = false;

  ngOnInit() {
    this.username  = '';
    this.email     = '';
    this.password  = '';
    this.password2 = '';
    this.error     = '';
    this.loading   = false;
  }

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

register() {
  this.error = '';

  if (this.password !== this.password2) {
    this.error = 'Las contraseñas no coinciden.';
    return;
  }

  this.loading = true;

  this.authService.register(this.username, this.email, this.password, this.password2).subscribe({
        next: () => {
          this.loading = false;
          this.router.navigate(['/login']);
        },
    error: (err) => {
      this.loading = false;
      const e = err.error;
      const raw =
        e?.email?.[0] ||
        e?.username?.[0] ||
        e?.password?.[0] ||
        e?.non_field_errors?.[0] ||
        'Error al registrarse.';
      this.error = this.traducirError(raw);
    }
  });
}

  traducirError(msg: string): string {
  const traducciones: { [key: string]: string } = {
    'This password is too short. It must contain at least 8 characters.': 'La contraseña debe tener al menos 8 caracteres.',
    'This password is too common.': 'La contraseña debe tener al menos una mayuscula, una minuscula y un numero.',
    'This password is entirely numeric.': 'La contraseña no puede ser solo números.',
    'A user with that username already exists.': 'Este nombre de usuario ya está en uso.',
    'Enter a valid email address.': 'Ingresa un correo electrónico válido.',
  };

  return traducciones[msg] || msg;
}

}