import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MaterialModule } from './core/angular/material.module';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { UserService } from './core/api/user.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, MaterialModule],
  providers: [HttpClient, UserService],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('veraomaior-app');
}
