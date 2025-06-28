import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
@Injectable({
  providedIn: 'root',
})
export class HttpService {
  constructor(private http: HttpClient) {}
  addAnswer(payload: {
    material_id: string;
    answer: string;
    student_id: string;
  }) {
    return this.http.post(`${environment.apiUrl}add_answer`, payload);
  }
}
