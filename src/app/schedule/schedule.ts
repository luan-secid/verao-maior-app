import { Component, computed, Inject, inject, PLATFORM_ID, signal, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { MaterialModule } from '../core/angular/material.module';
import { AuthService } from '../core/api/auth.service';
import { UserService } from '../core/api/user.service';
import { User } from '../core/api/models/user.model';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { ResourceService } from '../core/api/resource.service';
import { Resource } from '../core/api/models/resource.model';
import { HttpErrorResponse } from '@angular/common/http';
import { DatePipe, isPlatformBrowser } from '@angular/common';

interface Space {
  value: string;
  viewValue: string;
}

@Component({
  selector: 'app-schedule',
  standalone: true, // Definido como standalone conforme padrão Angular 19
  imports: [MaterialModule, MatSelectModule, DatePipe, FormsModule, ReactiveFormsModule],
  providers: [
    AuthService,
    UserService,
    ResourceService,
    // Router e SnackBar não precisam estar nos providers aqui se já estiverem no app.config
  ],
  templateUrl: './schedule.html',
  styleUrl: './schedule.css',
})
export class Schedule implements OnInit {
  // --- Signals de Estado ---
  isLoading = signal(false);
  searchTerm = signal('');
  resources = signal<Resource[]>([]);
  resource = new Resource();

  // --- Propriedades ---
  token: string = '';
  hasSchedule = signal(false); // Transformado em signal para UX reativa
  user: User = new User();
  private fb = inject(FormBuilder);
  private platformId = inject(PLATFORM_ID);

  spaces: Space[] = [
    { value: 'MEU CAMPINHO', viewValue: 'MEU CAMPINHO' },
    { value: 'PARANÁ EM OBRAS', viewValue: 'PARANÁ EM OBRAS' },
  ];

  scheduleForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    phoneNumber: ['', [Validators.required, Validators.minLength(6)]],
    selectedSpace: ['', [Validators.required]],
    hour: ['', [Validators.required]],
  });

  constructor(
    private _userService: UserService,
    private _resourceService: ResourceService,
    private _route: Router,
    private _snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.isLoading.set(true);
    this.getUser();
    this.userValidate();
    // O isLoading será desativado dentro do callback do getUser para melhor UX
  }

  getUser() {
    try {
      if (isPlatformBrowser(this.platformId)) {
        this.user.name = localStorage.getItem('nome') || '';
        this.user.email = localStorage.getItem('email') || '';
        this.token = localStorage.getItem('access_token') || '';
      }

      if (!this.user.email) return;

      this._userService.getUserByEmail(this.user.email).subscribe({
        next: (result) => {
          this.user = result;
          this.validateHasSchedule();
          this.isLoading.set(false);
        },
        error: (err: HttpErrorResponse) => {
          this._snackBar.open('Erro ao buscar as informações do usuário', 'Fechar', {
            duration: 3000,
          });
          this.isLoading.set(false);
        },
      });
    } catch (error) {
      this.logout();
    }
  }

  userValidate() {
    if (isPlatformBrowser(this.platformId) && !this.token) {
      this.logout();
    }
  }

  getResources(event: MatSelectChange) {
    this.isLoading.set(true);
    this.scheduleForm.controls.selectedSpace.setValue(event.value);

    this._resourceService.getResourceByResource(event.value).subscribe({
      next: (result) => {
        // CORREÇÃO: Limpa a lista antes de adicionar novos para evitar duplicidade na tela
        const availableItems = result
          .filter((el) => el.status === 'DISPONÍVEL')
          .map((el) => ({
            ...el,
            // Tratamento do fuso horário que discutimos (Removendo o Z para ignorar "esperteza" do Angular)
            date: new Date(el.date.toString().replace('Z', '')),
          }));

        this.resources.set(availableItems);
        this.validateSchedule();
        this.isLoading.set(false);
      },
      error: () => {
        this._snackBar.open('Erro ao buscar horários', '', { duration: 2000 });
        this.isLoading.set(false);
      },
    });
  }

  // Otimizado: Agora filtra pela string formatada da data para facilitar a busca do usuário
  scheduleFilter = computed(() => {
    const term = this.searchTerm().toLowerCase();
    const pipe = new DatePipe('pt-BR');

    return this.resources().filter((res) => {
      const formattedDate = pipe.transform(res.date, 'dd/MM/yyyy HH:mm') || '';
      return formattedDate.toLowerCase().includes(term);
    });
  });

  updateSearch(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerm.set(value);
  }

  validateDisponibility(event: MatSelectChange) {
    this.scheduleForm.controls.hour.setValue(event.value);
  }

  validateHasSchedule() {
    this._resourceService.getResourceByUserId(this.user._id).subscribe({
      next: (result: Resource[]) => {
        this.hasSchedule.set(result.length > 0);
      },
      error: () => {
        console.error('Erro ao validar agendamentos existentes');
      },
    });
  }

  validateSchedule() {
    this.scheduleForm.patchValue({
      email: this.user.email,
      name: this.user.name,
      phoneNumber: this.user.phoneNumber,
    });
  }

  logout() {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.clear();
    }
    this._route.navigateByUrl('entrar');
  }

  onSubmit() {
    if (this.scheduleForm.invalid) {
      this._snackBar.open('Por favor, selecione um horário.', '', { duration: 2000 });
      return;
    }
    const _id = this.scheduleForm.value.hour?.toString() || '';
    this._resourceService.getResourceById(_id, 'body', true).subscribe({
      next: (res) => {
        this.resource = res;
        this.resource.status = 'INDISPONÍVEL';
        this.resource.userId = this.user._id;

        this._resourceService.editResourceById(this.resource._id || '', this.resource).subscribe({
          next: () => {
            this._snackBar.open('Agendamento realizado com sucesso!', '', { duration: 3000 });
            this.hasSchedule.set(true);
            this.resources.set(this.resources().filter((r) => r._id !== this.resource._id));
          },
          error: () => {
            this._snackBar.open('Erro ao confirmar agendamento.', '', { duration: 3000 });
          },
        });
      },
      error: () => {
        this._snackBar.open('Erro ao processar agendamento.', '', { duration: 3000 });
      },
    });
    console.log('Dados para agendamento:', this.scheduleForm.value);
  }
}
