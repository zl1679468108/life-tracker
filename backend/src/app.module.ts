import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ItemsModule } from './items/items.module';
import { TodosModule } from './todos/todos.module';
import { CategoriesModule } from './categories/categories.module';
import { LocationsModule } from './locations/locations.module';
import { FeedbackModule } from './feedback/feedback.module';
import { BorrowingsModule } from './borrowings/borrowings.module';
import { SharesModule } from './shares/shares.module';
import { TemplatesModule } from './templates/templates.module';
import { AiModule } from './ai/ai.module';
import { StatsModule } from './stats/stats.module';
import { CalendarModule } from './calendar/calendar.module';
import { WidgetsModule } from './widgets/widgets.module';
import { AuthModule } from './auth/auth.module';
import { UploadModule } from './upload/upload.module';
import { SupabaseModule } from './common/supabase/supabase.module';
import { MailModule } from './common/mail/mail.module';
import { EventsModule } from './common/events/events.module';
import { ReminderModule } from './common/reminder/reminder.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.ENV || 'development'}`,
    }),
    SupabaseModule,
    MailModule,
    EventsModule,
    ReminderModule,
    ItemsModule,
    TodosModule,
    CategoriesModule,
    LocationsModule,
    FeedbackModule,
    BorrowingsModule,
    SharesModule,
    TemplatesModule,
    AiModule,
    StatsModule,
    CalendarModule,
    WidgetsModule,
    AuthModule,
    UploadModule,
  ],
})
export class AppModule {}
