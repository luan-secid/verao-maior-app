import { Component, signal } from '@angular/core';
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
  hide = signal(true);
  isLinear = true;

  subscribeForm = new FormGroup({
    name: new FormControl('', Validators.required),
    age: new FormControl(''),
    birthday: new FormControl(new Date()),
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
        this.subscribeForm.controls.city.setValue(response.city.toUpperCase());
        this.subscribeForm.controls.state.setValue(response.state.toUpperCase());
        this._snackBar.open('Sucesso!', 'Localidade encontrada.', { duration: 2000 });
      },
      error: (err: HttpErrorResponse) => {
        this._snackBar.open('Erro de login: ' + err.error.error, '', { duration: 2000 });
      },
    });
  }

  onSubmit(): void {
    if (this.subscribeForm.valid) {
      this.subscribedUser.name = this.subscribeForm.controls.name.value!;
      this.subscribedUser.birthday = this.subscribeForm.controls.birthday.value!;
      this.subscribedUser.password = this.subscribeForm.controls.password.value!;
      this.subscribedUser.email = this.subscribeForm.controls.email.value!;
      this.subscribedUser.phoneNumber = this.subscribeForm.controls.phoneNumber.value!.toString();
      this.subscribedUser.state = this.subscribeForm.controls.state.value!;
      this.subscribedUser.type = 'user';
      this.subscribedUser.city = this.subscribeForm.controls.city.value!;
      this._userService.createAnUser(this.subscribedUser).subscribe({
        next: (response: User) => {
          console.log(response);
          this._snackBar.open('Usuário criado com sucesso!', '', { duration: 2000 });
          this._router.navigate(['/entrar']);
        },
        error: (err: HttpErrorResponse) => {
          this._snackBar.open('Erro ao criar usuário: ' + err.error.error, '', { duration: 2000 });
        },
      });
    } else {
      this._snackBar.open('Formulário inválido. Verifique os dados.', '', { duration: 2000 });
    }
  }

  passwordValidation(): boolean {
    return this.subscribeForm.controls.password.value === this.subscribeForm.controls.checkPassword.value;
  }

  toggleVisibility(event: MouseEvent) {
    this.hide.update(value => !value);
    event.stopPropagation();
  }
}
