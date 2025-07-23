import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
  LOCALE_ID,
} from '@angular/core';
import { FirebaseApp, initializeApp } from 'firebase/app';
import { Database, getDatabase, ref, set, onValue } from 'firebase/database';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { DatePipe } from '@angular/common';
import { Title } from '@angular/platform-browser';
import { ChatService } from '../../services/chat.service';
import { HttpService } from '../../services/http.service';
import localeAr from '@angular/common/locales/ar';
import { registerLocaleData } from '@angular/common';

registerLocaleData(localeAr); // تسجيل اللغة
@Component({
  selector: 'app-chat-box',
  templateUrl: './chat-box.component.html',
  styleUrls: ['./chat-box.component.scss'],
  providers: [
    { provide: LOCALE_ID, useValue: 'ar' }, // تحديد اللغة الافتراضية
  ],
})
export class ChatBoxComponent implements OnInit, OnChanges {
  imageLoading = false;
  currentImage = '';
  @ViewChild('boxchat2') boxchat!: ElementRef;
  micrphonAlert = false;
  nowRecording = false;
  showaudio = true;
  @Input() messages: any[] = [];
  @Input() studentName = '';
  app!: FirebaseApp;
  db!: Database;
  studentDetails!: {
    studentName: any;
    studentId: any;
    materialName: string;
    materialId: string;
  };
  @Output() closeChat = new EventEmitter<void>();
  constructor(
    private angularFireStore: AngularFireStorage,
    private datepipe: DatePipe,
    private afs: AngularFirestore,
    private title: Title,
    private http: HttpService
  ) {}
  ngOnChanges(changes: SimpleChanges): void {
    this.scrollChatBox();
  }
  scrollChatBox() {
    setTimeout(() => {
      if (this.boxchat) {
        this.boxchat.nativeElement.scrollTop =
          this.boxchat.nativeElement.scrollHeight;
      }
    }, 10);
  }
  ngAfterViewInit(): void {}
  onImageChange(event: any) {
    const img: any = event?.target?.files[0];
    let reference = this.angularFireStore.ref(
      'message_images/' +
        `photo_message_${this.datepipe.transform(
          new Date(),
          'yyyy-MM-dd HH:mm:ss'
        )}`
    );
    this.imageLoading = true;
    this.scrollChatBox();
    reference.put(img).then(() => {
      reference.getDownloadURL().subscribe((imageurl) => {
        let date = new Date();
        set(
          ref(
            this.db,
            `Subjects-Messages/${this.studentDetails?.materialId}/${
              this.studentDetails?.studentId
            }/${this.afs.createId()}`
          ),
          {
            date: this.datepipe.transform(date, 'yyyy-MM-dd HH:mm:ss'),
            did_read: false,
            from: localStorage.getItem('username'),
            from_display_name: localStorage.getItem('name_in_web'),
            from_number: localStorage.getItem('userphone'),
            from_id: localStorage.getItem('userid'),
            message_content: imageurl,
            material_name: this.studentDetails?.materialName,
            to: this.studentDetails?.studentName,
            to_id: `${this.studentDetails?.studentId}`,
            type: 'photo',
          }
        ).then(() => {
          this.http
            .addAnswer({
              material_id: this.studentDetails.materialId,
              answer: 'صورة',
              student_id: this.studentDetails.studentId,
            })
            .subscribe();
          this.imageLoading = false;
        });
        this.scrollChatBox();
      });
    });
  }
  sendAudio(event: { audio: any; duration: any }) {
    this.nowRecording = false;
    let reference = this.angularFireStore.ref(
      'message_images/' +
        `voice_message_${this.datepipe.transform(
          new Date(),
          'yyyy-MM-dd HH:mm:ss'
        )}`
    );
    reference.put(event.audio).then(() => {
      reference.getDownloadURL().subscribe((audioUrl) => {
        console.log(audioUrl);
        let date = new Date();
        set(
          ref(
            this.db,
            `Subjects-Messages/${this.studentDetails?.materialId}/${
              this.studentDetails?.studentId
            }/${this.afs.createId()}`
          ),
          {
            date: this.datepipe.transform(date, 'yyyy-MM-dd HH:mm:ss'),
            did_read: false,
            duration: `${event.duration}`,
            from: localStorage.getItem('username'),
            from_display_name: localStorage.getItem('name_in_web'),
            from_number: localStorage.getItem('userphone'),
            from_id: localStorage.getItem('userid'),
            message_content: audioUrl,
            material_name: this.studentDetails?.materialName,
            to: this.studentDetails?.studentName,
            to_id: `${this.studentDetails?.studentId}`,
            type: 'audio',
          }
        ).then(() => {
          this.http
            .addAnswer({
              material_id: this.studentDetails.materialId,
              answer: 'رسالة صوتية',
              student_id: this.studentDetails.studentId,
            })
            .subscribe();
        });
        this.scrollChatBox();
      });
    });
  }
  ngOnInit(): void {
    const firebaseConfig = {
      apiKey: 'AIzaSyCrZO0tF5O5Ms8au460-tmGbNS3mJ6QrEc',
      authDomain: 'drasti-37a06.firebaseapp.com',
      databaseURL: 'https://drasti-37a06-default-rtdb.firebaseio.com',
      projectId: 'drasti-37a06',
      storageBucket: 'drasti-37a06.appspot.com',
      messagingSenderId: '850147128578',
      appId: '1:850147128578:web:2153add74417b85d4fbe1b',
      measurementId: 'G-41JEDDFQT2',
    };
    const app = initializeApp(firebaseConfig);
    this.db = getDatabase(app);
    window.scroll(0, 0);
    this.title.setTitle(`NAMNAM`);

    this.messages = this.messages.sort(function (a: any, b: any) {
      let left: any = new Date(a.date);
      let right: any = new Date(b.date);
      return left - right;
    });
    let user = this.messages.find(
      (item) =>
        item.from_id != localStorage.getItem('userid') &&
        item.from_id != '_1' &&
        !item.from_display_name
    );
    this.studentDetails = {
      studentName: user.from,
      studentId: user.from_id,
      materialName: user.to,
      materialId: user.to_id,
    };
    console.log(
      this.messages.filter(
        (item) =>
          item.from_id != localStorage.getItem('userid') && item.from_id != '_1'
      )
    );
    console.log(user);
  }

  sendMessage(input: any) {
    let inputValue = input.value;
    if (inputValue.toString().trim().length > 0) {
      let date = new Date();
      set(
        ref(
          this.db,
          `Subjects-Messages/${this.studentDetails?.materialId}/${
            this.studentDetails?.studentId
          }/${this.afs.createId()}`
        ),
        {
          did_read: false,
          date: this.datepipe.transform(date, 'yyyy-MM-dd HH:mm:ss'),
          from: localStorage.getItem('username'),
          from_display_name: localStorage.getItem('name_in_web'),
          from_number: localStorage.getItem('userphone'),
          from_id: localStorage.getItem('userid'),
          message_content: inputValue,
          material_name: this.studentDetails?.materialName,
          to: this.studentDetails?.studentName,
          to_id: `${this.studentDetails?.studentId}`,
          type: 'text',
        }
      ).then(() => {
        this.http
          .addAnswer({
            material_id: this.studentDetails.materialId,
            answer: inputValue,
            student_id: this.studentDetails.studentId,
          })
          .subscribe();
      });
      input.value = '';
      this.scrollChatBox();
    }
  }
  get userid() {
    return localStorage.getItem('userid');
  }
  downloadImage() {
    fetch(this.currentImage)
      .then((res) => res.blob())
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'downloaded-image.' + 'png';
        a.click();
        URL.revokeObjectURL(url);
      })
      .catch((err) => console.error('Download failed:', err));
  }
  @HostListener('document:keydown.escape', ['$event'])
  onEscape(event: KeyboardEvent) {
    this.currentImage = '';
  }
}
