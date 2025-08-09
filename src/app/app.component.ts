import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FirebaseApp, initializeApp } from 'firebase/app';
import {
  Database,
  getDatabase,
  ref,
  set,
  onValue,
  query,
  limitToLast,
  onChildAdded,
} from 'firebase/database';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { HomeService } from './screens/home/services/home.service';
import { map } from 'rxjs';
import { ChatService } from './screens/chatting/services/chat.service';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  app!: FirebaseApp;
  db!: Database;
  savedToken: any;
  teacherId = localStorage.getItem('userid');
  constructor(
    private router: Router,
    private dbb: AngularFireDatabase,
    private homeService: HomeService,
    public chatService: ChatService
  ) {}

  ngOnInit(): void {
    this.app = initializeApp({
      apiKey: 'AIzaSyCrZO0tF5O5Ms8au460-tmGbNS3mJ6QrEc',
      authDomain: 'drasti-37a06.firebaseapp.com',
      databaseURL: 'https://drasti-37a06-default-rtdb.firebaseio.com',
      projectId: 'drasti-37a06',
      storageBucket: 'drasti-37a06.appspot.com',
      messagingSenderId: '850147128578',
      appId: '1:850147128578:web:2153add74417b85d4fbe1b',
      measurementId: 'G-41JEDDFQT2',
    });
    this.db = getDatabase(this.app);
    if (localStorage.getItem('userid')) {
      this.listenForTeacherMessages();
    }
  }
  listenForTeacherMessages() {
    // 1- أول حاجة: تجيب المواد المشترك فيها المدرس من الـ backend
    this.homeService
      .getHomeStages()
      .pipe(
        map((res: any) => {
          let data: any = [];
          if (res?.data?.length) {
            res?.data.forEach((element: any) => {
              data.push(String(element?.material?.id));
            });
          }
          return data;
        })
      )
      .subscribe((materialIds) => {
        this.chatService.listenForNewMessages(
          materialIds,
          localStorage.getItem('userid') || ''
        );
      });
  }
}
