import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonContent, IonButton, IonIcon,
  ModalController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { createOutline, trashOutline, closeOutline } from 'ionicons/icons';

@Component({
  selector: 'app-transaction-detail',
  templateUrl: './transaction-detail.component.html',
  styleUrls: ['./transaction-detail.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent, IonButton, IonIcon,
  ]
})
export class TransactionDetailComponent {

  @Input() transaction: any = null;

  constructor(private modalCtrl: ModalController) {
    addIcons({ createOutline, trashOutline, closeOutline });
  }

  editar() {
    this.modalCtrl.dismiss({ transaction: this.transaction }, 'edit');
  }

  eliminar() {
    this.modalCtrl.dismiss({ transaction: this.transaction }, 'delete');
  }

  cancelar() {
    this.modalCtrl.dismiss(null, 'cancel');
  }
}