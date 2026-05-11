import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly KEY = 'cl_theme';
  readonly isDark = signal(false);

  constructor() {
    const saved  = localStorage.getItem(this.KEY);
    const dark   = saved === 'dark' ||
      (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
    this.apply(dark);
  }

  toggle(): void { this.apply(!this.isDark()); }

  private apply(dark: boolean): void {
    this.isDark.set(dark);
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    localStorage.setItem(this.KEY, dark ? 'dark' : 'light');
  }
}
