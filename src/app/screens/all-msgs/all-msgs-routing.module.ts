import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AllMsgsComponent } from './components/all-msgs/all-msgs.component';

const routes: Routes = [
  {
    path: '',
    component: AllMsgsComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AllMsgsRoutingModule {}
