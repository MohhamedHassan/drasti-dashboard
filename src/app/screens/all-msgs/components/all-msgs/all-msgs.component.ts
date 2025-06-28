import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import {
  ChatService,
  StudentChatItem,
} from 'src/app/screens/chatting/services/chat.service';
import { environment } from 'src/environments/environment';
import { AllMsgsService } from '../../services/all-msgs.service';

@Component({
  selector: 'app-all-msgs',
  templateUrl: './all-msgs.component.html',
  styleUrls: ['./all-msgs.component.scss'],
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
      this.loading = false;
      this.materials = materials?.data;
      console.log(materials);
      let ids = this.materials.map((i) => i?.material?.id);
      console.log(ids);
      this.chatService.getTeacherChatList(
        ids,
        localStorage.getItem('userid') || '',
        (list) => {
          this.studentsList = list;
        }
      );
      // this.materials.forEach((material) => {
      //   this.chatService.listenToChatUsers(
      //     material?.material?.id,
      //     this.teacherId,
      //     (students) => {
      //       console.log(students);
      //       this.studentsPerMaterial[material?.material?.id] = students;
      //       this.noMsgs = true;
      //       this.checkMsgsExist();
      //     }
      //   );
      // });
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
