import { Component, Inject, inject, PLATFORM_ID } from '@angular/core';
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
  imports: [MaterialModule, MatSelectModule, DatePipe],
  providers: [
    AuthService,
    UserService,
    ResourceService,
    Router,
    MatSnackBar,
    RouterLink,
    RouterLinkActive,
    FormsModule,
    ReactiveFormsModule,
  ],
  templateUrl: './schedule.html',
  styleUrl: './schedule.css',
})
export class Schedule {
  token: string = '';
  hasSchedule: boolean = false;
  user: User = new User();
  private fb = inject(FormBuilder);
  spaces: Space[] = [
    { value: 'MEU CAMPINHO', viewValue: 'MEU CAMPINHO' },
    { value: 'PARANÁ EM OBRAS', viewValue: 'PARANÁ EM OBRAS' },
  ];
  resources: Resource[] = [];
  resource: Resource = new Resource();
  scheduleForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    phoneNumber: ['', [Validators.required, Validators.minLength(6)]],
    selectedSpace: ['', [Validators.required]],
    hour: ['', [Validators.required]],
  });

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private _authService: AuthService,
    private _userService: UserService,
    private _resourceService: ResourceService,
    private _route: Router,
    private _snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.getUser();
    this.userValidate();
  }

  getUser() {
    try {
      if (isPlatformBrowser(this.platformId)) {
        this.user.name = localStorage.getItem('nome')!;
        this.user.email = localStorage.getItem('email')!;
        this.token = localStorage.getItem('access_token')!;
      }
      this._userService.getUserByEmail(this.user.email).subscribe({
        next: (result) => {
          this.user = result;
          this.validateHasSchedule();
        },
        error: (err: HttpErrorResponse) => {
          this._snackBar.open('Erro ao buscar as informações do usuário', '', { duration: 2000 });
        },
      });
    } catch (error) {
      localStorage.clear();
      this._route.navigateByUrl('entrar');
    }
  }

  userValidate() {
    if (!this.token) {
      console.log('Necessário realizar login.');
      localStorage.clear();
      this._route.navigateByUrl('entrar');
    }
  }

  getResources(event: MatSelectChange) {
    const now: Date = new Date();
    this.scheduleForm.controls.selectedSpace.setValue(event.value);
    this._resourceService.getResourceByResource(event.value).subscribe({
      next: (result) => {
        result.forEach((element) => {
          if (element.status === 'DISPONÍVEL') {
            this.resources.push(element);
            this.validateSchedule();
          }
        });
      },
      error: (err: HttpErrorResponse) => {
        this._snackBar.open('Erro ao buscar horários', '', { duration: 2000 });
      },
    });
  }

  validateDisponibility(event: MatSelectChange) {
    this.scheduleForm.controls.hour.setValue(event.value);
    console.log(this.scheduleForm.value);
  }

  validateHasSchedule() {
    this._resourceService.getResourceByUserId(this.user._id).subscribe({
      next: (result: Resource[]) => {
        if (result.length > 0) {
          this.hasSchedule = true;
        } else {
          this.hasSchedule = false;
        }
      },
      error: (err: HttpErrorResponse) => {
        this._snackBar.open('Não foi possível validar se usuário já possui horários.', '', {
          duration: 2000,
        });
      },
    });
  }

  validateSchedule() {
    this.scheduleForm.controls.email.setValue(this.user.email);
    this.scheduleForm.controls.name.setValue(this.user.name);
    this.scheduleForm.controls.phoneNumber.setValue(this.user.phoneNumber);
  }

  logout() {
    localStorage.clear();
    this._route.navigateByUrl('entrar');
  }

  onSubmit() {
    this._resourceService.getResourceById(this.scheduleForm.controls.hour.value!).subscribe({
      next: (result) => {
        this.resource.date = result.date;
      },
      error: (err: HttpErrorResponse) => {
        this._snackBar.open('Erro ao validar horários', '', { duration: 2000 });
      },
    });
    this.resource._id = this.scheduleForm.controls.hour.value!;
    this.resource.status = 'INDISPONÍVEL';
    this.resource.userId = this.user._id;
    this.resource.resource = this.scheduleForm.controls.selectedSpace.value!;
    try {
      this._resourceService.editResourceById(this.resource._id, this.resource).subscribe({
        next: (result) => {
          this._snackBar.open('Horário agendado com sucesso!', '', { duration: 3000 });
          this.scheduleForm.reset;
          window.location.reload();
        },
        error: (err: HttpErrorResponse) => {
          this._snackBar.open('Erro ao validar horários', '', { duration: 2000 });
        },
      });
    } catch (error) {
      this._snackBar.open('Horário selecionado não está disponível.', '', { duration: 2000 });
    }
  }
}
