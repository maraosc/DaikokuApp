import { Component, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonButtons,
  IonBackButton, IonButton, IonIcon, IonItem, IonLabel,
  IonList, IonProgressBar, IonNote, IonFab, IonFabButton,
  ModalController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  addOutline, trashOutline, createOutline, walletOutline, cashOutline,
  restaurantOutline, carOutline, homeOutline, medkitOutline,
  shirtOutline, schoolOutline, gameControllerOutline, airplaneOutline,
  briefcaseOutline, laptopOutline, giftOutline,
  heartOutline, musicalNotesOutline, fitnessOutline, pawOutline,
  cartOutline, phonePortraitOutline, tvOutline, busOutline,
  waterOutline, flashOutline, wifiOutline, bookOutline
} from 'ionicons/icons';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { CategoryPickerComponent } from '../../components/category-picker/category-picker.component';
import { AmountPickerComponent } from '../../components/amount-picker/amount-picker.component';
import { BudgetEditComponent } from '../../components/budget-edit/budget-edit.component';

interface Budget {
  id: number;
  category: number;
  category_name: string;
  category_icon: string;
  amount: number;
  month: string;
  spent_amount: number;
  remaining_amount: number;
  progress_percentage: number;
}

interface Category {
  id: number;
  category_name: string;
  category_icon: string;
}

@Component({
  selector: 'app-budgets',
  templateUrl: './budgets.page.html',
  styleUrls: ['./budgets.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, DecimalPipe,
    IonContent, IonHeader, IonTitle, IonToolbar, IonButtons,
    IonBackButton, IonButton, IonIcon, IonItem, IonLabel,
    IonList, IonProgressBar, IonNote, IonFab, IonFabButton,
  ]
})
export class BudgetsPage implements OnInit {

  budgets: Budget[]      = [];
  categories: Category[] = [];
  totalPresupuestado     = 0;
  totalGastado           = 0;
  loading                = false;

  currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;

  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private modalCtrl: ModalController,
  ) {
    addIcons({
      addOutline, trashOutline, createOutline, walletOutline, cashOutline,
      restaurantOutline, carOutline, homeOutline, medkitOutline,
      shirtOutline, schoolOutline, gameControllerOutline, airplaneOutline,
      briefcaseOutline, laptopOutline, giftOutline,
      heartOutline, musicalNotesOutline, fitnessOutline, pawOutline,
      cartOutline, phonePortraitOutline, tvOutline, busOutline,
      waterOutline, flashOutline, wifiOutline, bookOutline
    });
  }

  ngOnInit() {
    this.cargarDatos();
  }

  ionViewWillEnter() {
    this.cargarDatos();
  }

  get disponible(): number {
    return this.totalPresupuestado - this.totalGastado;
  }

  get presupuestoUsadoPct(): number {
    if (this.totalPresupuestado <= 0) return 0;
    return Math.min(this.totalGastado / this.totalPresupuestado * 100, 100);
  }

  cargarDatos() {
    this.loading = true;

    this.http.get<Budget[]>(`${this.apiUrl}/budgets/?month=${this.currentMonth}`).subscribe({
      next: data => {
        this.budgets            = data;
        this.totalPresupuestado = data.reduce((s, b) => s + Number(b.amount), 0);
        this.totalGastado       = data.reduce((s, b) => s + Number(b.spent_amount), 0);
        this.loading            = false;
      },
      error: () => { this.loading = false; }
    });

    this.http.get<Category[]>(`${this.apiUrl}/categories/`).subscribe({
      next: cats => { this.categories = cats; }
    });
  }

  async agregarPresupuesto() {
    const categoriasDisponibles = this.categories
      .filter(c => !this.budgets.find(b => b.category === c.id));

    const modal = await this.modalCtrl.create({
      component: CategoryPickerComponent,
      componentProps: { categories: categoriasDisponibles },
      breakpoints: [0, 0.9],
      initialBreakpoint: 0.9,
    });

    await modal.present();

    const { data, role } = await modal.onWillDismiss();
    if (role === 'selected' && data?.category) {
      if (!this.categories.find(c => c.id === data.category.id)) {
        this.categories.push(data.category);
      }
      this.pedirMonto(data.category.id);
    }
  }

  async pedirMonto(categoryId: number) {
    const cat = this.categories.find(c => c.id === categoryId);

    const modal = await this.modalCtrl.create({
      component: AmountPickerComponent,
      componentProps: {
        categoryName: cat?.category_name ?? '',
        categoryIcon: cat?.category_icon ?? 'cash-outline',
      },
      breakpoints: [0, 0.6],
      initialBreakpoint: 0.6,
    });

    await modal.present();

    const { data, role } = await modal.onWillDismiss();
    if (role === 'confirm' && data?.amount) {
      this.guardarPresupuesto(categoryId, data.amount);
    }
  }

  guardarPresupuesto(categoryId: number, amount: number) {
    this.http.post(`${this.apiUrl}/budgets/`, {
      category: categoryId,
      amount,
      month: this.currentMonth
    }).subscribe({
      next: () => this.cargarDatos(),
      error: () => {}
    });
  }

  async editarPresupuesto(budget: Budget) {
    const modal = await this.modalCtrl.create({
      component: BudgetEditComponent,
      componentProps: { budget },
      breakpoints: [0, 0.75],
      initialBreakpoint: 0.75,
    });

    await modal.present();

    const { data, role } = await modal.onWillDismiss();

    if (role === 'confirm' && data?.amount) {
      this.http.patch(`${this.apiUrl}/budgets/${budget.id}/`, {
        amount: data.amount
      }).subscribe({
        next: () => this.cargarDatos(),
        error: () => {}
      });
    } else if (role === 'delete') {
      this.http.delete(`${this.apiUrl}/budgets/${budget.id}/`).subscribe({
        next: () => this.cargarDatos(),
        error: () => {}
      });
    }
  }
}