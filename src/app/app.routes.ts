import { Routes } from '@angular/router';
import { Home } from './home/home';
import { authGuard } from './core/auth/auth.guard';
import { roleGuard } from './core/auth/role.guard';
import { BedsCreate } from './beds-create/beds-create';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/login/login').then(m => m.Login),
    title: 'Iniciar sesión | PneumaCare',
  },
  {
    path: 'register',
    loadComponent: () => import('./features/register/register').then(m => m.Register),
    title: 'Crear cuenta | PneumaCare',
  },
  {
    path: '',
    component: Home,
    title: 'PneumaCare',
    pathMatch: 'full',
    canActivate: [authGuard],
  },
  {
    path: 'account',
    loadComponent: () => import('./features/account/account').then(m => m.Account),
    title: 'Mi cuenta | PneumaCare',
    canActivate: [authGuard],
  },
  {
    path: 'analytics',
    loadComponent: () => import('./features/analytics/analytics').then(m => m.Analytics),
    title: 'Analítica | PneumaCare',
    canActivate: [authGuard],
  },
  {
    path: 'users',
    loadComponent: () => import('./features/users/users').then(m => m.Users),
    title: 'Usuarios | PneumaCare',
    canActivate: [authGuard, roleGuard('ROLE_ADMIN', 'ROLE_CHIEF_OF_GUARD')],
  },
  {
    path: 'beds/new',
    component: BedsCreate,
    title: 'Nueva cama | PneumaCare',
    canActivate: [authGuard],
  },
  {
    path: 'patients/:id',
    loadComponent: () =>
      import('./patient-detail/patient-detail').then(m => m.PatientDetail),
    title: 'Historia clínica | PneumaCare',
    canActivate: [authGuard],
  },
  {
    path: '',
    loadChildren: () =>
      import('./legal/legal.routes').then(m => m.LEGAL_ROUTES),
  },
  { path: '**', redirectTo: '' },
];
