import { Routes, RouterModule } from '@angular/router';

// FILL IT IN WITH THE COMPONENTS WE MAKE
import { MediaItemFormComponent } from './media-item-form.component';
import { MediaItemListComponent } from './media-item-list.component';

const appRoutes: Routes = [
  // FILL IT IN WITH COMPONENTS WE MAKE
  { path: 'add', component: MediaItemFormComponent },
  { path: ':medium', component: MediaItemListComponent },
  { path: '', pathMatch: 'full', redirectTo: 'all' }
];

export const routing = RouterModule.forRoot(appRoutes);
