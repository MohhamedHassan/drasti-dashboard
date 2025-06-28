import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AllMsgsService {
  constructor(private http: HttpClient) {}
  getTeacherMaterials() {
    return this.http.get(`${environment.apiUrl}teacher/materials`);
  }
}
