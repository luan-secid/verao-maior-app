import { Component, signal, viewChild, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatStepper, MatStepperModule } from '@angular/material/stepper';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { CepService } from '../core/api/cep.service';
import { UserService } from '../core/api/user.service';
import { User } from '../core/api/models/user.model';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-subscribe',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatStepperModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
  ],
  providers: [CepService, UserService],
  templateUrl: './subscribe.html',
  styleUrl: './subscribe.css',
})
export class Subscribe {
  hidePassword = signal(true);
  stepper = viewChild.required(MatStepper);
  protected user = new User();
  private snackBarService = inject(MatSnackBar);
  private router = inject(Router);
  private _cepService = inject(CepService);
  private _userService = inject(UserService);

  // Organizado por sub-grupos para facilitar a validação de cada passo
  subscribeForm = new FormGroup({
    personal: new FormGroup({
      name: new FormControl('', Validators.required),
      email: new FormControl('', [Validators.required, Validators.email]),
      phoneNumber: new FormControl('', Validators.required),
      birthday: new FormControl('', Validators.required),
    }),
    address: new FormGroup({
      zipcode: new FormControl('', Validators.required),
      city: new FormControl('', Validators.required),
      state: new FormControl('', Validators.required),
    }),
    security: new FormGroup({
      password: new FormControl('', Validators.required),
      confirmPassword: new FormControl('', Validators.required),
    }),
  });

  constructor() {}

  get personalGroup() {
    return this.subscribeForm.get('personal') as FormGroup;
  }
  get addressGroup() {
    return this.subscribeForm.get('address') as FormGroup;
  }
  get securityGroup() {
    return this.subscribeForm.get('security') as FormGroup;
  }

  onSubmit() {
    if (this.subscribeForm.valid) {
      console.log('Dados do formulário:', this.subscribeForm.value);
    }
    this.user.birthday = this.personalGroup.get('birthday')?.value;
    this.user.city = this.addressGroup.get('city')?.value;
    this.user.state = this.addressGroup.get('state')?.value;
    this.user.email = this.personalGroup.get('email')?.value;
    this.user.name = this.personalGroup.get('name')?.value;
    this.user.phoneNumber = this.personalGroup.get('phoneNumber')?.value;
    this.user.password = this.securityGroup.get('password')?.value;
    this._userService.createAnUser(this.user).subscribe({
      next: () => {
        this.snackBarService.open('Usuário criado com sucesso!', 'Fechar', { duration: 3000 });
        this.router.navigate(['/entrar']);
      },
      error: (error: HttpErrorResponse) => {
        this.snackBarService.open('Erro ao criar o usuário: ' + error.message, 'Fechar', {
          duration: 3000,
        });
      },
    });
  }

  getZipcode() {
    this._cepService.getAddressByCep(this.addressGroup.get('zipcode')?.value).subscribe({
      next: (data) => {
        this.addressGroup.get('city')?.setValue(data.city);
        this.addressGroup.get('state')?.setValue(data.state);
      },
      error: (error) => {
        console.error('Erro ao buscar o CEP:', error);
      },
    });
  }
}
