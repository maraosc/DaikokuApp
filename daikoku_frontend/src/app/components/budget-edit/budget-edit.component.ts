import { Component, Input, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent, IonIcon, IonSpinner,
  ModalController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  closeOutline, checkmarkOutline, createOutline,
  cashOutline, trashOutline, arrowBackOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-budget-edit',
  templateUrl: './budget-edit.component.html',
  styleUrls: ['./budget-edit.component.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, DecimalPipe,
    IonContent, IonIcon, IonSpinner,
  ]
})
export class BudgetEditComponent implements OnInit {

  @Input() budget: any = null;

  vista: 'editar' | 'confirmar' = 'editar';

  montoDisplay         = '';
  monto: number | null = null;
  error                = '';
  saving               = false;

  constructor(private modalCtrl: ModalController) {
    addIcons({
      closeOutline, checkmarkOutline, createOutline,
      cashOutline, trashOutline, arrowBackOutline
    });
  }

  ngOnInit() {
    if (this.budget) {
      this.monto        = this.budget.amount;
      this.montoDisplay = parseInt(String(this.budget.amount)).toLocaleString('es-CL');
    }
  }

  onMontoChange(value: string) {
    const clean       = value.replace(/\D/g, '');
    this.monto        = clean ? parseInt(clean) : null;
    this.montoDisplay = clean ? parseInt(clean).toLocaleString('es-CL') : '';
    this.error        = '';
  }

  guardar() {
    if (!this.monto || this.monto <= 0) {
      this.error = 'Ingresa un monto válido.';
      return;
    }
    this.saving = true;
    this.modalCtrl.dismiss({ amount: this.monto }, 'confirm');
  }

  eliminar() {
    this.vista = 'confirmar';
  }

  confirmarEliminar() {
    this.modalCtrl.dismiss(null, 'delete');
  }

  cancelar() {
    this.modalCtrl.dismiss(null, 'cancel');
  }
}