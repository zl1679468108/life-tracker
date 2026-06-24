import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export const SUPABASE_CLIENT = 'SUPABASE_CLIENT';
export const SUPABASE_ADMIN_CLIENT = 'SUPABASE_ADMIN_CLIENT';

@Global()
@Module({
  providers: [
    {
      provide: SUPABASE_CLIENT,
      useFactory: (configService: ConfigService): SupabaseClient => {
        const url = configService.get<string>('SUPABASE_URL');
        const key = configService.get<string>('SUPABASE_ANON_KEY');

        return createClient(url, key, {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        });
      },
      inject: [ConfigService],
    },
    {
      provide: SUPABASE_ADMIN_CLIENT,
      useFactory: (configService: ConfigService): SupabaseClient => {
        const url = configService.get<string>('SUPABASE_URL');
        const serviceKey = configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');

        return createClient(url, serviceKey, {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        });
      },
      inject: [ConfigService],
    },
  ],
  exports: [SUPABASE_CLIENT, SUPABASE_ADMIN_CLIENT],
})
export class SupabaseModule {}
