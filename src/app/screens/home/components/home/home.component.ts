import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { HomeService } from '../../services/home.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  materials: any[] = [];

  loading = true;
  constructor(private homeService: HomeService, private title: Title) {}

  ngOnInit(): void {
    this.title.setTitle(` دراستي - ادرس وانت متطمن `);
    this.getHomeStages();
  }
  getHomeStages() {
    this.homeService.getHomeStages().subscribe((res: any) => {
      this.materials = res?.data;
      this.loading = false;
    });
  }
  get userName() {
    return localStorage.getItem('username');
  }
}
