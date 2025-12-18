import { Component, OnInit } from '@angular/core';
import { MaterialModule } from '../core/angular/material.module';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Auth } from '../core/api/models/auth.model';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserService } from '../core/api/user.service';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../core/api/auth.service';

@Component({
  selector: 'app-login',
  imports: [MaterialModule, FormsModule, ReactiveFormsModule],
  providers: [UserService, AuthService],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login implements OnInit {
  email = ''
  password = ''
  auth: Auth = new Auth()
  hide = true

  constructor(
    private _authService: AuthService,
    private _userService: UserService,
    private _route: Router,
    private _snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.userValidate()
  }

  public authForm = new FormGroup ({
    email: new FormControl('', Validators.email),
    password: new FormControl('', Validators.required),
  })

  onSubmit() {

    if (this.email && this.password) {
      console.log('Dados de Login Submetidos:');
      console.log('Email:', this.email);
      console.log('Password:', this.password);

    } else {
      console.error('Por favor, preencha todos os campos.');
    }
  }

  getUser(): Auth {
      this.auth.email = this.authForm.controls.email.value!
      this.auth.password = this.authForm.controls.password.value!
      return this.auth
  }

  userValidate() {
    if (localStorage.getItem('access_token')) {
      this._route.navigateByUrl('inicio');
    }
  }

  setToken(access_token: string, payload: { sub: string, username: string }) {
    localStorage.setItem('access_token', access_token);
    localStorage.setItem('email', payload.sub);
    localStorage.setItem('nome', payload.username);
  }

  submit() {
    this.getUser();
    console.log(true);
    console.log(this.authForm.controls.email.value)
    console.log(this.authForm.controls.password.value)
    return this._authService.userLoginPost(this.auth).subscribe({
      next: (response: any) => {
       this.setToken(response.access_token, response.payload);
       this._route.navigated
       this.userValidate();
       window.location.reload();
      },
      error: (err: HttpErrorResponse) => {
        this._snackBar.open("Erro de login: " + err.error.error, '', { duration: 2000 });
      },
    });
  }

}
