class SupabaseRouter:
    """
    Route database operations:
    - All reads go to default (SQLite) for speed
    - Writes go to default, then async sync to Supabase
    """
    def db_for_read(self, model, **hints):
        return 'default'
    
    def db_for_write(self, model, **hints):
        return 'default'
    
    def allow_migrate(self, db, app_label, model_name=None, **hints):
        if db == 'default':
            return True
        elif db == 'supabase':
            # Don't migrate on Supabase, use their dashboard for schema
            return False
        return None