import {
  Component,
  computed,
  inject,
  Inject,
  model,
  OnInit,
  PLATFORM_ID,
  resource,
  signal,
} from '@angular/core';
import { MaterialModule } from '../core/angular/material.module';
import { User } from '../core/api/models/user.model';
import { AuthService } from '../core/api/auth.service';
import { UserService } from '../core/api/user.service';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DatePipe, isPlatformBrowser } from '@angular/common';
import { ResourceService } from '../core/api/resource.service';
import { Resource } from '../core/api/models/resource.model';
import { MatTableModule } from '@angular/material/table';
import { Scheduled } from '../core/api/models/scheduled.model';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-administrator',
  standalone: true,
  imports: [MaterialModule, MatTableModule, DatePipe],
  providers: [AuthService, UserService, ResourceService],
  templateUrl: './administrator.html',
  styleUrl: './administrator.css',
})
export class Administrator implements OnInit {
  isloading = false;
  token: string = '';
  user: User = new User();
  readonly dialog = inject(MatDialog);
  rawSchedules = signal<Scheduled[]>([]);
  scheduled = signal<Scheduled>(new Scheduled());
  searchQuery = signal<string>('');
  dataSource = computed(() => {
    const query = this.searchQuery().toLowerCase();
    const data = this.rawSchedules();
    if (!query) return data;

    return data.filter(
      (s) => s.name?.toLowerCase().includes(query) || s.resourceName?.toLowerCase().includes(query)
    );
  });

  displayedColumns: string[] = ['nome', 'horario', 'atividade', 'acao'];

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private _userService: UserService,
    private _resourceService: ResourceService,
    private _route: Router,
    private _snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.isloading = true;
    this.getUser();
    this.userValidate();
    this.loadData();
    this.isloading = false;
  }

  openDialog(agendamento: Scheduled): void {
    this.scheduled.set(agendamento);
    const dialogRef = this.dialog.open(CancelDialog, {
      data: agendamento,
      height: '300px',
      width: '600px',
    });

    dialogRef.afterClosed().subscribe((result: boolean) => {
      console.log(agendamento);
      if (result) {
        this.executarCancelamento(agendamento);
        console.log('A atividade foi enviada para cancelamento.');
      } else {
        console.log('A atividade não foi cancelada.');
      }
    });
  }

  loadData() {
    this._resourceService.getAllResources().subscribe({
      next: (resources: Resource[]) => {
        const unavailable = resources.filter((r) => r.status === 'INDISPONÍVEL');
        this.rawSchedules.set([]);

        unavailable.forEach((res) => {
          this._userService.getUserById(res.userId!).subscribe({
            next: (u: User) => {
              const item: Scheduled = {
                resourceId: res._id,
                name: u.name,
                resourceName: res.resource,
                horario: res.date!,
                status: res.status,
                userId: res.userId,
              };
              console.log(this.rawSchedules);

              this.rawSchedules.update((prev) => [...prev, item]);
            },
          });
        });
      },
    });
  }

  applyFilter(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.searchQuery.set(value);
  }

  getUser() {
    if (isPlatformBrowser(this.platformId)) {
      this.token = localStorage.getItem('access_token') || '';
      this.user.email = localStorage.getItem('email') || '';
    }
  }

  userValidate() {
    if (isPlatformBrowser(this.platformId) && !this.token) {
      this._route.navigateByUrl('entrar');
    }
  }

  confirmarCancelamento(agendamento: Scheduled) {
    if (confirm(`Deseja realmente cancelar o agendamento de ${agendamento.name}?`)) {
      this.executarCancelamento(agendamento);
    }
  }

  private executarCancelamento(agendamento: Scheduled) {
    console.log(agendamento);
    const selectedResource: Resource = {} as Resource;
    selectedResource.status = 'DISPONÍVEL';
    selectedResource.userId = '';
    selectedResource._id = agendamento.resourceId!;
    console.log(selectedResource);

    this._resourceService.editResourceById(agendamento.resourceId!, selectedResource).subscribe({
      next: () => {
        this.rawSchedules.update((lista) =>
          lista.filter((item) => item.resourceId !== agendamento.resourceId)
        );

        this._snackBar.open('Agendamento cancelado com sucesso!', 'Fechar', {
          duration: 3000,
          panelClass: ['success-snackbar'],
        });
        this.isloading = false;
      },
      error: (err) => {
        this._snackBar.open('Erro ao cancelar: ' + err.error.message, 'OK');
        this.isloading = false;
      },
    });
  }

  logout() {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('email');
      this._route.navigateByUrl('entrar');
    }
  }
}
@Component({
  selector: 'cancel-dialog',
  templateUrl: 'cancel.dialog.html',
  imports: [MaterialModule, DatePipe],
})
export class CancelDialog {
  readonly dialogRef = inject(MatDialogRef<CancelDialog>);
  readonly data = inject<Scheduled>(MAT_DIALOG_DATA);
  scheduled = model<Scheduled>(this.data);

  onNoClick(): void {
    this.dialogRef.close();
  }
}
