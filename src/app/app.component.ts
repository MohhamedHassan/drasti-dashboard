import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FirebaseApp, initializeApp } from 'firebase/app';
import { Database, getDatabase, ref, set, onValue } from 'firebase/database';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  app!: FirebaseApp;
  db!: Database;
  savedToken: any;

  constructor(private router: Router) {}

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
    if (!!localStorage.getItem('drastitoken')) {
      set(ref(this.db, `Auth/${localStorage.getItem('userid')}`), {
        user_token: localStorage.getItem('drastitoken'),
      });
    }
    const authRef = ref(this.db, 'Auth');
    onValue(authRef, (snapshot: any) => {
      if (!!localStorage.getItem('drastitoken')) {
        const data = snapshot.val();
        for (let i in data) {
          if (i == localStorage.getItem('userid')) this.savedToken = data[i];
        }
        if (
          this.savedToken?.user_token != localStorage.getItem('drastitoken')
        ) {
          localStorage.removeItem('drastitoken');
          localStorage.removeItem('userid');
          localStorage.removeItem('username');
          this.router.navigate(['/']);
        }
      }
    });
  }
}
