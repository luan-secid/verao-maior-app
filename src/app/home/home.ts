import { Component, Inject, OnDestroy, OnInit, PLATFORM_ID, signal } from '@angular/core';
import { MaterialModule } from '../core/angular/material.module';
import { User } from '../core/api/models/user.model';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../core/api/auth.service';
import { UserService } from '../core/api/user.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-home',
  imports: [MaterialModule],
  providers: [AuthService, UserService, Router, MatSnackBar, RouterLink, RouterLinkActive],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit {
  isloading = false;
  token: string = '';
  user: User = new User();
  currentIndex = signal(0); // Usando Signals para reatividade eficiente
  private intervalId: any;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private _authService: AuthService,
    private _userService: UserService,
    private _route: Router,
    private _snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.isloading = true;
    this.getUser();
    this.userValidate();
    this.getUserInfo();
    this.isloading = false;
  }

  getUser() {
    try {
      if (isPlatformBrowser(this.platformId)) {
        this.user.name = localStorage.getItem('nome')!;
        this.user.email = localStorage.getItem('email')!;
        this.token = localStorage.getItem('access_token')!;
      }
    } catch (error) {
      localStorage.clear();
      this._route.navigateByUrl('entrar');
    }
  }

  getUserInfo() {
    this._userService.getUserByEmail(this.user.email).subscribe({
      next: (response: User) => {
        this.user = response;
      },
      error: (err: any) => {
        this._snackBar.open('Erro ao buscar informações do usuário: ' + err.error.error, '', {
          duration: 2000,
        });
      },
    });
  }

  userValidate() {
    if (isPlatformBrowser(this.platformId)) {
      if (!this.token) {
        localStorage.clear();
        this._route.navigateByUrl('entrar');
      }
    }
  }

  logout() {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.clear();
      this._route.navigateByUrl('entrar');
    }
  }

}
