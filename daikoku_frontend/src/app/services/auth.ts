import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Observable, forkJoin, of } from 'rxjs';
import { delay } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  login(email: string, password: string) {
    return this.http.post<{ access: string; refresh: string }>(
      `${this.apiUrl}/auth/login/`,
      { email, password }
    ).pipe(
      tap(tokens => {
        localStorage.setItem('access_token', tokens.access);
        localStorage.setItem('refresh_token', tokens.refresh);
      })
    );
  }

logout() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
  localStorage.clear();
}

  getToken(): string | null {
    return localStorage.getItem('access_token');
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  register(username: string, email: string, password: string, password2: string) {
      return this.http.post(
        `${this.apiUrl}/auth/register/`,
        { username, email, password, password2 }
      );
    }

          getUser(): any {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    }

    isFullyRegistered(): boolean {
      const user = this.getUser();
      return user?.full_register === true;
    }

    createGoal(name: string, targetAmount: number, deadline?: string) {
  return this.http.post(
    `${this.apiUrl}/goals/`,
    { name, target_amount: targetAmount, deadline }
  );
}

    completeOnboarding(monthlyBudget: number) {
    return this.http.patch(
      `${this.apiUrl}/auth/onboarding/`,
      { monthly_budget: monthlyBudget }
    ).pipe(
      tap((user: any) => {
        localStorage.setItem('user', JSON.stringify(user));
      })
    );
}

  saveIngresos(ingresos: { nombre: string; monto: number; categoria: number }[]): Observable<any> {
  if (ingresos.length === 0) return of(null);

  const requests = ingresos.map(ingreso =>
    this.http.post(`${this.apiUrl}/transactions/`, {
      type: 'income',
      amount: ingreso.monto,
      description: ingreso.nombre,
      category: ingreso.categoria
    })
  );

  return forkJoin(requests);
}

  getUserFromBackend() {
    return this.http.get<any>(`${this.apiUrl}/auth/profile/`);
  }

  getCategories() {
  return this.http.get<any[]>(`${this.apiUrl}/categories/`);
}

  createCategory(category_name: string, category_icon: string) {
    return this.http.post(`${this.apiUrl}/categories/`, {
      category_name,
      category_icon
    });
}

  forgotPassword(email: string) {
  console.log('Recuperar contraseña para:', email);

  return of(true).pipe(delay(1000));
}

  updateProfile(username: string, email: string) {
    return this.http.patch(`${this.apiUrl}/auth/profile/`, {
      username,
      email
    });
}

  changePassword(oldPassword: string, newPassword: string) {
    return this.http.post(`${this.apiUrl}/auth/change-password/`, {
      old_password: oldPassword,
      new_password: newPassword
    });
  }

  googleLogin(credential: string): Observable<any> {
  return this.http.post<any>(`${this.apiUrl}/auth/google/`, { credential }).pipe(
    tap((res: any) => {
      localStorage.setItem('access_token', res.access);
      localStorage.setItem('refresh_token', res.refresh);
      localStorage.setItem('user', JSON.stringify(res.user));
    })
  );
}

    }

  


