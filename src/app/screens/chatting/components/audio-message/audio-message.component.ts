import {
  ChangeDetectorRef,
  Component,
  Input,
  OnDestroy,
  Output,
  EventEmitter,
} from '@angular/core';

@Component({
  selector: 'app-audio-message',
  templateUrl: './audio-message.component.html',
  styleUrls: ['./audio-message.component.scss'],
})
export class AudioMessageComponent {
  recording = false;
  mediaRecorder!: MediaRecorder;
  audioChunks: Blob[] = [];
  audioUrl!: string;
  paused = false;
  @Output() nowRecording = new EventEmitter();
  @Output() send = new EventEmitter();
  @Output() micError = new EventEmitter();
  mediaStream!: MediaStream;
  recordingStatus = 0;
  hideOptions = false;
  recordTime = 0;
  time = 0;
  recordSeconds: number = 0;
  interval: any;
  @Input() cancel = false;
  constructor(private cdr: ChangeDetectorRef) {}
  startRecording() {
    this.recordingStatus = 1;
    this.time = 0;
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        this.mediaRecorder = new MediaRecorder(stream);
        this.mediaRecorder.start();
        this.mediaStream = stream;
        this.hideOptions = false;
        this.recording = true;

        this.interval = setInterval(() => {
          this.time += 1;
          if (this.recordSeconds == 60) {
            this.recordSeconds = 0;
            this.recordTime += 1;
          } else {
            this.recordSeconds += 1;
          }
        }, 1000);
        this.nowRecording.emit(true);
        this.mediaRecorder.ondataavailable = (event) => {
          this.audioChunks.push(event.data);
        };

        this.mediaRecorder.onstop = () => {
          if (this.recording) {
            this.recording = false;
            const audioBlob = new Blob(this.audioChunks, {
              type: 'audio/webm',
            });
            this.audioChunks = [];
            this.send.emit({ audio: audioBlob, duration: this.time });
            this.audioChunks = [];
          }
          this.stopMediaStream();
        };
      })
      .catch((error) => {
        //    console.error('Error accessing microphone: ', error)
        this.recordingStatus = 0;
        this.micError.emit(true);
      });
  }

  pauseRecording() {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      clearInterval(this.interval);
      this.mediaRecorder.pause();
      this.paused = true;
    }
  }

  resumeRecording() {
    if (this.mediaRecorder && this.mediaRecorder.state === 'paused') {
      this.interval = setInterval(() => {
        this.time += 1;
        if (this.recordSeconds == 60) {
          this.recordSeconds = 0;
          this.recordTime += 1;
        } else {
          this.recordSeconds += 1;
        }
      }, 1000);
      this.mediaRecorder.resume();
      this.paused = false;
    }
  }

  stopRecording() {
    if (this.mediaRecorder && this.recording) {
      //  this.hideOptions=true
      clearInterval(this.interval);
      this.recordTime = 0;
      this.recordSeconds = 0;
      this.mediaRecorder.stop();

      this.paused = false;
      this.recordingStatus = 0;
      this.nowRecording.emit(false);
    }
  }

  convertBlobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.onerror = reject;
    });
  }
  cancelREcord() {
    this.recording = false;
    this.audioChunks = [];
    this.audioUrl = '';
    this.paused = false;
    this.nowRecording.emit(false);
    this.recordingStatus = 0;
    this.recordTime = 0;
    this.recordSeconds = 0;
    this.cdr.detectChanges();
    this.stopMediaStream();
    if (this.interval) clearInterval(this.interval);
  }
  stopMediaStream() {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
    }
  }
  ngOnDestroy(): void {
    this.stopMediaStream();
  }
}
