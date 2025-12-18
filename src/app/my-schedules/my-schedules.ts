import { Component, OnInit } from '@angular/core';
import { MaterialModule } from '../core/angular/material.module';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../core/api/auth.service';
import { UserService } from '../core/api/user.service';
import { User } from '../core/api/models/user.model';
import { HttpErrorResponse } from '@angular/common/http';
import { ResourceService } from '../core/api/resource.service';
import { Resource } from '../core/api/models/resource.model';
import { DatePipe } from '@angular/common';
import { debug } from 'console';

@Component({
  selector: 'app-my-schedules',
  imports: [MaterialModule, DatePipe],
  providers: [AuthService, UserService, ResourceService, Router, MatSnackBar, RouterLink, RouterLinkActive],
  templateUrl: './my-schedules.html',
  styleUrl: './my-schedules.css',
})
export class MySchedules implements OnInit {
  token: string = "";
  user: User = new User;
  resources: Resource[] = [];
  resource: Resource = new Resource;

  constructor(
    private _authService: AuthService,
    private _userService: UserService,
    private _resourceService: ResourceService,
    private _route: Router,
    private _snackBar: MatSnackBar
  ) {

  }

  ngOnInit() {
    this.getUser();
    this.userValidate();
  }

  getUser() {
    try {
      this.user.name = localStorage.getItem('nome')!;
      this.user.email = localStorage.getItem('email')!;
      this.token = localStorage.getItem('access_token')!;
      this._userService.getUserByEmail(this.user.email).subscribe({
        next: (result: User) => {
          this.user = result;
          try {
            this.getSchedules();
          } catch (error) {
            this._snackBar.open("Não foi possível validar suas informações.", "", { duration: 2000 });
          }

        },
        error: (err: HttpErrorResponse) => {
          this._snackBar.open("Não foi possível validar suas informações.", "", { duration: 2000 });
        },
        complete: () => {
          this.getSchedules()
        }
      })
    } catch (error) {
      localStorage.clear();
      this._route.navigateByUrl('entrar')
    }
  }

  getSchedules() {
    this._resourceService.getResourceByUserId(this.user._id).subscribe({
      next: (result: Resource[]) => {
        this.resources = result;
      },
      error: (err: HttpErrorResponse) => {
        this._snackBar.open("Não foi possível validar suas informações.", "", { duration: 2000 });
      },
      complete: () => {
        return this.resources
      }
    })
  }

  getResource(id: string) {
    this._resourceService.getResourceById(id).subscribe({
      next: (result: Resource) => {
        this.resource = result;
        console.log(this.resource);
      },
      error: (err: HttpErrorResponse) => {
        this._snackBar.open("Não foi possível validar suas informações.", "", { duration: 2000 });
      },
      complete: () => {
        return this.resource
      }
    })
  }

  deleteSchedule(event: Event) {
    const elemento = event.target as HTMLButtonElement;
    this.getResource(elemento.value);
    console.debug()
    console.log(this.resource);
    this.resource.userId = "";
    this.resource.status = "DISPONÍVEL"
    console.log(this.resource);
    this._resourceService.editResourceById(this.resource._id, this.resource).subscribe({
      next: (result) => {
        this._snackBar.open("Horário cancelado com sucesso!", "", { duration: 2000 });
        this.getUser();
      },
      error: (err: HttpErrorResponse) => {
        this._snackBar.open("Não foi possível cancelar horário.", "", { duration: 2000 });
      },
      complete: () => {
        return this.resource
      }
    })
  }

  userValidate() {
    if (!this.token) {
      console.log('Necessário realizar login.');
      localStorage.clear();
      this._route.navigateByUrl('entrar')
    }
  }

  logout() {
    localStorage.clear();
    this._route.navigateByUrl('entrar')
  }

}
