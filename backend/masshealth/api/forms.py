from django import forms
from ..models import UserMetadata

class ProfilePicForm(forms.ModelForm):
    profile_image = forms.ImageField(label="Profile Picture")

    class Meta:
        model = UserMetadata
        fields = ['profile_image']

    def clean_profile_image(self):
        image = self.cleaned_data.get('profile_image')
        if image:
            # Check file size 
            if image.size > 5 * 1024 * 1024:
                raise forms.ValidationError("Image file too big")
            
            # Check file format
            valid_types = ['image/jpeg', 'image/jpg', 'image/png']
            if image.content_type not in valid_types:
                raise forms.ValidationError("Invalid image format")
        return image


