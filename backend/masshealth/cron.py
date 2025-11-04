from django_cron import CronJobBase, Schedule

class SyncToSupabaseCron(CronJobBase):
    RUN_EVERY_MINS = 5  # Run every 5 minutes
    
    schedule = Schedule(run_every_mins=RUN_EVERY_MINS)
    code = 'masshealth.sync_to_supabase'
    
    def do(self):
        from django.core.management import call_command
        call_command('sync_to_supabase')