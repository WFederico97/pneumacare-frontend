import { Routes } from '@angular/router';

export const LEGAL_ROUTES: Routes = [
  {
    path: 'terms',
    loadComponent: () => import('./terms/terms').then(m => m.Terms),
    title: 'Términos y Condiciones — PneumaCare',
  },
  {
    path: 'faq',
    loadComponent: () => import('./faq/faq').then(m => m.Faq),
    title: 'Preguntas Frecuentes — PneumaCare',
  },
];
