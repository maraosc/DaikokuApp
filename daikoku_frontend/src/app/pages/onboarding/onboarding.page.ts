import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  IonContent, IonInput, IonButton, IonItem,
  IonLabel, IonText, IonSpinner
} from '@ionic/angular/standalone';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-onboarding',
  templateUrl: './onboarding.page.html',
  imports: [
    FormsModule,
    IonContent, IonInput, IonButton, IonItem,
    IonLabel, IonText, IonSpinner
  ],
})
export class OnboardingPage implements OnInit {

  // Control de pasos
  step = 1;

  // Paso 1 — presupuesto
  monthlyBudget: number | null = null;

  // Paso 2 — meta
  goalName        = '';
  goalAmount: number | null = null;
  goalDeadline    = '';

  error   = '';
  loading = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.step          = 1;
    this.monthlyBudget = null;
    this.goalName      = '';
    this.goalAmount    = null;
    this.goalDeadline  = '';
    this.error         = '';
    this.loading       = false;
  }

  // Paso 1 → guardar presupuesto y avanzar al paso 2
  continuarPresupuesto() {
    if (!this.monthlyBudget || this.monthlyBudget <= 0) {
      this.error = 'Ingresa un presupuesto mensual válido.';
      return;
    }

    this.error   = '';
    this.loading = true;

    this.authService.completeOnboarding(this.monthlyBudget).subscribe({
      next: () => {
        this.loading = false;
        this.step = 2;
      },
      error: () => {
        this.loading = false;
        this.error = 'Error al guardar el presupuesto.';
      }
    });
  }

  // Paso 2 → crear meta y ir al home
  crearMeta() {
    if (!this.goalName || !this.goalAmount || this.goalAmount <= 0) {
      this.error = 'Completa el nombre y el monto de la meta.';
      return;
    }

    this.error   = '';
    this.loading = true;

    this.authService.createGoal(
      this.goalName,
      this.goalAmount,
      this.goalDeadline || undefined
    ).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/home']);
      },
      error: () => {
        this.loading = false;
        this.error = 'Error al crear la meta.';
      }
    });
  }

  // Paso 2 → omitir meta e ir al home
  omitirMeta() {
    this.router.navigate(['/home']);
  }
}