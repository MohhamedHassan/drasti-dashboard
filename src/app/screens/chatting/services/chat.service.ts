import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import {
  getDatabase,
  ref,
  onValue,
  get,
  update,
  onChildAdded,
  DatabaseReference,
  off,
  onChildChanged,
  onChildRemoved,
} from 'firebase/database';
import { ToastrService } from 'ngx-toastr';

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  showNotification = false;
  notificationInfo: any = null;
  private db = getDatabase();
  private messageRef: DatabaseReference | null = null;
  constructor(private toastr: ToastrService, private router: Router) {}
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
            msg.from_id !== '_1' &&
            !msg.from_display_name
        );
        if (userId != localStorage.getItem('userid')) {
          result.push({
            userId,
            name:
              sorted.find(
                (msg) =>
                  msg.from_id !== teacherId &&
                  msg.from_id !== '_1' &&
                  !msg.from_display_name
              )?.from || 'طالب',
            phone:
              sorted.find(
                (msg) =>
                  msg.from_id !== teacherId &&
                  msg.from_id !== '_1' &&
                  !msg.from_display_name
              )?.from_number || '',
            hasUnread,
            lastDate: lastMessage.date,
          });
        }
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
    let messages: any[] = [];

    onChildAdded(this.messageRef, (snapshot: any) => {
      const msg = snapshot.val();
      const key = snapshot.key;

      if (
        msg.from_id !== teacherId &&
        msg.from_id !== '_1' &&
        msg.did_read === false &&
        !msg.from_display_name
      ) {
        console.log(path);
        update(ref(this.db, `${path}/${key}`), { did_read: true });
      }
      console.log(msg, key);
      messages.push({ ...msg, key });
      const sorted = [...messages].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      callback([...sorted]);
    });
    onChildRemoved(this.messageRef, (snapshot: any) => {
      const removedKey = snapshot.key;
      messages = messages.filter((msg) => msg.key !== removedKey);

      const sorted = [...messages].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      callback(sorted);
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
          msg.did_read === false &&
          !msg.from_display_name
        ) {
          console.log('doneeee');
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
    let studentsList: any[] = [];

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
          console.log(msg);
          if (true) {
            const hasUnread =
              !msg.did_read && !msg.from_display_name && msg.from_id != '_1';

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
                studentsList[existingIndex].lastMessage =
                  msg?.type == 'audio'
                    ? 'رسالة صوتية'
                    : msg?.type == 'photo'
                    ? 'صورة'
                    : msg.message_content || '';
              }

              // لو في رسالة غير مقروءة بنحدث العلامة
              studentsList[existingIndex].hasUnread = hasUnread;
            } else {
              if (!msg.from_display_name && msg.from_id != '_1') {
                studentsList.push({
                  materialId,
                  materialName: msg.material_name,
                  userId,
                  userName: msg.from,
                  lastMessageDate: msg.date,
                  lastMessage:
                    msg?.type == 'audio'
                      ? 'رسالة صوتية'
                      : msg?.type == 'photo'
                      ? 'صورة'
                      : msg.message_content || '',
                  hasUnread,
                });
              }
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
        onChildChanged(userMessagesRef, (snapshot) => {
          const msg = snapshot.val();
          console.log(msg, studentsList);
          studentsList = studentsList.map((item) => {
            if (item.materialId == msg.to_id && item.userId == msg.from_id) {
              return {
                ...item,
                hasUnread: !msg.did_read,
                lastMessage:
                  msg?.type == 'audio'
                    ? 'رسالة صوتية'
                    : msg?.type == 'photo'
                    ? 'صورة'
                    : msg.message_content || '', // ✅ تعديل جديد: تحديث آخر رسالة عند التعديل
                lastMessageDate: msg.date, // ✅ تعديل جديد: تحديث تاريخ آخر رسالة عند التعديل
              };
            } else {
              return item;
            }
          });
          callback([...studentsList]);
        });
        onChildRemoved(userMessagesRef, (snapshot) => {
          const removedKey = snapshot.key;

          // هنحتاج نجيب آخر رسالة تانية من Firebase
          get(userMessagesRef).then((snap) => {
            if (snap.exists()) {
              const msgs = Object.values(snap.val()) as any[];
              msgs.sort(
                (a, b) =>
                  new Date(b.date).getTime() - new Date(a.date).getTime()
              );
              const lastMsg = msgs[0];

              studentsList = studentsList.map((item) => {
                if (item.materialId === materialId && item.userId === userId) {
                  return {
                    ...item,
                    lastMessage:
                      lastMsg?.type == 'audio'
                        ? 'رسالة صوتية'
                        : lastMsg?.type == 'photo'
                        ? 'صورة'
                        : lastMsg?.message_content || '',
                    lastMessageDate: lastMsg?.date || '',
                  };
                }
                return item;
              });
            }

            callback([...studentsList]);
          });
        });
      });
    });
  }

  listenForNewMessages(materialIds: string[], teacherId: string) {
    const loginTime = new Date(); // 🟢 وقت اللوجن

    materialIds.forEach((materialId) => {
      const materialRef = ref(this.db, `Subjects-Messages/${materialId}`);

      onChildAdded(materialRef, (userSnapshot) => {
        const userId = userSnapshot.key;
        const userMessagesRef = ref(
          this.db,
          `Subjects-Messages/${materialId}/${userId}`
        );

        onChildAdded(userMessagesRef, (msgSnapshot) => {
          const msg = msgSnapshot.val();

          // 🟢 شرط التحقق من أن الرسالة جديدة و to_id موجود في الـ array
          const msgDate = new Date(msg.date);
          if (msgDate > loginTime && materialIds.includes(msg.to_id)) {
            // 🟢 نتأكد أن الرسالة ليست من نفس المدرس عشان ما نعملش إشعار لنفسه
            if (
              msg.from_id !== teacherId &&
              msg.from_id !== '_1' &&
              !msg.from_display_name
            ) {
              // this.showNotification = true;
              this.notificationInfo = msg;
              // setTimeout(() => {
              //   this.showNotification = false;
              //   this.notificationInfo = null;
              // }, 5000);
              console.log(this.notificationInfo);
              const toast = this.toastr.info(
                this.notificationInfo?.from,
                this.notificationInfo?.material_name
              );
              toast.onTap.subscribe(() => {
                // توجيه المستخدم عند الكليك
                this.router.navigate(['/all-msgs']);
              });
            }
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
