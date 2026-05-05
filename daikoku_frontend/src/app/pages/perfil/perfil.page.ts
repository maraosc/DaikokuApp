import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonButtons, IonBackButton, IonButton, IonIcon, IonInput
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { personOutline } from 'ionicons/icons';
import { AuthService } from '../../services/auth';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.page.html',
  styleUrls: ['./perfil.page.scss'],
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonBackButton,
    IonButton,
    IonIcon,
    IonInput,
    FormsModule
  ],
})
export class PerfilPage implements OnInit {

  user: any = null;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    addIcons({ personOutline });
  }

  ngOnInit() {
    this.cargarUsuario();
  }

  ionViewWillEnter() {
    this.cargarUsuario();
  }

  cargarUsuario() {
    this.authService.getUserFromBackend().subscribe({
      next: user => {
        this.user = user;
        localStorage.setItem('user', JSON.stringify(user));
      },
      error: () => {
        this.user = this.authService.getUser();
      }
    });
    
  }

  irEditarPerfil() {
    this.router.navigate(['/edit-profile']);
  }

  irCambiarPassword() {
  this.router.navigate(['/change-password']);
  }

  logout() {
    this.authService.logout();
    this.router.navigateByUrl('/login', { replaceUrl: true });
  }
}
