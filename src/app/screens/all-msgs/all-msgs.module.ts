import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AllMsgsRoutingModule } from './all-msgs-routing.module';
import { AllMsgsComponent } from './components/all-msgs/all-msgs.component';
import { SharedModule } from 'src/app/shared/shared.module';

@NgModule({
  declarations: [AllMsgsComponent],
  imports: [CommonModule, AllMsgsRoutingModule, SharedModule],
})
export class AllMsgsModule {}
