import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { MaterialModule } from '../core/angular/material.module';
import { User } from '../core/api/models/user.model';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../core/api/auth.service';
import { UserService } from '../core/api/user.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-home',
  imports: [MaterialModule],
  providers: [AuthService, UserService, Router, MatSnackBar, RouterLink, RouterLinkActive],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit, OnDestroy {
  isloading = false;
  token: string = '';
  user: User = new User();
  slides = [
    {
      image:
        'https://pikaso.cdnpk.net/private/production/2893158032/meu-campinho.png?token=exp=1766275200~hmac=cd7fca9297226d8e1052df5c7b12745a85881b43288fba8008bccb1751a95425&preview=1',
      title: 'Meu Campinho',
    },
    {
      image:
        'https://pikaso.cdnpk.net/private/production/2893410693/parana-em-obras.png?token=exp=1766275200~hmac=2c254f2d49533b06a947efccde5f84da3425b6aa1478f6581ebe5871b4f9c0f7&preview=1',
      title: 'Paraná em Obras',
    },
    {
      image:
        'https://pikaso.cdnpk.net/private/production/2893440584/conheca-secid.png?token=exp=1766275200~hmac=f45fcd98b7af6d5d639c70cddd260b5d8f82188247c5fa826a18ec748757e67e&preview=1',
      title: 'Conheça a SECID',
    },
  ];

  currentIndex = signal(0); // Usando Signals para reatividade eficiente
  private intervalId: any;

  constructor(
    private _authService: AuthService,
    private _userService: UserService,
    private _route: Router,
    private _snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.isloading = true;
    this.startAutoPlay();
    this.getUser();
    this.userValidate();
    this.getUserInfo();
    this.isloading = false;
  }

  getUser() {
    try {
      if (typeof window !== 'undefined') {
        this.user.name = localStorage.getItem('nome')!;
        this.user.email = localStorage.getItem('email')!;
        this.token = localStorage.getItem('access_token')!;
      };
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
    if (!this.token) {
      console.log('Necessário realizar login.');
      localStorage.clear();
      this._route.navigateByUrl('entrar');
    }
  }

  logout() {
    localStorage.clear();
    this._route.navigateByUrl('entrar');
  }

  ngOnDestroy() {
    this.stopAutoPlay();
  }

  startAutoPlay() {
    this.intervalId = setInterval(() => {
      this.nextSlide();
    }, 5000); // Troca a cada 5 segundos
  }

  stopAutoPlay() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  nextSlide() {
    this.currentIndex.update((index) => (index + 1) % this.slides.length);
  }

  prevSlide() {
    this.currentIndex.update((index) => (index - 1 + this.slides.length) % this.slides.length);
  }

  goToSlide(index: number) {
    this.currentIndex.set(index);
  }
}
