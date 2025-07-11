import { Injectable } from '@angular/core';
import {
  getDatabase,
  ref,
  onValue,
  get,
  update,
  onChildAdded,
  DatabaseReference,
  off,
} from 'firebase/database';

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  private db = getDatabase();
  private messageRef: DatabaseReference | null = null;
  listenToChatUsers(
    materialId: string,
    teacherId: string,
    callback: (students: StudentChatItem[]) => void
  ) {
    const subjectRef = ref(this.db, `Subjects-Messages/${materialId}`);
    onValue(subjectRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return callback([]);

      const result: StudentChatItem[] = [];

      for (const userId in data) {
        const messages = Object.values(data[userId]) as any[];
        const sorted = messages.sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );
        const lastMessage = sorted[sorted.length - 1];
        const hasUnread = messages.some(
          (msg) =>
            msg.did_read === false &&
            msg.from_id !== teacherId &&
            msg.from_id !== '_1'
        );

        result.push({
          userId,
          name:
            sorted.find(
              (msg) => msg.from_id !== teacherId && msg.from_id !== '_1'
            )?.from || 'طالب',
          phone:
            sorted.find(
              (msg) => msg.from_id !== teacherId && msg.from_id !== '_1'
            )?.from_number || '',
          hasUnread,
          lastDate: lastMessage.date,
        });
      }

      // sort by last message time descending
      result.sort(
        (a, b) =>
          new Date(b.lastDate).getTime() - new Date(a.lastDate).getTime()
      );

      callback(result);
    });
  }
  listenToMessages(
    materialId: string,
    studentId: string,
    teacherId: string,
    callback: (messages: any[]) => void
  ) {
    if (this.messageRef) {
      off(this.messageRef);
    }

    const path = `Subjects-Messages/${materialId}/${studentId}`;
    this.messageRef = ref(this.db, path);
    const messages: any[] = [];

    onChildAdded(this.messageRef, (snapshot: any) => {
      const msg = snapshot.val();
      const key = snapshot.key;

      if (
        msg.from_id !== teacherId &&
        msg.from_id !== '_1' &&
        msg.did_read === false
      ) {
        console.log(path);
        update(ref(this.db, `${path}/${key}`), { did_read: true });
      }

      messages.push({ ...msg, key });
      const sorted = [...messages].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      callback([...sorted]);
    });
  }

  markMessagesAsRead(materialId: string, studentId: string, teacherId: string) {
    const path = `Subjects-Messages/${materialId}/${studentId}`;
    const msgRef = ref(this.db, path);
    get(msgRef).then((snapshot) => {
      snapshot.forEach((child) => {
        const msg = child.val();
        if (
          msg.from_id !== teacherId &&
          msg.from_id !== '_1' &&
          msg.did_read === false
        ) {
          update(ref(this.db, `${path}/${child.key}`), { did_read: true });
        }
      });
    });
  }
  stopListeningToMessages() {
    if (this.messageRef) {
      off(this.messageRef);
      this.messageRef = null;
    }
  }
  getTeacherChatList(
    materialsIds: any[],
    teacherId: string,
    callback: (list: any[]) => void
  ) {
    const studentsList: any[] = [];

    materialsIds.forEach((materialId) => {
      const materialRef = ref(this.db, `Subjects-Messages/${materialId}`);

      onChildAdded(materialRef, (snapshot) => {
        const userId = snapshot.key;

        const userMessagesRef = ref(
          this.db,
          `Subjects-Messages/${materialId}/${userId}`
        );

        onChildAdded(userMessagesRef, (msgSnapshot) => {
          const msg = msgSnapshot.val();

          if (msg.to_id == materialId) {
            const hasUnread = !msg.did_read && msg.from_id !== teacherId;

            const existingIndex = studentsList.findIndex(
              (s) => s.userId === userId && s.materialId === materialId
            );

            if (existingIndex > -1) {
              const existingDate = new Date(
                studentsList[existingIndex].lastMessageDate
              ).getTime();
              const newDate = new Date(msg.date).getTime();

              // نحدث فقط لو التاريخ الجديد أحدث
              if (newDate > existingDate) {
                studentsList[existingIndex].lastMessageDate = msg.date;
              }

              // لو في رسالة غير مقروءة بنحدث العلامة
              studentsList[existingIndex].hasUnread =
                studentsList[existingIndex].hasUnread || hasUnread;
            } else {
              studentsList.push({
                materialId,
                materialName: msg.material_name,
                userId,
                userName: msg.from,
                lastMessageDate: msg.date,
                hasUnread,
              });
            }

            // ترتيب حسب أحدث رسالة
            studentsList.sort(
              (a, b) =>
                new Date(b.lastMessageDate).getTime() -
                new Date(a.lastMessageDate).getTime()
            );

            callback([...studentsList]);
          }
        });
      });
    });
  }
}

export interface StudentChatItem {
  userId: string;
  name: string;
  hasUnread: boolean;
  lastDate: string;
  phone: any;
}
