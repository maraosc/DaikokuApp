import { HttpInterceptorFn } from '@angular/common/http';

const PUBLIC_URLS = ['/auth/login/', '/auth/register/'];

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const isPublic = PUBLIC_URLS.some(url => req.url.includes(url));

  if (isPublic) {
    return next(req);
  }

  const token = localStorage.getItem('access_token');

  if (token) {
    const cloned = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`)
    });
    return next(cloned);
  }

  return next(req);
};