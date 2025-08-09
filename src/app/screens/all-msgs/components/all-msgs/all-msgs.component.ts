import { HttpClient } from '@angular/common/http';
import { Component, OnInit, LOCALE_ID } from '@angular/core';
import localeAr from '@angular/common/locales/ar';
import { registerLocaleData } from '@angular/common';
import {
  ChatService,
  StudentChatItem,
} from 'src/app/screens/chatting/services/chat.service';
import { environment } from 'src/environments/environment';
import { AllMsgsService } from '../../services/all-msgs.service';
registerLocaleData(localeAr); // تسجيل اللغة
@Component({
  selector: 'app-all-msgs',
  templateUrl: './all-msgs.component.html',
  styleUrls: ['./all-msgs.component.scss'],
  providers: [
    { provide: LOCALE_ID, useValue: 'ar' }, // تحديد اللغة الافتراضية
  ],
})
export class AllMsgsComponent implements OnInit {
  studentsList: any[] = [];

  loading = true;
  teacherId = localStorage.getItem('userid') || '';
  materials: any[] = [];
  studentsPerMaterial: Record<string, StudentChatItem[]> = {};
  noMsgs = true;
  constructor(private http: AllMsgsService, private chatService: ChatService) {}

  ngOnInit(): void {
    this.http.getTeacherMaterials().subscribe((materials: any) => {
      this.materials = materials?.data;
      console.log(materials);
      let ids = this.materials.map((i) => i?.material?.id);
      console.log(ids);
      this.chatService.getTeacherChatList(
        ids,
        localStorage.getItem('userid') || '',
        (list) => {
          this.studentsList = list;
          this.loading = false;
        }
      );
    });
  }
  // checkUnread(list: any[]) {
  //   return list.some((item) => item.hasUnread);
  // }
  // checkMsgsExist() {
  //   for (let i in this.studentsPerMaterial) {
  //     if (this.studentsPerMaterial[i]?.length) {
  //       let check = this.checkUnread(this.studentsPerMaterial[i]);
  //       if (check) this.noMsgs = false;
  //     }
  //   }
  // }
}
