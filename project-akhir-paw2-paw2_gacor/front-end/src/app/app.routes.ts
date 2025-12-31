import { Routes } from '@angular/router';
import { Home } from './home/home';
import { Login } from './login/login';
import { Recipe } from './recipe/recipe';
import { Register } from './register/register';
import { ReviewComponent } from './review/review';

export const routes: Routes = [
  {
    path: '',
    component: Home,
  },
  {
    path: 'login',
    component: Login,
  },
  {
    path: 'register',
    component: Register,
  },
  {
    path: 'recipe',
    component: Recipe,
  },
  {
    path: 'review',
    component: ReviewComponent,
  },
];
