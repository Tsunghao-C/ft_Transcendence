from django import forms
from .models import CustomUser

class UploadAvatarForm(forms.ModelForm):
	class Meta:
		model = CustomUser
		fields = ['avatar']
	
	def clean_avatar(self):
		avatar = self.cleaned_data.get('avatar')
		if not avatar:
			raise forms.ValidationError("Please upload an image")
		max_file_size = 2 * 1024 * 1024 # 2 MB
		if avatar.size > max_file_size:
			raise forms.ValidationError("Avatar size must not exceed 2 MB")
		return avatar