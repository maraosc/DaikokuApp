import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CurrencyPipe } from '@angular/common';
import {
  IonContent, IonInput, IonButton, IonItem,
  IonLabel, IonText, IonSpinner, IonIcon
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addOutline, trashOutline } from 'ionicons/icons';
import { AuthService } from '../../services/auth';
import { of } from 'rxjs';

interface Ingreso {
  nombre: string;
  monto: number;
}

@Component({
  selector: 'app-onboarding',
  templateUrl: './onboarding.page.html',
  imports: [
    FormsModule,
    CurrencyPipe,
    IonContent, IonInput, IonButton, IonItem,
    IonLabel, IonText, IonSpinner, IonIcon
  ],
})
export class OnboardingPage implements OnInit {

  step = 0;

  // Paso 0 — ingresos
  ingresos: Ingreso[]            = [];
  nuevoIngresoNombre             = '';
  nuevoIngresoMonto: number | null = null;

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
  ) {
    addIcons({ addOutline, trashOutline });
  }

  ngOnInit() {
    this.step               = 0;
    this.ingresos           = [];
    this.nuevoIngresoNombre = '';
    this.nuevoIngresoMonto  = null;
    this.monthlyBudget      = null;
    this.goalName           = '';
    this.goalAmount         = null;
    this.goalDeadline       = '';
    this.error              = '';
    this.loading            = false;
  }

  // ── Paso 0: Ingresos ──────────────────────────────────────────────

  get totalIngresos(): number {
    return this.ingresos.reduce((sum, i) => sum + i.monto, 0);
  }

  agregarIngreso() {
    const nombre = this.nuevoIngresoNombre.trim();
    const monto  = this.nuevoIngresoMonto;

    if (!nombre) {
      this.error = 'Ingresa un nombre para la fuente de ingreso.';
      return;
    }
    if (!monto || monto <= 0) {
      this.error = 'Ingresa un monto válido.';
      return;
    }

    this.ingresos.push({ nombre, monto });
    this.nuevoIngresoNombre = '';
    this.nuevoIngresoMonto  = null;
    this.error              = '';
  }

  eliminarIngreso(index: number) {
    this.ingresos.splice(index, 1);
  }

  // Con al menos un ingreso cargado → guardar y continuar
  continuarIngresos() {
    if (this.ingresos.length === 0) {
      this.error = 'Añade al menos un ingreso o usa "Omitir".';
      return;
    }
    this.guardarIngresos();
  }

  // Sin ingresos → saltar directamente al paso 1
  omitirIngresos() {
    this.step  = 1;
    this.error = '';
  }

  private guardarIngresos() {
    this.error   = '';
    this.loading = true;

    this.authService.saveIngresos(this.ingresos).subscribe({
      next: () => {
        this.loading = false;
        this.step    = 1;
      },
      error: () => {
        this.loading = false;
        this.error   = 'Error al guardar los ingresos.';
      }
    });
  }

  // ── Paso 1: Presupuesto ───────────────────────────────────────────

  usarTotalComoPresupuesto() {
    this.monthlyBudget = this.totalIngresos;
  }

  // Con presupuesto ingresado → guardar y continuar
  continuarPresupuesto() {
    if (!this.monthlyBudget || this.monthlyBudget <= 0) {
      this.error = 'Ingresa un presupuesto válido o usa "Omitir".';
      return;
    }

    this.error   = '';
    this.loading = true;

    this.authService.completeOnboarding(this.monthlyBudget).subscribe({
      next: () => {
        this.loading = false;
        this.step    = 2;
      },
      error: () => {
        this.loading = false;
        this.error   = 'Error al guardar el presupuesto.';
      }
    });
  }

  // Sin presupuesto → saltar al paso 2
  omitirPresupuesto() {
    this.step  = 2;
    this.error = '';
  }

  // ── Paso 2: Meta ──────────────────────────────────────────────────

  // Con datos completos → guardar y ir al home
  crearMeta() {
    if (!this.goalName.trim() || !this.goalAmount || this.goalAmount <= 0) {
      this.error = 'Completa el nombre y el monto de la meta o usa "Omitir".';
      return;
    }

    this.error   = '';
    this.loading = true;

    this.authService.createGoal(
      this.goalName.trim(),
      this.goalAmount,
      this.goalDeadline || undefined
    ).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/home']);
      },
      error: () => {
        this.loading = false;
        this.error   = 'Error al crear la meta.';
      }
    });
  }

  // Sin meta → ir al home directamente
  omitirMeta() {
    this.router.navigate(['/home']);
  }
}