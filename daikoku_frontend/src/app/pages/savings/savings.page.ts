import { Component, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonButtons,
  IonBackButton, IonButton, IonIcon, IonProgressBar,
  IonFab, IonFabButton, IonSpinner,
  AlertController, ModalController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  addOutline, trophyOutline, checkmarkCircleOutline,
  timeOutline, cashOutline, calculatorOutline,
  pauseOutline, closeCircleOutline, addCircleOutline,
  ellipsisVerticalOutline
} from 'ionicons/icons';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { GoalActionsComponent } from '../../components/goal-actions/goal-actions.component';

interface Goal {
  id: number;
  name: string;
  target_amount: number;
  current_amount: number;
  creation_date: string;
  deadline: string | null;
  state: 'active' | 'paused' | 'completed' | 'cancelled';
  state_display: string;
  progress_percentage: number;
  remaining_amount: number;
}

@Component({
  selector: 'app-savings',
  templateUrl: './savings.page.html',
  styleUrls: ['./savings.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, DecimalPipe,
    IonContent, IonHeader, IonTitle, IonToolbar, IonButtons,
    IonBackButton, IonButton, IonIcon, IonProgressBar,
    IonFab, IonFabButton, IonSpinner,
  ]
})
export class SavingsPage implements OnInit {

  goals: Goal[] = [];
  ufValue       = 0;
  loading       = false;

  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private alertCtrl: AlertController,
    private modalCtrl: ModalController,
  ) {
    addIcons({
      addOutline, trophyOutline, checkmarkCircleOutline,
      timeOutline, cashOutline, calculatorOutline,
      pauseOutline, closeCircleOutline, addCircleOutline,
      ellipsisVerticalOutline
    });
  }

  ngOnInit() {
    this.cargarDatos();
  }

  ionViewWillEnter() {
    this.cargarDatos();
  }

  cargarDatos() {
    this.loading = true;

    this.http.get<Goal[]>(`${this.apiUrl}/goals/`).subscribe({
      next: data => {
        this.goals   = data;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });

    this.http.get<any>('/mindicador/api/uf').subscribe({
      next: data => { this.ufValue = data.serie[0].valor; },
      error: () => {}
    });
  }

  // ── Crear meta ────────────────────────────────────────────────────

  async crearMeta() {
    const alert = await this.alertCtrl.create({
      header: 'Nueva meta de ahorro',
      inputs: [
        { name: 'name', type: 'text', placeholder: 'Ej: Pie departamento, Auto...' },
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Siguiente',
          handler: (data) => {
            if (!data.name?.trim()) return false;
            this.elegirTipoMonto(data.name.trim());
            return true;
          }
        }
      ]
    });
    await alert.present();
  }

  async elegirTipoMonto(name: string) {
    const alert = await this.alertCtrl.create({
      header: '¿En qué moneda?',
      inputs: [
        { type: 'radio', label: 'Pesos chilenos (CLP)', value: 'clp' },
        { type: 'radio', label: `UF (1 UF = $${this.ufValue.toLocaleString('es-CL')})`, value: 'uf' },
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Siguiente',
          handler: (tipo) => {
            if (!tipo) return false;
            this.ingresarMonto(name, tipo);
            return true;
          }
        }
      ]
    });
    await alert.present();
  }

  async ingresarMonto(name: string, tipo: 'clp' | 'uf') {
    const alert = await this.alertCtrl.create({
      header: tipo === 'uf' ? 'Monto en UF' : 'Monto en pesos',
      message: tipo === 'uf' ? `1 UF = $${this.ufValue.toLocaleString('es-CL')}` : '',
      inputs: [
        {
          name: 'amount',
          type: 'number',
          placeholder: tipo === 'uf' ? 'Ej: 500' : 'Ej: 5000000',
        }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Siguiente',
          handler: (data) => {
            const raw = parseFloat(data.amount);
            if (!raw || raw <= 0) return false;
            const amount = tipo === 'uf' ? raw * this.ufValue : raw;
            this.ingresarFecha(name, amount);
            return true;
          }
        }
      ]
    });
    await alert.present();
  }

  async ingresarFecha(name: string, amount: number) {
    const alert = await this.alertCtrl.create({
      header: 'Fecha límite (opcional)',
      inputs: [
        { name: 'deadline', type: 'date' }
      ],
      buttons: [
        {
          text: 'Sin fecha',
          handler: () => { this.guardarMeta(name, amount, undefined); }
        },
        {
          text: 'Guardar',
          handler: (data) => {
            this.guardarMeta(name, amount, data.deadline || undefined);
          }
        }
      ]
    });
    await alert.present();
  }

  guardarMeta(name: string, target_amount: number, deadline?: string) {
    this.http.post(`${this.apiUrl}/goals/`, {
      name, target_amount, deadline
    }).subscribe({
      next: () => this.cargarDatos(),
      error: () => {}
    });
  }

  // ── Editar meta ───────────────────────────────────────────────────

  async editarMeta(goal: Goal) {
    const alert1 = await this.alertCtrl.create({
      header: 'Editar meta',
      inputs: [
        {
          name: 'name',
          type: 'text',
          value: goal.name,
          placeholder: 'Nombre de la meta'
        }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Siguiente',
          handler: (data) => {
            if (!data.name?.trim()) return false;
            this.editarMontoMeta(goal, data.name.trim());
            return true;
          }
        }
      ]
    });
    await alert1.present();
  }

  async editarMontoMeta(goal: Goal, name: string) {
    const alert2 = await this.alertCtrl.create({
      header: 'Monto objetivo',
      inputs: [
        {
          name: 'target_amount',
          type: 'number',
          value: String(goal.target_amount),
          placeholder: 'Monto objetivo'
        }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Siguiente',
          handler: (data) => {
            const amount = parseFloat(data.target_amount);
            if (!amount || amount <= 0) return false;
            this.editarFechaMeta(goal, name, amount);
            return true;
          }
        }
      ]
    });
    await alert2.present();
  }

  async editarFechaMeta(goal: Goal, name: string, target_amount: number) {
    const alert3 = await this.alertCtrl.create({
      header: 'Fecha límite',
      inputs: [
        {
          name: 'deadline',
          type: 'date',
          value: goal.deadline ?? ''
        }
      ],
      buttons: [
        {
          text: 'Sin fecha',
          handler: () => {
            this.guardarEdicionMeta(goal.id, name, target_amount, null);
          }
        },
        {
          text: 'Guardar',
          handler: (data) => {
            this.guardarEdicionMeta(goal.id, name, target_amount, data.deadline || null);
          }
        }
      ]
    });
    await alert3.present();
  }

  guardarEdicionMeta(id: number, name: string, target_amount: number, deadline: string | null) {
    this.http.patch(`${this.apiUrl}/goals/${id}/`, {
      name, target_amount, deadline
    }).subscribe({
      next: () => this.cargarDatos(),
      error: () => {}
    });
  }

  // ── Aportar ───────────────────────────────────────────────────────

  async aportar(goal: Goal) {
    const hoy   = new Date();
    const month = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;

    this.http.get<any>(`${this.apiUrl}/transactions/summary/?month=${month}`).subscribe({
      next: async (summary) => {
        const balance = summary.total_income - summary.total_expenses;

        const alert = await this.alertCtrl.create({
          header: `Aportar a "${goal.name}"`,
          message: `Faltan <strong>$${Number(goal.remaining_amount).toLocaleString('es-CL')}</strong><br>Balance disponible: <strong>$${Number(balance).toLocaleString('es-CL')}</strong>`,
          inputs: [
            { name: 'amount', type: 'number', placeholder: '0' }
          ],
          buttons: [
            { text: 'Cancelar', role: 'cancel' },
            {
              text: 'Aportar',
              handler: async (data) => {
                const amount = parseFloat(data.amount);

                if (!amount || amount <= 0) {
                  this.mostrarError('Ingresa un monto válido.');
                  return false;
                }

                if (amount > balance) {
                  this.mostrarError(`No tienes suficiente balance. Disponible: $${Number(balance).toLocaleString('es-CL')}`);
                  return false;
                }

                this.registrarAporte(goal, amount);
                return true;
              }
            }
          ]
        });
        await alert.present();
      }
    });
  }

  private registrarAporte(goal: Goal, amount: number) {
    this.http.get<any[]>(`${this.apiUrl}/categories/`).subscribe({
      next: (cats) => {
        const catExistente = cats.find(c =>
          c.category_name.toLowerCase() === goal.name.toLowerCase()
        );

        if (catExistente) {
          this.crearTransaccionAporte(goal, amount, catExistente.id);
        } else {
          this.http.post<any>(`${this.apiUrl}/categories/`, {
            category_name: goal.name,
            category_icon: 'trophy-outline'
          }).subscribe({
            next: (newCat) => {
              this.crearTransaccionAporte(goal, amount, newCat.id);
            },
            error: () => {}
          });
        }
      }
    });
  }

  private crearTransaccionAporte(goal: Goal, amount: number, categoryId: number) {
    this.http.post(`${this.apiUrl}/transactions/`, {
      type:        'expense',
      amount,
      description: `Aporte a meta: ${goal.name}`,
      date:        new Date().toISOString().split('T')[0],
      category:    categoryId,
      goal:        goal.id,
    }).subscribe({
      next: () => {
        this.http.post(`${this.apiUrl}/goals/${goal.id}/contribute/`, { amount }).subscribe({
          next: () => this.cargarDatos(),
          error: () => {}
        });
      },
      error: () => {}
    });
  }

  // ── Simular ───────────────────────────────────────────────────────

  async simular(goal: Goal) {
    const alert = await this.alertCtrl.create({
      header: '¿Cuánto ahorrarías por mes?',
      inputs: [
        { name: 'monthly', type: 'number', placeholder: '0' }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Calcular',
          handler: (data) => {
            const monthly = parseFloat(data.monthly);
            if (!monthly || monthly <= 0) return false;
            const remaining = Number(goal.remaining_amount);
            const months    = Math.ceil(remaining / monthly);
            const years     = Math.floor(months / 12);
            const restMeses = months % 12;
            let tiempo = '';
            if (years > 0) tiempo += `${years} año${years > 1 ? 's' : ''} `;
            if (restMeses > 0) tiempo += `${restMeses} mes${restMeses > 1 ? 'es' : ''}`;
            if (!tiempo) tiempo = 'menos de 1 mes';
            this.mostrarSimulacion(goal.name, monthly, tiempo, months);
            return true;
          }
        }
      ]
    });
    await alert.present();
  }

  async mostrarSimulacion(name: string, monthly: number, tiempo: string, months: number) {
    const alert = await this.alertCtrl.create({
      header: '📊 Simulación',
      message: `
        Ahorrando <strong>$${monthly.toLocaleString('es-CL')}</strong> por mes,
        alcanzarías tu meta <strong>"${name}"</strong> en aproximadamente
        <strong>${tiempo}</strong> (${months} pagos).
      `,
      buttons: [{ text: 'Entendido', role: 'cancel' }]
    });
    await alert.present();
  }

  // ── Estado ────────────────────────────────────────────────────────

async cambiarEstado(goal: Goal) {
  const modal = await this.modalCtrl.create({
    component: GoalActionsComponent,
    componentProps: { goal, ufValue: this.ufValue },
    breakpoints: [0, 0.75],
    initialBreakpoint: 0.75,
  });

  await modal.present();

  const { data, role } = await modal.onWillDismiss();
  if (role !== 'action' || !data?.action) return;

  switch (data.action) {
    case 'aportar':   this.aportar(goal);   break;
    case 'simular':   this.simular(goal);   break;
    case 'editar':    this.editarMeta(goal); break;
    case 'pausar':    this.actualizarEstado(goal.id, 'paused');    break;
    case 'reactivar': this.actualizarEstado(goal.id, 'active');    break;
    case 'cancelar':  this.actualizarEstado(goal.id, 'cancelled'); break;
  }
}
  actualizarEstado(id: number, state: string) {
    this.http.patch(`${this.apiUrl}/goals/${id}/`, { state }).subscribe({
      next: () => this.cargarDatos(),
      error: () => {}
    });
  }

  async mostrarError(mensaje: string) {
    const alert = await this.alertCtrl.create({
      header: 'Error',
      message: mensaje,
      buttons: ['OK']
    });
    await alert.present();
  }

  // ── Helpers ───────────────────────────────────────────────────────

  get goalsActivas(): Goal[] {
    return this.goals.filter(g => g.state === 'active' || g.state === 'paused');
  }

  get goalsCompletadas(): Goal[] {
    return this.goals.filter(g => g.state === 'completed' || g.state === 'cancelled');
  }

  enUF(amount: number): string {
    if (!this.ufValue) return '—';
    return (amount / this.ufValue).toLocaleString('es-CL', { maximumFractionDigits: 2 });
  }
}