import { Component, OnDestroy, OnInit } from '@angular/core';
import { ChatService, StudentChatItem } from '../../services/chat.service';
import { off, set } from 'firebase/database';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-chat-home',
  templateUrl: './chat-home.component.html',
  styleUrls: ['./chat-home.component.scss'],
})
export class ChatHomeComponent implements OnInit, OnDestroy {
  openChatForStudentID: any;
  openChatForStudentName: any;
  materialName = '';
  students: StudentChatItem[] = [];
  selectedStudentId: string | null = null;
  studentName = '';
  messages: any[] = [];
  loading = true;
  materialId: any;
  teacherId = localStorage.getItem('userid') || '';

  constructor(
    private chatService: ChatService,
    private activatedRoute: ActivatedRoute
  ) {}

  ngOnInit() {
    this.materialId = this.activatedRoute.snapshot.params['id'];
    this.materialName = this.activatedRoute.snapshot.params['name'];
    this.openChatForStudentID =
      this.activatedRoute.snapshot.queryParams['studentId'];
    this.openChatForStudentName =
      this.activatedRoute.snapshot.queryParams['studentNae'];
    if (this.openChatForStudentID) {
      this.selectStudent(
        this.openChatForStudentID,
        this.openChatForStudentName
      );
    }
    console.log(this.openChatForStudentID);
    this.chatService.listenToChatUsers(
      this.materialId,
      this.teacherId,
      (students) => {
        this.students = students;
        this.loading = false;
      }
    );
  }

  selectStudent(studentId: string, studentName: any) {
    this.studentName = studentName;
    this.selectedStudentId = studentId;
    this.messages = [];

    setTimeout(() => {
      console.log(studentId);
      this.chatService.listenToMessages(
        this.materialId,
        this.selectedStudentId || '',
        this.teacherId,
        (msgs) => {
          if (studentId == this.selectedStudentId) {
            console.log('select');
            this.messages = msgs;
            this.chatService.markMessagesAsRead(
              this.materialId,
              studentId,
              this.teacherId
            );
          }
        }
      );
    }, 0);
  }
  ngOnDestroy(): void {
    this.chatService.stopListeningToMessages();
  }
}
