import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonIcon,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonSpinner,
  IonDatetime,
  IonPopover
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  barChartOutline,
  pieChartOutline,
  calendarOutline,
  arrowUpOutline,
  arrowDownOutline,
  trendingUpOutline,
  chevronDownOutline
} from 'ionicons/icons';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

interface CategoryStat {
  category_name: string;
  category_icon: string;
  total: number;
  count: number;
  percentage: number;
}

@Component({
  selector: 'app-statistics',
  templateUrl: './statistics.page.html',
  styleUrls: ['./statistics.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DecimalPipe,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonIcon,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonSpinner,
    IonDatetime,
    IonPopover
  ]
})
export class StatisticsPage implements OnInit, AfterViewInit {

  @ViewChild('donutChart') donutRef!: ElementRef;
  @ViewChild('barChart') barRef!: ElementRef;

  vistaActual = 'gastos';
  loading = false;
  periodoBarras: 'mes' | 'semana' | 'dia' = 'mes';

  months: { label: string; value: string }[] = [];
  selectedMonth = '';

  totalIngresos = 0;
  totalGastos = 0;
  balance = 0;
  categoryStats: CategoryStat[] = [];

  private donutChart: any = null;
  private barChart: any = null;
  private apiUrl = environment.apiUrl;

  readonly COLORS = [
    '#5FDD9D',
    '#76F7BF',
    '#91F9E5',
    '#499167',
    '#3F4531',
    '#84EEA3',
    '#AAFFA9',
    '#2bae66',
    '#d9534f',
    '#f0a500'
  ];

  constructor(private http: HttpClient) {
    addIcons({
      barChartOutline,
      pieChartOutline,
      calendarOutline,
      arrowUpOutline,
      arrowDownOutline,
      trendingUpOutline,
      chevronDownOutline
    });

    this.generarMeses();
  }

  ngOnInit() {
    this.cargarDatos();
  }

  ngAfterViewInit() {}

  generarMeses() {
    const hoy = new Date();

    for (let i = 0; i < 6; i++) {
      const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);

      const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

      const label = d.toLocaleString('es-CL', {
        month: 'long',
        year: 'numeric'
      });

      this.months.push({
        label: label.charAt(0).toUpperCase() + label.slice(1),
        value
      });
    }

    this.selectedMonth = this.months[0].value;
  }

  get selectedMonthLabel(): string {
    if (!this.selectedMonth) return 'Seleccionar mes';

    const [year, month] = this.selectedMonth.split('-').map(Number);
    const date = new Date(year, month - 1, 1);

    const label = date.toLocaleString('es-CL', {
      month: 'long',
      year: 'numeric'
    });

    return label.charAt(0).toUpperCase() + label.slice(1);
  }

  onDateChange(event: any) {
    const value = event.detail.value;

    if (!value) return;

    const selectedValue = Array.isArray(value) ? value[0] : value;

    this.selectedMonth = String(selectedValue).substring(0, 7);
    this.cargarDatos();
  }

  onMonthChange() {
    this.cargarDatos();
  }

  onVistaChange() {
    this.cargarDatos();
  }

  onPeriodoChange() {
    this.cargarDatosBarras();
  }

  cargarDatos() {
    this.loading = true;

    const tipo = this.vistaActual === 'gastos' ? 'expense' : 'income';

    this.http.get<any>(`${this.apiUrl}/transactions/summary/?month=${this.selectedMonth}`).subscribe({
      next: data => {
        this.totalIngresos = Number(data.total_income ?? 0);
        this.totalGastos = Number(data.total_expenses ?? 0);
        this.balance = this.totalIngresos - this.totalGastos;
      },
      error: () => {
        this.totalIngresos = 0;
        this.totalGastos = 0;
        this.balance = 0;
      }
    });

    this.http.get<any[]>(`${this.apiUrl}/transactions/?month=${this.selectedMonth}&type=${tipo}`).subscribe({
      next: txs => {
        this.categoryStats = this.procesarPorCategoria(txs ?? []);
        this.loading = false;

        setTimeout(() => {
          this.renderDonut();
          this.cargarDatosBarras();
        }, 100);
      },
      error: () => {
        this.categoryStats = [];
        this.loading = false;
      }
    });
  }

  cargarDatosBarras() {
    const tipo = this.vistaActual === 'gastos' ? 'expense' : 'income';

    if (this.periodoBarras === 'mes') {
      const promises = this.months.slice(0, 6).map(m =>
        this.http
          .get<any[]>(`${this.apiUrl}/transactions/?month=${m.value}&type=${tipo}`)
          .toPromise()
      );

      Promise.all(promises).then(results => {
        const labels = this.months
          .slice(0, 6)
          .map(m => m.label.slice(0, 3))
          .reverse();

        const data = (results as any[][])
          .reverse()
          .map(txs =>
            (txs ?? []).reduce((s: number, t: any) => s + Number(t.amount ?? 0), 0)
          );

        this.renderBar(labels, data);
      });

      return;
    }

    if (this.periodoBarras === 'semana') {
      this.http.get<any[]>(`${this.apiUrl}/transactions/?month=${this.selectedMonth}&type=${tipo}`).subscribe({
        next: txs => {
          const semanas: { [key: string]: number } = {
            'Sem 1': 0,
            'Sem 2': 0,
            'Sem 3': 0,
            'Sem 4': 0,
            'Sem 5': 0
          };

          for (const tx of txs ?? []) {
            const day = new Date(tx.date).getDate();
            const amount = Number(tx.amount ?? 0);

            if (day <= 7) {
              semanas['Sem 1'] += amount;
            } else if (day <= 14) {
              semanas['Sem 2'] += amount;
            } else if (day <= 21) {
              semanas['Sem 3'] += amount;
            } else if (day <= 28) {
              semanas['Sem 4'] += amount;
            } else {
              semanas['Sem 5'] += amount;
            }
          }

          this.renderBar(Object.keys(semanas), Object.values(semanas));
        },
        error: () => {
          this.renderBar([], []);
        }
      });

      return;
    }

    this.http.get<any[]>(`${this.apiUrl}/transactions/?month=${this.selectedMonth}&type=${tipo}`).subscribe({
      next: txs => {
        const [year, month] = this.selectedMonth.split('-').map(Number);
        const ultimoDia = new Date(year, month, 0).getDate();

        const dias: { [key: string]: number } = {};

        for (let day = 1; day <= ultimoDia; day++) {
          const key = `${day}/${month}`;
          dias[key] = 0;
        }

        for (const tx of txs ?? []) {
          const d = new Date(tx.date);
          const key = `${d.getDate()}/${d.getMonth() + 1}`;

          if (dias[key] !== undefined) {
            dias[key] += Number(tx.amount ?? 0);
          }
        }

        this.renderBar(Object.keys(dias), Object.values(dias));
      },
      error: () => {
        this.renderBar([], []);
      }
    });
  }

  procesarPorCategoria(txs: any[]): CategoryStat[] {
    const map = new Map<string, { total: number; count: number; icon: string }>();
    const total = txs.reduce((s, t) => s + Number(t.amount ?? 0), 0);

    for (const tx of txs) {
      const name = tx.category_name ?? 'Sin categoría';
      const icon = tx.category_icon ?? 'cash-outline';
      const amount = Number(tx.amount ?? 0);

      if (!map.has(name)) {
        map.set(name, {
          total: 0,
          count: 0,
          icon
        });
      }

      const entry = map.get(name)!;
      entry.total += amount;
      entry.count++;
    }

    return Array.from(map.entries())
      .map(([name, v]) => ({
        category_name: name,
        category_icon: v.icon,
        total: v.total,
        count: v.count,
        percentage: total > 0 ? (v.total / total) * 100 : 0
      }))
      .sort((a, b) => b.total - a.total);
  }

  renderDonut() {
    if (!this.donutRef) return;

    if (this.donutChart) {
      this.donutChart.destroy();
    }

    const ctx = this.donutRef.nativeElement.getContext('2d');

    this.donutChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: this.categoryStats.map(c => c.category_name),
        datasets: [
          {
            data: this.categoryStats.map(c => c.total),
            backgroundColor: this.COLORS.slice(0, this.categoryStats.length),
            borderWidth: 0,
            hoverOffset: 8
          }
        ]
      },
      options: {
        responsive: true,
        cutout: '72%',
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: (ctx: any) => ` $${Number(ctx.raw).toLocaleString('es-CL')}`
            }
          }
        }
      }
    } as any);
  }

  renderBar(labels: string[], datos: number[]) {
    if (!this.barRef) return;

    if (this.barChart) {
      this.barChart.destroy();
    }

    const ctx = this.barRef.nativeElement.getContext('2d');

    this.barChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            data: datos,
            backgroundColor: this.COLORS[0],
            borderRadius: 10,
            borderSkipped: false
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: (ctx: any) => ` $${Number(ctx.raw).toLocaleString('es-CL')}`
            }
          }
        },
        scales: {
          x: {
            grid: {
              display: false
            },
            ticks: {
              color: '#499167',
              font: {
                weight: 'bold'
              }
            }
          },
          y: {
            grid: {
              color: 'rgba(0,0,0,0.04)'
            },
            ticks: {
              color: '#777',
              callback: (v: any) => `$${Number(v).toLocaleString('es-CL')}`
            }
          }
        }
      }
    } as any);
  }

  get totalCategorias(): number {
    return this.categoryStats.reduce((s, c) => s + c.total, 0);
  }
}