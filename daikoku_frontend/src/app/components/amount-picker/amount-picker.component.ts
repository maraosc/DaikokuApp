import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import {
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonButton, IonButtons, IonIcon, IonSpinner,
  ModalController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { closeOutline, checkmarkOutline } from 'ionicons/icons';

@Component({
  selector: 'app-amount-picker',
  templateUrl: './amount-picker.component.html',
  styleUrls: ['./amount-picker.component.scss'],
  standalone: true,
  imports: [
    FormsModule, CommonModule,
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonButton, IonButtons, IonIcon, IonSpinner,
  ]
})
export class AmountPickerComponent {

  @Input() categoryName = '';
  @Input() categoryIcon = 'cash-outline';
  @Input() initialAmount: number | null = null;

  amountDisplay = '';
  amount: number | null = null;
  error = '';

  constructor(private modalCtrl: ModalController) {
    addIcons({ closeOutline, checkmarkOutline });
    if (this.initialAmount) {
      this.amount = this.initialAmount;
      this.amountDisplay = this.initialAmount.toLocaleString('es-CL');
    }
  }

  onAmountChange(value: string) {
    const clean = value.replace(/\D/g, '');
    this.amount = clean ? parseInt(clean) : null;
    this.amountDisplay = clean ? parseInt(clean).toLocaleString('es-CL') : '';
    this.error = '';
  }

  cancelar() {
    this.modalCtrl.dismiss(null, 'cancel');
  }

  confirmar() {
    if (!this.amount || this.amount <= 0) {
      this.error = 'Ingresa un monto válido.';
      return;
    }
    this.modalCtrl.dismiss({ amount: this.amount }, 'confirm');
  }
}