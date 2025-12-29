import { Component, Inject, OnInit, PLATFORM_ID, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpErrorResponse } from '@angular/common/http';

import { MaterialModule } from '../core/angular/material.module';
import { AuthService } from '../core/api/auth.service';
import { UserService } from '../core/api/user.service';
import { Auth } from '../core/api/models/auth.model';
import { isPlatformBrowser } from '@angular/common';
import packageInfo from './../../../package.json';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [MaterialModule, ReactiveFormsModule],
  providers: [UserService, AuthService],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login implements OnInit {
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private fb = inject(FormBuilder);
  appVersion = packageInfo.version;
  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  loadingPage = signal(false);
  hide = signal(true);
  isLoading = signal(false);

  authForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  ngOnInit(): void {
    this.isLoading.set(true);
    this.checkSession();
    this.isLoading.set(false);
  }

  private checkSession() {
    if (isPlatformBrowser(this.platformId)) {
      if (localStorage.getItem('access_token')) {
        this.router.navigate(['/inicio']);
      }
    }
  }

  submit(event: MouseEvent) {
    event.preventDefault();
    if (this.authForm.invalid) return;
    this.isLoading.set(true);
    const loginData: Auth = this.authForm.getRawValue();

    this.authService.userLoginPost(loginData).subscribe({
      next: (response: any) => {
        this.saveSession(response.access_token, response.payload);
        window.location.reload();
        this.router.navigate(['/inicio']).then(() => {
          this.snackBar.open('Bem-vindo!', 'OK', { duration: 3000 });
        });
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading.set(false);
        const errorMsg = err.error?.error || 'Falha na conexão';
        this.snackBar.open('Erro de login: ' + errorMsg, 'Fechar', { duration: 4000 });
      },
      complete: () => this.isLoading.set(false),
    });
  }

  private saveSession(token: string, payload: any) {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('access_token', token);
      localStorage.setItem('email', payload.sub);
      localStorage.setItem('nome', payload.username);
    }
  }

  toggleHide(event: MouseEvent) {
    event.preventDefault();
    this.hide.update((v) => !v);
  }
}
