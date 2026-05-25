import { Routes } from '@angular/router';
import { Home } from './home/home';

export const routes: Routes = [
  { path: '', component: Home, title: 'PneumaCare', pathMatch: 'full' },
  {
    path: '',
    loadChildren: () =>
      import('./legal/legal.routes').then(m => m.LEGAL_ROUTES),
  },
  { path: '**', redirectTo: '' },
];
