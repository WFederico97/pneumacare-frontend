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
    path: 'shifts',
    loadComponent: () => import('./features/shifts/shifts').then(m => m.Shifts),
    title: 'Turnos | PneumaCare',
    canActivate: [authGuard],
  },
  {
    path: 'alerts',
    loadComponent: () => import('./features/alerts/alerts').then(m => m.Alerts),
    title: 'Alertas | PneumaCare',
    canActivate: [authGuard],
  },
  {
    path: 'executive',
    loadComponent: () => import('./features/executive/executive').then(m => m.Executive),
    title: 'Panel ejecutivo | PneumaCare',
    canActivate: [authGuard, roleGuard('ROLE_DIRECTOR', 'ROLE_ADMIN', 'ROLE_CHIEF_OF_GUARD')],
  },
  {
    path: 'users',
    loadComponent: () => import('./features/users/users').then(m => m.Users),
    title: 'Usuarios | PneumaCare',
    canActivate: [authGuard, roleGuard('ROLE_ADMIN', 'ROLE_CHIEF_OF_GUARD')],
  },
  {
    path: 'ventilators',
    loadComponent: () => import('./features/ventilators/ventilators').then(m => m.Ventilators),
    title: 'Ventiladores | PneumaCare',
    canActivate: [authGuard, roleGuard('ROLE_ADMIN', 'ROLE_CHIEF_OF_GUARD')],
  },
  {
    path: 'settings',
    loadComponent: () => import('./features/settings/settings').then(m => m.Settings),
    title: 'Configuración | PneumaCare',
    canActivate: [authGuard, roleGuard('ROLE_ADMIN')],
  },
  {
    path: 'beds/new',
    component: BedsCreate,
    title: 'Nueva cama | PneumaCare',
    canActivate: [authGuard],
  },
  {
    path: 'patients',
    loadComponent: () => import('./features/patients/patients').then(m => m.Patients),
    title: 'Pacientes | PneumaCare',
    pathMatch: 'full',
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
