import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CurrencyPipe } from '@angular/common';
import {
  IonContent, IonInput, IonButton, IonItem,
  IonLabel, IonText, IonSpinner, IonIcon, IonSelect,
IonSelectOption
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addOutline, trashOutline } from 'ionicons/icons';
import { AuthService } from '../../services/auth';
import { of } from 'rxjs';
import { CommonModule } from '@angular/common';

interface Ingreso {
  nombre: string;
  monto: number;
  categoria: number;
  categoriaNombre?: string;
}

@Component({
  selector: 'app-onboarding',
  templateUrl: './onboarding.page.html',
  styleUrls: ['./onboarding.page.scss'],
  imports: [
    FormsModule,
    CurrencyPipe,
    IonContent, IonInput, IonButton, IonItem,
    IonLabel, IonText, IonSpinner, IonIcon, CommonModule, IonSelect, IonSelectOption
  ],
})
export class OnboardingPage implements OnInit {

  step = 0;

  // Paso 0 — ingresos
  ingresos: Ingreso[]            = [];
  nuevoIngresoNombre             = '';
  nuevoIngresoMonto: number | null = null;
  categorias: any[] = [];
  nuevoIngresoCategoria: number | null = null;
  nuevaCategoriaNombre = '';

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
    this.cargarCategorias();
  }

  // ── Paso 0: Ingresos ──────────────────────────────────────────────

  get totalIngresos(): number {
    return this.ingresos.reduce((sum, i) => sum + i.monto, 0);
  }

  agregarIngreso() {
    const nombre = this.nuevoIngresoNombre.trim();
    const monto  = this.nuevoIngresoMonto;
    const categoriaNombre = this.nuevaCategoriaNombre.trim();

    if (!nombre) {
      this.error = 'Ingresa un nombre para la fuente de ingreso.';
      return;
    }
    if (!monto || monto <= 0) {
      this.error = 'Ingresa un monto válido.';
      return;
    }

    if (!categoriaNombre) {
    this.error = 'Ingresa una categoría para el ingreso.';
    return;
    }

    this.loading = true;

  this.authService.createCategory(categoriaNombre, 'cash-outline').subscribe({
    next: (cat: any) => {
      this.ingresos.push({
        nombre,
        monto,
        categoria: cat.id,
        categoriaNombre: cat.category_name
      });

      this.nuevoIngresoNombre = '';
      this.nuevoIngresoMonto = null;
      this.nuevaCategoriaNombre = '';
      this.error = '';
      this.loading = false;
    },
    error: () => {
      this.loading = false;
      this.error = 'No se pudo crear la categoría.';
    }
  });
}

  eliminarIngreso(index: number) {
    this.ingresos.splice(index, 1);
  }

   cargarCategorias() {
    this.authService.getCategories().subscribe({
      next: (data: any[]) => {
        this.categorias = data;
      },
      error: () => {
        this.error = 'No se pudieron cargar las categorías.';
      }
    });
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
  this.error = '';
  this.loading = true;

  this.authService.completeOnboarding(0).subscribe({
    next: () => {
      this.loading = false;
      this.step = 2;
    },
    error: () => {
      this.loading = false;
      this.error = 'Error al completar el registro.';
    }
  });
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
      this.authService.completeOnboarding(this.monthlyBudget || 0).subscribe({
        next: () => {
          this.loading = false;
          this.router.navigate(['/home']);
        },
        error: () => {
          this.loading = false;
          this.error = 'Error al completar el registro.';
        }
  });
},
    });
  }

  // Sin meta → ir al home directamente
  omitirMeta() {
    this.router.navigate(['/home']);
  }

  // Formatear monto
    formatearMonto(event: any) {

      let valor = event.target.value;

      // eliminar todo lo que no sea número
      valor = valor.replace(/\D/g, '');

      // convertir a número
      const numero = parseInt(valor || '0', 10);

      // guardar valor limpio
      this.nuevoIngresoMonto = numero;

      // formatear con puntos
      event.target.value = numero.toLocaleString('es-CL');

    }
// Formatear presupuesto
    formatearPresupuesto(event: CustomEvent) {

      const valor = String(event.detail.value || '');

      const soloNumeros = valor.replace(/\D/g, '');
      const numero = Number(soloNumeros || 0);

      this.monthlyBudget = numero;

      const input = event.target as HTMLIonInputElement;
      input.value = numero > 0 ? numero.toLocaleString('es-CL') : '';

}

// Formatear meta
    formatearMeta(event: CustomEvent) {

      const valor = String(event.detail.value || '');

      const soloNumeros = valor.replace(/\D/g, '');
      const numero = Number(soloNumeros || 0);

      this.goalAmount = numero;

      const input = event.target as HTMLIonInputElement;
      input.value = numero > 0 ? numero.toLocaleString('es-CL') : '';

}
}

