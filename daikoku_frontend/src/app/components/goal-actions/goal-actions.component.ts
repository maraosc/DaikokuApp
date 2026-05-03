import { Component, Input } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent, IonIcon, IonSpinner, IonProgressBar,
  ModalController, AlertController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  closeOutline, addCircleOutline, calculatorOutline,
  createOutline, pauseOutline, playOutline, trashOutline,
  checkmarkOutline, trophyOutline, arrowBackOutline,
  trendingUpOutline
} from 'ionicons/icons';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export type GoalAction = 'aportar' | 'editar' | 'pausar' | 'reactivar' | 'cancelar';

@Component({
  selector: 'app-goal-actions',
  templateUrl: './goal-actions.component.html',
  styleUrls: ['./goal-actions.component.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, DecimalPipe,
    IonContent, IonIcon, IonSpinner, IonProgressBar,
  ]
})
export class GoalActionsComponent {

  @Input() goal: any = null;
  @Input() ufValue   = 0;

  // Vista
  vista: 'acciones' | 'aportar' | 'simular' | 'editar' = 'acciones';

  // Aporte
  aporteMonto              = '';
  aporteAmount: number | null = null;
  aporteError              = '';
  balance                  = 0;
  loadingBalance           = false;

  // Simulación
  simularMonto             = '';
  simularAmount: number | null = null;
  simularResultado         = '';

  // Edición
  editNombre               = '';
  editMonto                = '';
  editMontoAmount: number | null = null;
  editDeadline             = '';
  editError                = '';
  saving                   = false;

  private apiUrl = environment.apiUrl;

  constructor(
    private modalCtrl: ModalController,
    private alertCtrl: AlertController,
    private http: HttpClient,
  ) {
    addIcons({
      closeOutline, addCircleOutline, calculatorOutline,
      createOutline, pauseOutline, playOutline, trashOutline,
      checkmarkOutline, trophyOutline, arrowBackOutline,
      trendingUpOutline
    });
  }

  get enUF(): string {
    if (!this.ufValue || !this.goal) return '—';
    return (this.goal.remaining_amount / this.ufValue)
      .toLocaleString('es-CL', { maximumFractionDigits: 2 });
  }

  cancelar() {
    this.modalCtrl.dismiss(null, 'cancel');
  }

  // ── Aportar ───────────────────────────────────────────────────────

  abrirAporte() {
    this.vista          = 'aportar';
    this.aporteMonto    = '';
    this.aporteAmount   = null;
    this.aporteError    = '';
    this.loadingBalance = true;

    const hoy   = new Date();
    const month = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;

    this.http.get<any>(`${this.apiUrl}/transactions/summary/?month=${month}`).subscribe({
      next: (s) => {
        this.balance        = s.total_income - s.total_expenses;
        this.loadingBalance = false;
      },
      error: () => { this.loadingBalance = false; }
    });
  }

  onAporteChange(value: string) {
    const clean       = value.replace(/\D/g, '');
    this.aporteAmount = clean ? parseInt(clean) : null;
    this.aporteMonto  = clean ? parseInt(clean).toLocaleString('es-CL') : '';
    this.aporteError  = '';
  }

  confirmarAporte() {
    if (!this.aporteAmount || this.aporteAmount <= 0) {
      this.aporteError = 'Ingresa un monto válido.';
      return;
    }
    if (this.aporteAmount > this.balance) {
      this.aporteError = `Balance insuficiente. Disponible: $${this.balance.toLocaleString('es-CL')}`;
      return;
    }
    this.modalCtrl.dismiss({ action: 'aportar', amount: this.aporteAmount }, 'action');
  }

  // ── Simular ───────────────────────────────────────────────────────

  abrirSimular() {
    this.vista            = 'simular';
    this.simularMonto     = '';
    this.simularAmount    = null;
    this.simularResultado = '';
  }

  onSimularChange(value: string) {
    const clean        = value.replace(/\D/g, '');
    this.simularAmount = clean ? parseInt(clean) : null;
    this.simularMonto  = clean ? parseInt(clean).toLocaleString('es-CL') : '';
    this.simularResultado = '';
  }

  calcularSimulacion() {
    if (!this.simularAmount || this.simularAmount <= 0) return;
    const remaining = Number(this.goal?.remaining_amount);
    const months    = Math.ceil(remaining / this.simularAmount);
    const years     = Math.floor(months / 12);
    const meses     = months % 12;
    let tiempo = '';
    if (years > 0) tiempo += `${years} año${years > 1 ? 's' : ''} `;
    if (meses > 0) tiempo += `${meses} mes${meses > 1 ? 'es' : ''}`;
    if (!tiempo)   tiempo = 'menos de 1 mes';
    this.simularResultado = `Ahorrando $${this.simularAmount.toLocaleString('es-CL')}/mes, llegarías en ${tiempo} (${months} pagos).`;
  }

  // ── Editar ────────────────────────────────────────────────────────

  abrirEditar() {
    this.vista           = 'editar';
    this.editNombre      = this.goal?.name ?? '';
    this.editMontoAmount = this.goal?.target_amount ?? null;
    this.editMonto       = this.editMontoAmount
      ? parseInt(String(this.editMontoAmount)).toLocaleString('es-CL')
      : '';
    this.editDeadline    = this.goal?.deadline ?? '';
    this.editError       = '';
  }

  onEditMontoChange(value: string) {
    const clean          = value.replace(/\D/g, '');
    this.editMontoAmount = clean ? parseInt(clean) : null;
    this.editMonto       = clean ? parseInt(clean).toLocaleString('es-CL') : '';
    this.editError       = '';
  }

  guardarEdicion() {
    if (!this.editNombre.trim()) {
      this.editError = 'Ingresa un nombre válido.';
      return;
    }
    if (!this.editMontoAmount || this.editMontoAmount <= 0) {
      this.editError = 'Ingresa un monto válido.';
      return;
    }

    this.saving = true;

    this.http.patch(`${this.apiUrl}/goals/${this.goal.id}/`, {
      name:          this.editNombre.trim(),
      target_amount: this.editMontoAmount,
      deadline:      this.editDeadline || null,
    }).subscribe({
      next: () => {
        this.saving = false;
        this.modalCtrl.dismiss({ action: 'actualizado' }, 'action');
      },
      error: () => {
        this.saving     = false;
        this.editError  = 'Error al guardar.';
      }
    });
  }

  // ── Estado ────────────────────────────────────────────────────────

  async confirmarCancelar() {
    const alert = await this.alertCtrl.create({
      header: 'Cancelar meta',
      message: '¿Estás seguro? Esta acción no se puede deshacer.',
      buttons: [
        { text: 'No', role: 'cancel' },
        {
          text: 'Sí, cancelar',
          role: 'destructive',
          handler: () => {
            this.modalCtrl.dismiss({ action: 'cancelar' }, 'action');
          }
        }
      ]
    });
    await alert.present();
  }

  cambiarEstado(estado: 'paused' | 'active') {
    this.modalCtrl.dismiss({ action: estado === 'paused' ? 'pausar' : 'reactivar' }, 'action');
  }
}