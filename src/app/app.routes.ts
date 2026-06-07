import { Routes } from '@angular/router';
import { Home } from './home/home';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    component: Home,
    title: 'PneumaCare',
    pathMatch: 'full',
    canActivate: [authGuard],
  },
  {
    path: '',
    loadChildren: () =>
      import('./legal/legal.routes').then(m => m.LEGAL_ROUTES),
  },
  { path: '**', redirectTo: '' },
];
