import { Component, Inject, inject, OnInit, PLATFORM_ID, signal } from '@angular/core';
import { MaterialModule } from '../core/angular/material.module';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../core/api/auth.service';
import { UserService } from '../core/api/user.service';
import { User } from '../core/api/models/user.model';
import { HttpErrorResponse } from '@angular/common/http';
import { ResourceService } from '../core/api/resource.service';
import { Resource } from '../core/api/models/resource.model';
import { isPlatformBrowser, DatePipe } from '@angular/common';

@Component({
  selector: 'app-my-schedules',
  standalone: true,
  imports: [MaterialModule, DatePipe], // Adicionado DatePipe para o HTML
  providers: [
    AuthService,
    UserService,
    ResourceService
  ],
  templateUrl: './my-schedules.html',
  styleUrl: './my-schedules.css',
})
export class MySchedules implements OnInit {
  // --- Signals para reatividade e performance ---
  resources = signal<Resource[]>([]);
  isLoading = signal(false);

  token: string = '';
  user: User = new User();
  private platformId = inject(PLATFORM_ID);

  constructor(
    private _userService: UserService,
    private _resourceService: ResourceService,
    private _route: Router,
    private _snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.userValidate();
    this.getUserData();
  }

  userValidate() {
    if (isPlatformBrowser(this.platformId)) {
      this.token = localStorage.getItem('access_token') || '';
      if (!this.token) {
        this.logout();
      }
    }
  }

  getUserData() {
    if (isPlatformBrowser(this.platformId)) {
      const email = localStorage.getItem('email') || '';
      if (!email) return;

      this.isLoading.set(true);
      this._userService.getUserByEmail(email).subscribe({
        next: (result) => {
          this.user = result;
          this.loadSchedules();
        },
        error: () => {
          this._snackBar.open('Erro ao validar sessão.', '', { duration: 2000 });
          this.isLoading.set(false);
        }
      });
    }
  }

  loadSchedules() {
    this._resourceService.getResourceByUserId(this.user._id).subscribe({
      next: (result) => {
        // Tratamento de fuso horário (UTC) para exibição correta
        const treatedResources = result.map(res => ({
          ...res,
          date: new Date(res.date.toString().replace('Z', ''))
        }));
        this.resources.set(treatedResources);
        this.isLoading.set(false);
      },
      error: () => {
        this._snackBar.open('Erro ao carregar seus agendamentos.', '', { duration: 2000 });
        this.isLoading.set(false);
      }
    });
  }

  // Refatorado para garantir a ordem lógica: Primeiro busca, depois deleta
  cancelSchedule(resourceId: string) {
    this._snackBar.open('Cancelando horário...', '', { duration: 1000 });

    this._resourceService.getResourceById(resourceId).subscribe({
      next: (res) => {
        // Prepara o objeto para "limpar" o vínculo com o usuário
        const updatedResource = {
          ...res,
          userId: '',
          status: 'DISPONÍVEL' as const
        };

        this._resourceService.editResourceById(resourceId, updatedResource).subscribe({
          next: () => {
            this._snackBar.open('Horário cancelado com sucesso!', '', { duration: 2000 });
            // Atualiza a lista localmente (Performance: remove sem precisar de novo GET)
            this.resources.update(list => list.filter(r => r._id !== resourceId));
          },
          error: () => this._snackBar.open('Erro ao cancelar.', '', { duration: 2000 })
        });
      }
    });
  }

  logout() {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.clear();
    }
    this._route.navigateByUrl('entrar');
  }
}
