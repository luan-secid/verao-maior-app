import { Component, computed, inject, PLATFORM_ID, signal, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { MaterialModule } from '../core/angular/material.module';
import { AuthService } from '../core/api/auth.service';
import { UserService } from '../core/api/user.service';
import { User } from '../core/api/models/user.model';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { ResourceService } from '../core/api/resource.service';
import { Resource } from '../core/api/models/resource.model';
import { DatePipe, isPlatformBrowser } from '@angular/common';

interface Space {
  value: string;
  viewValue: string;
}

@Component({
  selector: 'app-schedule',
  standalone: true,
  imports: [MaterialModule, MatSelectModule, DatePipe, FormsModule, ReactiveFormsModule],
  providers: [AuthService, UserService, ResourceService],
  templateUrl: './schedule.html',
  styleUrl: './schedule.css',
})
export class Schedule implements OnInit {
  // --- Signals de Estado ---
  isLoading = signal(false);
  searchTerm = signal('');
  resources = signal<Resource[]>([]);

  // Armazena os nomes dos recursos que o usuário já agendou (ex: ['MEU CAMPINHO'])
  userSchedules = signal<string[]>([]);

  // Verifica se o espaço selecionado no Select já foi agendado pelo usuário
  isCurrentSpaceBooked = computed(() => {
    const selected = this.scheduleForm.get('selectedSpace')?.value;
    return this.userSchedules().includes(selected || '');
  });

  // --- Propriedades ---
  token: string = '';
  user: User = new User();
  private fb = inject(FormBuilder);
  private platformId = inject(PLATFORM_ID);

  spaces: Space[] = [
    { value: 'MEU CAMPINHO', viewValue: 'MEU CAMPINHO' },
    { value: 'PARANÁ EM OBRAS', viewValue: 'PARANÁ EM OBRAS' },
  ];

  scheduleForm = this.fb.group({
    name: [{ value: '', disabled: true }, [Validators.required]],
    email: [{ value: '', disabled: true }, [Validators.required]],
    phoneNumber: [{ value: '', disabled: true }, [Validators.required]],
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
  }

  getUser() {
    if (isPlatformBrowser(this.platformId)) {
      const email = localStorage.getItem('email');
      this.token = localStorage.getItem('access_token') || '';

      if (email) {
        this._userService.getUserByEmail(email).subscribe({
          next: (result) => {
            this.user = result;
            this.validateSchedule();
            this.validateHasSchedule(); // Busca agendamentos existentes
            this.isLoading.set(false);
          },
          error: () => {
            this._snackBar.open('Erro ao carregar perfil', 'Fechar', { duration: 3000 });
            this.isLoading.set(false);
          },
        });
      }
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
    this.scheduleForm.controls.hour.reset(); // Limpa seleção anterior de hora

    this._resourceService.getResourceByResource(event.value).subscribe({
      next: (result) => {
        const availableItems = result
          .filter((el) => el.status === 'DISPONÍVEL')
          .map((el) => ({
            ...el,
            date: new Date(el.date.toString().replace('Z', '')),
          }));

        this.resources.set(availableItems);
        this.isLoading.set(false);
      },
      error: () => {
        this._snackBar.open('Erro ao buscar horários', '', { duration: 2000 });
        this.isLoading.set(false);
      },
    });
  }

  scheduleFilter = computed(() => {
    const term = this.searchTerm().toLowerCase();
    const pipe = new DatePipe('pt-BR');
    return this.resources().filter((res) => {
      const formattedDate = pipe.transform(res.date, 'dd/MM/yyyy HH:mm', 'UTC') || '';
      return formattedDate.toLowerCase().includes(term);
    });
  });

  updateSearch(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerm.set(value);
  }

  validateHasSchedule() {
    this._resourceService.getResourceByUserId(this.user._id).subscribe({
      next: (result) => {
        // Mapeia apenas os nomes dos recursos que o usuário já tem reserva
        const bookedNames = result.map((res) => res.resource);
        this.userSchedules.set(bookedNames);
      },
      error: () => console.error('Erro ao validar agendamentos'),
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
    if (this.scheduleForm.invalid || this.isCurrentSpaceBooked()) return;

    const resourceId = this.scheduleForm.controls.hour.value!;
    const spaceName = this.scheduleForm.controls.selectedSpace.value!;
    this.isLoading.set(true);

    this._resourceService.getResourceById(resourceId).subscribe({
      next: (res) => {
        const updatedResource = {
          ...res,
          status: 'INDISPONÍVEL' as const,
          userId: this.user._id,
        };

        this._resourceService.editResourceById(resourceId, updatedResource).subscribe({
          next: () => {
            this._snackBar.open('Agendamento realizado com sucesso!', '', {
              duration: 5000,
              horizontalPosition: 'center',
              verticalPosition: 'bottom',
              panelClass: ['custom-snackbar-success']
            });
            window.location.reload();
            this.isLoading.set(false);
            this.scheduleForm.controls.hour.reset();
          },
          error: () => {
            this._snackBar.open('Erro ao confirmar.', '', { duration: 3000 });
            this.isLoading.set(false);
          },
          complete: () => {
            // Atualiza a lista de agendamentos do usuário
            const currentSchedules = this.userSchedules();
            this.userSchedules.set([...currentSchedules, spaceName]);
          },
        });
      },
      error: () => this.isLoading.set(false),
    });
  }

  // Funções auxiliares mantidas
  getUserInfo() {
    this._userService.getUserByEmail(this.user.email).subscribe({
      next: (result) => (this.user = result),
      error: () => this._snackBar.open('Erro ao buscar info do usuário'),
    });
  }

  getScheduleInfo(): Promise<any> {
    return new Promise((resolve) => {
      const id = this.scheduleForm.controls.hour.value;
      if (!id) return resolve(new Date());
      this._resourceService.getResourceById(id).subscribe({
        next: (res) => resolve(res.date),
        error: () => resolve(new Date()),
      });
    });
  }

  async registerSchedule() {
    const date = await this.getScheduleInfo();
    const resource = new Resource();
    resource.resource = this.scheduleForm.controls.selectedSpace.value!;
    resource.date = date;
    resource.status = 'INDISPONÍVEL';
    resource.userId = this.user._id;
  }
}
