import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import {
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonFab, IonFabButton, IonIcon,
  IonSegment, IonSegmentButton, IonLabel,
  IonList, IonItem, IonNote, IonButtons,
  IonMenu, IonMenuButton,
  ModalController, AlertController, MenuController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addOutline, pencilOutline, trashOutline, homeOutline, trendingUpOutline, personOutline, walletOutline } from 'ionicons/icons';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { TransactionModalComponent } from '../../components/transaction-modal/transaction-modal.component';
import { TransactionDetailComponent } from '../../components/transaction-detail/transaction-detail.component';

interface Transaction {
  id: number;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  date: string;
  category: number | null;
  category_name: string | null;
}

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [
    FormsModule, DecimalPipe,
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonFab, IonFabButton, IonIcon,
    IonSegment, IonSegmentButton, IonLabel,
    IonList, IonItem, IonNote, IonButtons,
    IonMenu, IonMenuButton,
  ],
})
export class HomePage implements OnInit {

  balance     = 0;
  vistaActual = 'gastos';
  transactions: Transaction[] = [];
  dolar = 0;
  uf    = 0;

  private apiUrl = environment.apiUrl;

  constructor(
    private modalCtrl: ModalController,
    private alertCtrl: AlertController,
    private menuCtrl: MenuController,
    private router: Router,
    private http: HttpClient
  ) {
    addIcons({ addOutline, pencilOutline, trashOutline, homeOutline, trendingUpOutline, personOutline, walletOutline });
  }

  ngOnInit() {
    this.cargarDatos();
    this.cargarIndicadores();
  }

  get transactionsFiltradas(): Transaction[] {
    const tipo = this.vistaActual === 'gastos' ? 'expense' : 'income';
    return this.transactions.filter(t => t.type === tipo);
  }

  cargarDatos() {
    const hoy   = new Date();
    const month = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;

    this.http.get<any>(`${this.apiUrl}/transactions/summary/?month=${month}`).subscribe({
      next: data => {
        this.balance = data.total_income - data.total_expenses;
      }
    });

    this.http.get<Transaction[]>(`${this.apiUrl}/transactions/?month=${month}`).subscribe({
      next: data => {
        this.transactions = data;
      }
    });
  }

  cargarIndicadores() {
    this.http.get<any>('/mindicador/api/dolar').subscribe({
      next: data => this.dolar = data.serie[0].valor,
      error: () => {}
    });

    this.http.get<any>('/mindicador/api/uf').subscribe({
      next: data => this.uf = data.serie[0].valor,
      error: () => {}
    });
  }

  async navegarA(ruta: string) {
    await this.menuCtrl.close();
    this.router.navigate([ruta]);
  }

  async abrirModal() {
    const modal = await this.modalCtrl.create({
      component: TransactionModalComponent,
      componentProps: { transactionType: this.vistaActual === 'gastos' ? 'expense' : 'income' },
      breakpoints: [0, 0.95],
      initialBreakpoint: 0.95,
    });

    await modal.present();

    const { data, role } = await modal.onWillDismiss();
    if (role === 'confirm' && data?.success) {
      this.cargarDatos();
    }
  }

  async abrirDetalle(tx: Transaction) {
    const modal = await this.modalCtrl.create({
      component: TransactionDetailComponent,
      componentProps: { transaction: tx },
      breakpoints: [0, 0.35],
      initialBreakpoint: 0.35,
    });

    await modal.present();

    const { data, role } = await modal.onWillDismiss();
    if (role === 'edit') {
      this.abrirEdicion(data.transaction);
    } else if (role === 'delete') {
      this.eliminarTransaccion(data.transaction);
    }
  }

  async abrirEdicion(tx: Transaction) {
    const modal = await this.modalCtrl.create({
      component: TransactionModalComponent,
      componentProps: { transactionType: tx.type, transaction: tx },
      breakpoints: [0, 0.95],
      initialBreakpoint: 0.95,
    });

    await modal.present();

    const { data, role } = await modal.onWillDismiss();
    if (role === 'confirm' && data?.success) {
      this.cargarDatos();
    }
  }

  async eliminarTransaccion(tx: Transaction) {
    const alert = await this.alertCtrl.create({
      header: 'Eliminar transacción',
      message: '¿Estás seguro? Esta acción no se puede deshacer.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            this.http.delete(`${this.apiUrl}/transactions/${tx.id}/`).subscribe({
              next: () => this.cargarDatos(),
              error: () => {}
            });
          }
        }
      ]
    });
    await alert.present();
  }
}