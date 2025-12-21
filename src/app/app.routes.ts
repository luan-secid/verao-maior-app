import { Routes } from '@angular/router';
import { Login } from './login/login';
import { Home } from './home/home';
import { Subscribe } from './subscribe/subscribe';
import { Schedule } from './schedule/schedule';
import { MySchedules } from './my-schedules/my-schedules';
import { MyData } from './my-data/my-data';

export const routes: Routes = [
    { path: 'entrar', component: Login },
    { path: 'inicio', component: Home },
    { path: 'registrar', component: Subscribe },
    { path: 'agendar', component: Schedule },
    { path: 'meus-agendamentos', component: MySchedules },
    { path: 'meus-dados', component: MyData },
    { path: '', redirectTo: '/entrar', pathMatch: 'full' }, // Redirect to login by default
    { path: '**', redirectTo: '/entrar' }
];
