import { Component, OnInit, AfterViewInit, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule, DatePipe } from '@angular/common';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonButtons,
  IonItem, IonLabel, IonInput, IonSelect, IonSelectOption, IonIcon,
  IonSegment, IonSegmentButton, IonText, IonSpinner, IonGrid, IonRow, IonCol,
  IonDatetime, ModalController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  closeOutline, addOutline, calendarOutline, chevronDownOutline,
  checkmarkOutline, alertCircleOutline, pencilOutline,
  restaurantOutline, carOutline, homeOutline, medkitOutline,
  shirtOutline, schoolOutline, gameControllerOutline, airplaneOutline,
  cashOutline, briefcaseOutline, laptopOutline, giftOutline,
  heartOutline, musicalNotesOutline, fitnessOutline, pawOutline,
  cartOutline, phonePortraitOutline, tvOutline, busOutline,
  waterOutline, flashOutline, wifiOutline, bookOutline
} from 'ionicons/icons';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface Category {
  id: number;
  category_name: string;
  category_icon: string;
  is_system: boolean;
}

export const AVAILABLE_ICONS = [
  { name: 'restaurant-outline',      label: 'Comida'       },
  { name: 'car-outline',             label: 'Auto'         },
  { name: 'home-outline',            label: 'Hogar'        },
  { name: 'medkit-outline',          label: 'Salud'        },
  { name: 'shirt-outline',           label: 'Ropa'         },
  { name: 'school-outline',          label: 'Educación'    },
  { name: 'game-controller-outline', label: 'Juegos'       },
  { name: 'airplane-outline',        label: 'Viajes'       },
  { name: 'cash-outline',            label: 'Efectivo'     },
  { name: 'briefcase-outline',       label: 'Trabajo'      },
  { name: 'laptop-outline',          label: 'Tecnología'   },
  { name: 'gift-outline',            label: 'Regalos'      },
  { name: 'heart-outline',           label: 'Personal'     },
  { name: 'musical-notes-outline',   label: 'Música'       },
  { name: 'fitness-outline',         label: 'Deporte'      },
  { name: 'paw-outline',             label: 'Mascotas'     },
  { name: 'cart-outline',            label: 'Compras'      },
  { name: 'phone-portrait-outline',  label: 'Celular'      },
  { name: 'tv-outline',              label: 'Streaming'    },
  { name: 'bus-outline',             label: 'Transporte'   },
  { name: 'water-outline',           label: 'Agua'         },
  { name: 'flash-outline',           label: 'Luz'          },
  { name: 'wifi-outline',            label: 'Internet'     },
  { name: 'book-outline',            label: 'Libros'       },
];

@Component({
  selector: 'app-transaction-modal',
  templateUrl: './transaction-modal.component.html',
  styleUrls: ['./transaction-modal.component.scss'],
  standalone: true,
  imports: [
    FormsModule, CommonModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonButtons,
    IonItem, IonLabel, IonInput, IonSelect, IonSelectOption, IonIcon,
    IonSegment, IonSegmentButton, IonText, IonSpinner, IonGrid, IonRow, IonCol,
    IonDatetime,
  ]
})
export class TransactionModalComponent implements OnInit, AfterViewInit {

  @Input() transactionType: 'income' | 'expense' = 'expense';
  @Input() transaction: any = null;

  type: 'income' | 'expense'        = 'expense';
  amount: number | null             = null;
  amountDisplay                     = '';
  description                       = '';
  date                              = new Date().toISOString().split('T')[0];
  selectedCategoryId: number | null = null;
  mostrarFecha                      = false;

  categories: Category[] = [];
  loadingCategories      = false;

  showNewCategory  = false;
  newCategoryName  = '';
  newCategoryIcon  = 'cash-outline';
  showIconPicker   = false;
  availableIcons   = AVAILABLE_ICONS;

  error   = '';
  loading = false;

  private apiUrl = environment.apiUrl;

  constructor(
    private modalCtrl: ModalController,
    private http: HttpClient
  ) {
    addIcons({
      closeOutline, addOutline, calendarOutline, chevronDownOutline,
      checkmarkOutline, alertCircleOutline, pencilOutline,
      restaurantOutline, carOutline, homeOutline, medkitOutline,
      shirtOutline, schoolOutline, gameControllerOutline, airplaneOutline,
      cashOutline, briefcaseOutline, laptopOutline, giftOutline,
      heartOutline, musicalNotesOutline, fitnessOutline, pawOutline,
      cartOutline, phonePortraitOutline, tvOutline, busOutline,
      waterOutline, flashOutline, wifiOutline, bookOutline
    });
  }

  ngOnInit() {
    this.loadCategories();
  }

  ngAfterViewInit() {
    if (this.transaction) {
      this.type               = this.transaction.type;
      this.amount             = this.transaction.amount;
      this.amountDisplay      = this.transaction.amount
        ? parseInt(this.transaction.amount).toLocaleString('es-CL')
        : '';
      this.description        = this.transaction.description;
      this.date               = this.transaction.date;
      this.selectedCategoryId = this.transaction.category;
    } else {
      this.type = this.transactionType;
    }
  }

  get dateFormatted(): string {
    if (!this.date) return 'Seleccionar fecha';
    const [year, month, day] = this.date.split('-');
    return `${day}/${month}/${year}`;
  }

  onAmountChange(value: string) {
    const clean = value.replace(/\D/g, '');
    this.amount = clean ? parseInt(clean) : null;
    this.amountDisplay = clean ? parseInt(clean).toLocaleString('es-CL') : '';
    this.error = '';
  }

  loadCategories() {
    this.loadingCategories = true;
    this.http.get<Category[]>(`${this.apiUrl}/categories/`).subscribe({
      next: cats => {
        this.categories        = cats;
        this.loadingCategories = false;
      },
      error: () => {
        this.loadingCategories = false;
      }
    });
  }

  selectIcon(iconName: string) {
    this.newCategoryIcon = iconName;
    this.showIconPicker  = false;
  }

  cancelar() {
    this.modalCtrl.dismiss(null, 'cancel');
  }

  async guardar() {
    if (!this.amount || this.amount <= 0) {
      this.error = 'Ingresa un monto válido.';
      return;
    }

    if (!this.description.trim()) {
      this.error = 'Ingresa una descripción.';
      return;
    }

    if (!this.selectedCategoryId && !(this.showNewCategory && this.newCategoryName.trim())) {
      this.error = 'Selecciona o crea una categoría.';
      return;
    }

    this.error   = '';
    this.loading = true;

    try {
      if (this.showNewCategory && this.newCategoryName.trim()) {
        const newCat = await this.http.post<Category>(
          `${this.apiUrl}/categories/`,
          { category_name: this.newCategoryName.trim(), category_icon: this.newCategoryIcon }
        ).toPromise();
        this.selectedCategoryId = newCat!.id;
      }

      const payload = {
        type:        this.type,
        amount:      this.amount,
        description: this.description,
        date:        this.date,
        category:    this.selectedCategoryId ?? null,
      };

      if (this.transaction) {
        await this.http.patch(
          `${this.apiUrl}/transactions/${this.transaction.id}/`,
          payload
        ).toPromise();
      } else {
        await this.http.post(
          `${this.apiUrl}/transactions/`,
          payload
        ).toPromise();
      }

      this.loading = false;
      this.modalCtrl.dismiss({ success: true }, 'confirm');

    } catch {
      this.loading = false;
      this.error   = 'Error al guardar la transacción.';
    }
  }
}