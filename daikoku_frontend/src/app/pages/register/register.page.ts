import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonInput,
  IonButton,
  IonItem,
  IonLabel,
  IonText,
  IonSpinner
} from '@ionic/angular/standalone';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  imports: [
    FormsModule,
    RouterLink,
    IonContent,
    IonInput,
    IonButton,
    IonItem,
    IonLabel,
    IonText,
    IonSpinner
  ],
})
export class RegisterPage implements OnInit {

  username = '';
  email = '';
  password = '';
  password2 = '';
  error = '';
  loading = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.username = '';
    this.email = '';
    this.password = '';
    this.password2 = '';
    this.error = '';
    this.loading = false;
  }

  register() {
    this.error = '';

    if (!this.username.trim()) {
      this.error = 'Debes ingresar un nombre de usuario.';
      return;
    }

    if (!this.email.trim()) {
      this.error = 'Debes ingresar un correo electrónico.';
      return;
    }

    if (!this.password) {
      this.error = 'Debes ingresar una contraseña.';
      return;
    }

    if (!this.password2) {
      this.error = 'Debes confirmar la contraseña.';
      return;
    }

    if (this.password !== this.password2) {
      this.error = 'Las contraseñas no coinciden.';
      return;
    }

    this.loading = true;

    this.authService.register(
      this.username,
      this.email,
      this.password,
      this.password2
    ).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.loading = false;

        console.log('ERROR COMPLETO:', err);
        console.log('ERROR BACKEND:', err.error);

        const errores = this.obtenerErroresBackend(err.error);

        this.error = errores.length > 0
          ? errores.map(error => this.traducirError(error)).join(' ')
          : 'Error al registrarse.';
      }
    });
  }

  obtenerErroresBackend(errorBackend: any): string[] {
    const errores: string[] = [];

    if (!errorBackend) {
      return errores;
    }

    if (typeof errorBackend === 'string') {
      errores.push(errorBackend);
      return errores;
    }

    if (Array.isArray(errorBackend)) {
      errorBackend.forEach(error => {
        errores.push(String(error));
      });

      return errores;
    }

    Object.keys(errorBackend).forEach(campo => {
      const valor = errorBackend[campo];

      if (Array.isArray(valor)) {
        valor.forEach(error => {
          errores.push(String(error));
        });
      } else if (typeof valor === 'string') {
        errores.push(valor);
      } else if (valor !== null && valor !== undefined) {
        errores.push(String(valor));
      }
    });

    return errores;
  }

  traducirError(msg: any): string {
    const texto = String(msg).trim().toLowerCase();

    if (
      texto.includes('this password is too short') ||
      texto.includes('too short') ||
      texto.includes('at least 8 characters') ||
      texto.includes('8 characters')
    ) {
      return 'La contraseña debe tener al menos 8 caracteres.';
    }

    if (texto.includes('too common')) {
      return 'La contraseña es demasiado común. Usa una contraseña más segura.';
    }

    if (texto.includes('entirely numeric')) {
      return 'La contraseña no puede ser solo números.';
    }

    if (
      texto.includes('similar to the username') ||
      texto.includes('too similar')
    ) {
      return 'La contraseña es muy similar al nombre de usuario.';
    }

    if (
      texto.includes('username already exists') ||
      texto.includes('user with that username already exists') ||
      texto.includes('user with this username already exists')
    ) {
      return 'Este nombre de usuario ya está en uso.';
    }

    if (
      texto.includes('email already exists') ||
      texto.includes('user with this email already exists')
    ) {
      return 'Este correo electrónico ya está registrado.';
    }

    if (
      texto.includes('enter a valid email address') ||
      texto.includes('valid email')
    ) {
      return 'Ingresa un correo electrónico válido.';
    }

    if (
      texto.includes('password fields') &&
      texto.includes('match')
    ) {
      return 'Las contraseñas no coinciden.';
    }

    if (
      texto.includes('this field may not be blank') ||
      texto.includes('may not be blank')
    ) {
      return 'Este campo no puede estar vacío.';
    }

    if (
      texto.includes('this field is required') ||
      texto.includes('required')
    ) {
      return 'Este campo es obligatorio.';
    }

    return 'No se pudo completar el registro. Revisa los datos ingresados.';
  }
}