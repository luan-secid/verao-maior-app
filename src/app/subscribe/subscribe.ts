import { Component } from '@angular/core';
import { MaterialModule } from '../core/angular/material.module';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { User } from '../core/api/models/user.model';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../core/api/auth.service';
import { UserService } from '../core/api/user.service';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { CepService } from '../core/api/cep.service';
import { HttpErrorResponse } from '@angular/common/http';
import { Zipcode } from '../core/api/models/zipcode.model';
import { response } from 'express';

@Component({
  selector: 'app-subscribe',
  imports: [MaterialModule, FormsModule, ReactiveFormsModule],
  providers: [UserService, AuthService, CepService, RouterLink, RouterOutlet],
  templateUrl: './subscribe.html',
  styleUrl: './subscribe.css',
})
export class Subscribe {
  subscribedUser: User = new User();
  isLinear = true;

  subscribeForm = new FormGroup({
    name: new FormControl('', Validators.required),
    age: new FormControl(''),
    birthday: new FormControl(''),
    password: new FormControl('', Validators.required),
    checkPassword: new FormControl('', Validators.required),
    email: new FormControl('', Validators.required),
    phoneNumber: new FormControl('', Validators.required),
    zipcode: new FormControl('', Validators.required),
    state: new FormControl('', Validators.required),
    city: new FormControl('', Validators.required),
  });

  constructor(
    protected _authService: AuthService,
    protected _userService: UserService,
    protected _cepService: CepService,
    private _formBuilder: FormBuilder,
    private _snackBar: MatSnackBar,
    private _router: Router
  ) {}

  ngOnInit(): void {}

  passwordMatchValidator(form: FormGroup): null | { mismatch: boolean } {
    const senha = form.get('senha')?.value;
    const confirmaSenha = form.get('confirmaSenha')?.value;

    return senha === confirmaSenha ? null : { mismatch: true };
  }

  executarPesquisa(): void {}

  get controls() {
    return this.subscribeForm.controls;
  }

  getCity() {
    const zipcode = this.subscribeForm.controls.zipcode.value!;
    this._cepService.getAddressByCep(zipcode).subscribe({
      next: (response: Zipcode) => {
        console.log(response);
        // this.subscribeForm.controls.city.setValue(response.localidade);
        // this.subscribeForm.controls.state.setValue(response.estado);
        this._snackBar.open('Sucesso!', 'Localidade encontrada.', { duration: 2000 });
      },
      error: (err: HttpErrorResponse) => {
        this._snackBar.open('Erro de login: ' + err.error.error, '', { duration: 2000 });
      },
    });
  }

  onSubmit(): void {
    if (this.subscribeForm.valid) {
      const { name, email, password } = this.subscribeForm.value;
    } else {
      this.subscribeForm.markAllAsTouched();
    }
  }
}
