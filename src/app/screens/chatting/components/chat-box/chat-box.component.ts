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
  ChangeDetectorRef,
} from '@angular/core';
import { FirebaseApp, initializeApp } from 'firebase/app';
import {
  Database,
  getDatabase,
  ref,
  set,
  onValue,
  remove,
} from 'firebase/database';

import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { DatePipe } from '@angular/common';
import { DomSanitizer, Title } from '@angular/platform-browser';
import { ChatService } from '../../services/chat.service';
import { HttpService } from '../../services/http.service';
import localeAr from '@angular/common/locales/ar';
import { registerLocaleData } from '@angular/common';
import { ToastrService } from 'ngx-toastr';

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
  private currentAudio: HTMLAudioElement | null = null;
  imageLoading = false;
  selectedMsgToDelete = '';
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
  localMsgs: any = [];
  constructor(
    private sanitizer: DomSanitizer,
    private toastr: ToastrService,
    private angularFireStore: AngularFireStorage,
    private datepipe: DatePipe,
    private afs: AngularFirestore,
    private title: Title,
    private http: HttpService,
    private cd: ChangeDetectorRef
  ) {}
  ngOnChanges(changes: SimpleChanges): void {
    this.messages = [...this.messages, ...this.localMsgs];
    this.messages = this.messages.sort(function (a: any, b: any) {
      let left: any = new Date(a.date);
      let right: any = new Date(b.date);
      return left - right;
    });
    console.log(this.messages);
    this.cd.detectChanges();
    this.scrollChatBox();
  }
  getSafeUrl(url: string): any {
    return this.sanitizer.bypassSecurityTrustUrl(url);
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
    const input = event.target as HTMLInputElement;

    if (!input.files || input.files.length === 0) {
      this.toastr.error('لم يتم اختيار أي ملف');
      return;
    }

    const file = input.files[0];

    if (!file.type.startsWith('image/')) {
      this.toastr.error('الملف المحدد ليس صورة!');
      return;
    }
    const maxSizeInBytes = 50 * 1024 * 1024;
    if (file.size > maxSizeInBytes) {
      this.toastr.error('حجم الصورة يجب ألا يتجاوز 50 ميجا');
      return;
    }
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
          console.log('cancel');
          this.imageLoading = false;
          this.scrollChatBox();
        });
        this.scrollChatBox();
      });
    });
  }
  loading() {
    // this.imageLoading = true;
    // this.cd.detectChanges();
  }
  async sendAudio(event: { audio: any; duration: any }) {
    this.nowRecording = false;
    let date = new Date();
    const tempId = 'local-' + Date.now();
    const localUrl = URL.createObjectURL(event.audio); // Local preview
    this.localMsgs.push({
      date: this.datepipe.transform(date, 'yyyy-MM-dd HH:mm:ss'),
      id: tempId,
      message_content: localUrl,
      duration: event.duration,
      isUploading: true,
      did_read: false,
      from: localStorage.getItem('username'),
      from_display_name: localStorage.getItem('name_in_web'),
      from_number: localStorage.getItem('userphone'),
      from_id: localStorage.getItem('userid'),
      material_name: this.studentDetails?.materialName,
      to: this.studentDetails?.studentName,
      to_id: `${this.studentDetails?.studentId}`,
      type: 'audio',
    });
    this.messages = [...this.messages, ...this.localMsgs];
    this.messages = this.messages.sort(function (a: any, b: any) {
      let left: any = new Date(a.date);
      let right: any = new Date(b.date);
      return left - right;
    });
    this.scrollChatBox();
    this.cd.detectChanges();
    this.scrollChatBox();
    let reference = this.angularFireStore.ref(
      'message_images/' +
        `voice_message_${this.datepipe.transform(
          new Date(),
          'yyyy-MM-dd HH:mm:ss'
        )}.wav`
    );
    // this.imageLoading = true;
    this.scrollChatBox();
    const wavBlob = await this.convertToWav(event.audio);

    reference.put(wavBlob).then(() => {
      reference.getDownloadURL().subscribe((audioUrl) => {
        console.log(audioUrl);
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
          console.log(tempId);
          this.messages = this.messages.filter((m) => m.id !== tempId);
          this.localMsgs = this.localMsgs.filter((m: any) => m.id !== tempId);
          this.imageLoading = false;
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
    console.log(this.messages);
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
  }

  sendMessage(input: any) {
    let inputValue = input.value;
    if (inputValue.toString().trim().length > 0) {
      let date = new Date();
      console.log(this.studentDetails);
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
  onAudioPlay(player: HTMLAudioElement): void {
    // لو فيه صوت شغال بالفعل، نوقفه
    if (this.currentAudio && this.currentAudio !== player) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0; // نرجعه للبداية
    }

    // نخزن الصوت الجديد كالحالي
    this.currentAudio = player;
  }
  async convertToWav(blob: Blob): Promise<Blob> {
    const audioCtx = new AudioContext();
    const arrayBuffer = await blob.arrayBuffer();
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

    const wavBuffer = this.audioBufferToWav(audioBuffer);
    return new Blob([wavBuffer], { type: 'audio/wav' });
  }

  // تحويل الـ AudioBuffer لـ wav
  audioBufferToWav(buffer: AudioBuffer) {
    const numOfChannels = buffer.numberOfChannels;
    const length = buffer.length * numOfChannels * 2 + 44;
    const result = new ArrayBuffer(length);
    const view = new DataView(result);

    const channels = [];
    let sample;
    let offset = 0;
    let pos = 0;

    // write WAV header
    setUint32(0x46464952); // "RIFF"
    setUint32(length - 8); // file length - 8
    setUint32(0x45564157); // "WAVE"

    setUint32(0x20746d66); // "fmt " chunk
    setUint32(16); // length = 16
    setUint16(1); // PCM (uncompressed)
    setUint16(numOfChannels);
    setUint32(buffer.sampleRate);
    setUint32(buffer.sampleRate * 2 * numOfChannels); // avg. bytes/sec
    setUint16(numOfChannels * 2); // block-align
    setUint16(16); // 16-bit
    setUint32(0x61746164); // "data" - chunk
    setUint32(length - pos - 4); // chunk length

    // write interleaved data
    for (let i = 0; i < buffer.numberOfChannels; i++)
      channels.push(buffer.getChannelData(i));

    while (pos < length) {
      for (let i = 0; i < numOfChannels; i++) {
        sample = Math.max(-1, Math.min(1, channels[i][offset])); // clamp
        sample = sample < 0 ? sample * 0x8000 : sample * 0x7fff; // scale
        view.setInt16(pos, sample, true); // write 16-bit sample
        pos += 2;
      }
      offset++;
    }

    return result;

    function setUint16(data: any) {
      view.setUint16(pos, data, true);
      pos += 2;
    }
    function setUint32(data: any) {
      view.setUint32(pos, data, true);
      pos += 4;
    }
  }
  deleteMsgLoading = false;
  deleteMessage(msg: any) {
    if (
      !this.studentDetails.materialId ||
      !this.studentDetails.studentId ||
      !msg.key
    ) {
      console.log('s');
      return;
    }
    this.deleteMsgLoading = true;
    const messageRef = ref(
      this.db,
      `Subjects-Messages/${this.studentDetails.materialId}/${this.studentDetails.studentId}/${msg.key}`
    );

    remove(messageRef)
      .then(() => {
        // let msgIndex = this.messages.findIndex((i) => i.key == msg.key);
        // this.messages.splice(msgIndex, 1);
        console.log('Message deleted successfully');
        this.selectedMsgToDelete = '';
        this.deleteMsgLoading = false;
      })
      .catch((error) => {
        this.deleteMsgLoading = false;
        console.error('Error deleting message:', error);
      });
  }
}
