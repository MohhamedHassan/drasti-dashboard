import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { UserGuard } from './core/guards/user.guard';
import { NotfoundComponent } from './shared/components/notfound/notfound.component';
import { NotUserGuard } from './core/guards/not-user.guard';

const routes: Routes = [
  {
    path: '',
    loadChildren: () =>
      import('src/app/screens/home/home.module').then((m) => m.HomeModule),
    canActivate: [NotUserGuard],
  },
  {
    path: 'material-chat/:id/:name',
    loadChildren: () =>
      import('src/app/screens/chatting/chatting.module').then(
        (m) => m.ChattingModule
      ),
    canActivate: [NotUserGuard],
  },
  {
    path: 'all-msgs',
    loadChildren: () =>
      import('src/app/screens/all-msgs/all-msgs.module').then(
        (m) => m.AllMsgsModule
      ),
    canActivate: [NotUserGuard],
  },
  {
    path: 'auth',
    loadChildren: () =>
      import('src/app/screens/auth/auth.module').then((m) => m.AuthModule),
    canActivate: [UserGuard],
  },
  {
    path: '**',
    component: NotfoundComponent,
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      initialNavigation: 'enabled',
      scrollPositionRestoration: 'enabled',
    }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
