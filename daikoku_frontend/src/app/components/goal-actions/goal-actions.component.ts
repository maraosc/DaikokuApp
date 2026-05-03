import { Component, Input } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonButton,
  IonButtons, IonIcon, IonSpinner, IonProgressBar,
  ModalController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  closeOutline, addCircleOutline, calculatorOutline,
  createOutline, pauseOutline, playOutline, trashOutline,
  checkmarkOutline, trophyOutline
} from 'ionicons/icons';

export type GoalAction = 'aportar' | 'simular' | 'editar' | 'pausar' | 'reactivar' | 'cancelar';

@Component({
  selector: 'app-goal-actions',
  templateUrl: './goal-actions.component.html',
  styleUrls: ['./goal-actions.component.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, DecimalPipe,
    IonContent, IonHeader, IonToolbar, IonTitle, IonButton,
    IonButtons, IonIcon, IonSpinner, IonProgressBar,
  ]
})
export class GoalActionsComponent {

  @Input() goal: any = null;
  @Input() ufValue   = 0;

  constructor(private modalCtrl: ModalController) {
    addIcons({
      closeOutline, addCircleOutline, calculatorOutline,
      createOutline, pauseOutline, playOutline, trashOutline,
      checkmarkOutline, trophyOutline
    });
  }

  get enUF(): string {
    if (!this.ufValue || !this.goal) return '—';
    return (this.goal.remaining_amount / this.ufValue)
      .toLocaleString('es-CL', { maximumFractionDigits: 2 });
  }

  accion(tipo: GoalAction) {
    this.modalCtrl.dismiss({ action: tipo }, 'action');
  }

  cancelar() {
    this.modalCtrl.dismiss(null, 'cancel');
  }
}