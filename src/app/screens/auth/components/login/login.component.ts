import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import {
  FormGroup,
  FormBuilder,
  Validators,
  FormControl,
} from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastrService } from 'ngx-toastr';
import { Title } from '@angular/platform-browser';
import { FirebaseApp, initializeApp } from 'firebase/app';
import { Database, getDatabase, ref, set, onValue } from 'firebase/database';
import { HomeService } from 'src/app/screens/home/services/home.service';
import { ChatService } from 'src/app/screens/chatting/services/chat.service';
import { map } from 'rxjs';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  password = true;
  app!: FirebaseApp;
  db!: Database;
  returnPassword: boolean = false;
  loginForm: FormGroup = new FormGroup({});
  submited = false;
  loginloading = false;

  constructor(
    private fb: FormBuilder,
    private title: Title,
    private router: Router,
    private toastr: ToastrService,
    private authservice: AuthService,
    private homeService: HomeService,
    private chatService: ChatService
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

    this.loginForm = this.fb.group({
      email_phone: [
        '',
        [
          Validators.required,
          Validators.pattern(/^[569٥٦٩][\u0660-\u0669]{7}$|^[569٥٦٩]\d{7}$/),
        ],
      ],
      password: ['', Validators.required],
    });
  }
  login(value: any) {
    this.submited = true;
    if (this.loginForm.valid) {
      this.loginloading = true;
      this.authservice.login(value).subscribe(
        (res: any) => {
          localStorage.setItem('namnamToken', res?.meta?.token);
          localStorage.setItem('userid', res?.data?.id);
          localStorage.setItem(
            'username',
            `${res?.data?.fname} ${res?.data?.lname}`
          );
          localStorage.setItem('name_in_web', `${res?.data?.name_in_web} `);
          set(ref(this.db, `Auth/${res?.data?.id}`), {
            user_token: res?.meta?.token,
          });
          this.listenForTeacherMessages();
          this.loginloading = false;
          this.router.navigate(['/']);
          this.toastr.success('تم تسجيل الدخول بنجاح');
        },
        (err: any) => {
          this.loginloading = false;
        }
      );
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
