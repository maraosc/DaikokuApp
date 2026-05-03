import { Component, Input } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent, IonIcon, IonSpinner, IonDatetime,
  ModalController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  closeOutline, checkmarkOutline, trophyOutline,
  cashOutline, arrowForwardOutline, arrowBackOutline,
  calendarOutline, chevronDownOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-goal-create',
  templateUrl: './goal-create.component.html',
  styleUrls: ['./goal-create.component.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, DecimalPipe,
    IonContent, IonIcon, IonSpinner, IonDatetime,
  ]
})
export class GoalCreateComponent {

  @Input() ufValue = 0;

  paso = 1;

  nombre              = '';
  tipo: 'clp' | 'uf' = 'clp';
  montoDisplay        = '';
  monto: number | null = null;
  deadline            = '';
  mostrarFecha        = false;
  error               = '';
  saving              = false;

  constructor(private modalCtrl: ModalController) {
    addIcons({
      closeOutline, checkmarkOutline, trophyOutline,
      cashOutline, arrowForwardOutline, arrowBackOutline,
      calendarOutline, chevronDownOutline
    });
  }

  get montoEnPesos(): number {
    if (!this.monto) return 0;
    return this.tipo === 'uf' ? this.monto * this.ufValue : this.monto;
  }

  get montoEnUF(): string {
    if (!this.monto || !this.ufValue) return '—';
    const uf = this.tipo === 'clp'
      ? this.monto / this.ufValue
      : this.monto;
    return uf.toLocaleString('es-CL', { maximumFractionDigits: 2 });
  }

  onMontoChange(value: string) {
    const clean       = value.replace(/\D/g, '');
    this.monto        = clean ? parseInt(clean) : null;
    this.montoDisplay = clean ? parseInt(clean).toLocaleString('es-CL') : '';
    this.error        = '';
  }

  formatDate(date: string): string {
    if (!date) return 'Seleccionar fecha';
    const d = date.split('T')[0].split('-');
    return `${d[2]}/${d[1]}/${d[0]}`;
  }

  siguiente() {
    this.error = '';

    if (this.paso === 1) {
      if (!this.nombre.trim()) {
        this.error = 'Ingresa un nombre para la meta.';
        return;
      }
      this.paso = 2;
      return;
    }

    if (this.paso === 2) {
      this.paso = 3;
      return;
    }

    if (this.paso === 3) {
      if (!this.monto || this.monto <= 0) {
        this.error = 'Ingresa un monto válido.';
        return;
      }
      this.paso = 4;
      return;
    }
  }

  guardar() {
    this.saving = true;
    this.modalCtrl.dismiss({
      name:          this.nombre.trim(),
      target_amount: this.montoEnPesos,
      deadline:      this.deadline ? this.deadline.split('T')[0] : null,
    }, 'confirm');
  }

  omitirFecha() {
    this.saving = true;
    this.modalCtrl.dismiss({
      name:          this.nombre.trim(),
      target_amount: this.montoEnPesos,
      deadline:      null,
    }, 'confirm');
  }

  cancelar() {
    this.modalCtrl.dismiss(null, 'cancel');
  }
}