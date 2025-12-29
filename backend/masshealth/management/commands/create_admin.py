from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from masshealth.models import UserMetadata
import getpass

CustomUser = get_user_model()


class Command(BaseCommand):
    help = 'Create a seed admin user'

    def add_arguments(self, parser):
        parser.add_argument('--email', type=str, help='Admin email address')
        parser.add_argument('--password', type=str, help='Admin password (will prompt if not provided)')
        parser.add_argument('--name', type=str, default='Admin User', help='Full name')
        parser.add_argument('--username', type=str, default='admin', help='Username for metadata')
        parser.add_argument('--noinput', action='store_true', help='Skip prompts, use defaults')
        parser.add_argument('--skip-password-validation', action='store_true', help='Skip password validation (dev only)')

    def handle(self, *args, **options):
        email = options['email']
        password = options['password']
        full_name = options['name']
        username = options['username']
        
        # Prompt for email if not provided
        if not email:
            if options['noinput']:
                self.stderr.write(self.style.ERROR('Email is required with --noinput'))
                return
            email = input('Admin email: ').strip()
        
        # Check if user already exists
        if CustomUser.objects.filter(email=email).exists():
            self.stdout.write(self.style.WARNING(f'User with email {email} already exists'))
            
            # Ask if they want to promote to admin
            if not options['noinput']:
                promote = input('Promote existing user to admin? [y/N]: ').strip().lower()
                if promote == 'y':
                    user = CustomUser.objects.get(email=email)
                    user.is_staff = True
                    user.is_superuser = True
                    user.save()
                    self.stdout.write(self.style.SUCCESS(f'User {email} promoted to admin'))
            return
        
        # Check if username already exists
        if UserMetadata.objects.filter(username=username).exists():
            self.stderr.write(self.style.ERROR(f'Username {username} already exists'))
            return
        
        # Prompt for password if not provided
        if not password:
            if options['noinput']:
                self.stderr.write(self.style.ERROR('Password is required with --noinput'))
                return
            password = getpass.getpass('Admin password: ')
            password_confirm = getpass.getpass('Confirm password: ')
            if password != password_confirm:
                self.stderr.write(self.style.ERROR('Passwords do not match'))
                return
        
        # Validate password (unless skipped)
        if not options['skip_password_validation']:
            from django.contrib.auth.password_validation import validate_password
            from django.core.exceptions import ValidationError
            try:
                validate_password(password)
            except ValidationError as e:
                self.stderr.write(self.style.ERROR('Password validation failed:'))
                for error in e.messages:
                    self.stderr.write(f'  - {error}')
                self.stderr.write(self.style.WARNING('Use --skip-password-validation to bypass (dev only)'))
                return
        
        # Create the admin user
        user = CustomUser.objects.create_superuser(
            email=email,
            password=password,
            full_name=full_name
        )
        
        # Create UserMetadata
        UserMetadata.objects.create(
            user=user,
            username=username
        )
        
        self.stdout.write(self.style.SUCCESS(f'Admin user created: {email}'))
        self.stdout.write(self.style.SUCCESS('This user can now:'))
        self.stdout.write('  - Access Django admin at /admin/')
        self.stdout.write('  - Use admin API endpoints')
        self.stdout.write('  - Create other admin users')