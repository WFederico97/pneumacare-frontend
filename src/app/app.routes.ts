import { Routes } from '@angular/router';
import { Home } from './home/home';
import { authGuard } from './core/guards/auth.guard';
import { BedsCreate } from './beds-create/beds-create';

export const routes: Routes = [
  {
    path: '',
    component: Home,
    title: 'PneumaCare',
    pathMatch: 'full',
    canActivate: [authGuard],
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
