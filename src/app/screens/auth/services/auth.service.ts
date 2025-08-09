import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  logoutloading = false;
  constructor(private http: HttpClient, private router: Router) {}
  login(body: any) {
    return this.http.post(`${environment.apiUrl}login_teacher`, body);
  }

  logout(): any {
    this.logoutloading = true;

    this.http.post(`${environment.apiUrl}logout`, {}).subscribe((res) => {
      // localStorage.removeItem('namnamToken');
      // localStorage.removeItem('userid');
      // localStorage.removeItem('username');
      localStorage.clear();
      this.router.navigate(['/auth/login']);
      this.logoutloading = false;
      window.location.reload();
    });
  }
}
