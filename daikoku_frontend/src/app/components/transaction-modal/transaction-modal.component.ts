import { Component, OnInit, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonButtons,
  IonItem, IonLabel, IonInput, IonSelect, IonSelectOption, IonIcon,
  IonSegment, IonSegmentButton, IonText, IonSpinner, IonGrid, IonRow, IonCol,
  ModalController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  closeOutline, addOutline,
  restaurantOutline, carOutline, homeOutline, medkitOutline,
  shirtOutline, schoolOutline, gameControllerOutline, airplaneOutline,
  cashOutline, briefcaseOutline, laptopOutline, giftOutline,
  heartOutline, musicalNotesOutline, fitnessOutline, pawOutline,
  cartOutline, phonePortraitOutline, tvOutline, busOutline,
  waterOutline, flashOutline, wifiOutline, bookOutline
} from 'ionicons/icons';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { forkJoin, of } from 'rxjs';

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
  ]
})
export class TransactionModalComponent implements OnInit {

  @Input() transactionType: 'income' | 'expense' = 'expense';

  // Datos del formulario
  type: 'income' | 'expense'  = 'expense';
  amount: number | null        = null;
  description                  = '';
  date                         = new Date().toISOString().split('T')[0];
  selectedCategoryId: number | null = null;

  // Categorías
  categories: Category[] = [];
  loadingCategories      = false;

  // Crear nueva categoría
  showNewCategory        = false;
  newCategoryName        = '';
  newCategoryIcon        = 'cash-outline';
  showIconPicker         = false;
  availableIcons         = AVAILABLE_ICONS;

  error   = '';
  loading = false;

  private apiUrl = environment.apiUrl;

  constructor(
    private modalCtrl: ModalController,
    private http: HttpClient
  ) {
    addIcons({
      closeOutline, addOutline,
      restaurantOutline, carOutline, homeOutline, medkitOutline,
      shirtOutline, schoolOutline, gameControllerOutline, airplaneOutline,
      cashOutline, briefcaseOutline, laptopOutline, giftOutline,
      heartOutline, musicalNotesOutline, fitnessOutline, pawOutline,
      cartOutline, phonePortraitOutline, tvOutline, busOutline,
      waterOutline, flashOutline, wifiOutline, bookOutline
    });
  }

  ngOnInit() {
    this.type = this.transactionType;
    this.loadCategories();
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

    this.error   = '';
    this.loading = true;

    try {
      // Si hay una nueva categoría, crearla primero
      if (this.showNewCategory && this.newCategoryName.trim()) {
        const newCat = await this.http.post<Category>(
          `${this.apiUrl}/categories/`,
          { category_name: this.newCategoryName.trim(), category_icon: this.newCategoryIcon }
        ).toPromise();
        this.selectedCategoryId = newCat!.id;
      }

      // Crear la transacción
      await this.http.post(
        `${this.apiUrl}/transactions/`,
        {
          type:        this.type,
          amount:      this.amount,
          description: this.description,
          date:        this.date,
          category:    this.selectedCategoryId ?? null,
        }
      ).toPromise();

      this.loading = false;
      this.modalCtrl.dismiss({ success: true }, 'confirm');

    } catch {
      this.loading = false;
      this.error   = 'Error al guardar la transacción.';
    }
  }
}