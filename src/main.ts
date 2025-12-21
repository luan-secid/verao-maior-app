import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
