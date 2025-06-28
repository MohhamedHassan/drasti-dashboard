import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ChattingRoutingModule } from './chatting-routing.module';
import { ChatHomeComponent } from './components/chat-home/chat-home.component';
import { ChatBoxComponent } from './components/chat-box/chat-box.component';
import { AudioMessageComponent } from './components/audio-message/audio-message.component';
import { HttpClientModule } from '@angular/common/http';

@NgModule({
  declarations: [ChatHomeComponent, ChatBoxComponent, AudioMessageComponent],
  imports: [CommonModule, ChattingRoutingModule, HttpClientModule],
})
export class ChattingModule {}
