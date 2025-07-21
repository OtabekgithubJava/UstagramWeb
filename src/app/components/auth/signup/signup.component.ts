import { Component, OnInit } from '@angular/core';
import { AuthServiceService } from '../../../services/auth-service.service';
import { Router } from '@angular/router';
import { UserDTO } from '../../../interfaces/user';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss']
})
export class SignupComponent implements OnInit {
  currentStep = 1;
  termsAccepted = false;
  passwordStrength = 0;
  selectedFile: File | null = null;
  errorMessage: string | null = null;
  isLoading = false;
  
  regions = [
    'Andijon', 'Buxoro', 'Farg\'ona', 'Jizzax', 
    'Xorazm', 'Namangan', 'Navoiy', 'Qashqadaryo',
    'Samarqand', 'Sirdaryo', 'Surxondaryo', 'Toshkent'
  ];

  userData: UserDTO = {
    fullName: '',
    username: '',
    password: '',
    phone: '',
    location: '',
    photoPath: '',
    dob: '',
    status: '',
    masterType: '',
    bio: '',
    experience: 0,
    telegramUrl: '',
    instagramUrl: ''
  };

  constructor(
    private authService: AuthServiceService,
    private router: Router
  ) {}

  ngOnInit() {
    this.checkPasswordStrength();
  }

  nextStep() {
    if (this.currentStep === 1) {
      if (!this.validateStep1()) {
        return;
      }
    }
    this.errorMessage = null;
    this.currentStep++;
  }

  prevStep() {
    this.errorMessage = null;
    this.currentStep--;
  }

  triggerFileInput() {
    const fileInput = document.getElementById('photoUpload') as HTMLInputElement;
    fileInput.click();
  }

  handlePhotoUpload(event: any) {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        this.errorMessage = 'Rasm hajmi 5MB dan kichik boʻlishi kerak.';
        return;
      }
      if (!['image/jpeg', 'image/png'].includes(file.type)) {
        this.errorMessage = 'Faqat JPEG yoki PNG rasmlar yuklanadi.';
        return;
      }
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.userData.photoPath = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  validateStep1(): boolean {
    this.userData.fullName = this.sanitizeInput(this.userData.fullName);
    this.userData.username = this.sanitizeInput(this.userData.username);

    this.checkPasswordStrength();
    if (this.passwordStrength < 2) {
      this.errorMessage = 'Parol kamida 8 belgi, katta harf, kichik harf va raqamdan iborat boʻlishi kerak.';
      return false;
    }

    const phoneRegex = /^\+998[0-9]{9}$/;
    if (!phoneRegex.test(this.userData.phone)) {
      this.errorMessage = 'Telefon raqam +998XXYYYYYYY formatida boʻlishi kerak.';
      return false;
    }

    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(this.userData.username)) {
      this.errorMessage = 'Foydalanuvchi nomi 3-20 belgi, faqat harf, raqam va pastki chiziqdan iborat boʻlishi kerak.';
      return false;
    }

    return true;
  }

  checkPasswordStrength() {
    const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{8,})/;
    const mediumRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.{8,})/;
    
    if (strongRegex.test(this.userData.password)) {
      this.passwordStrength = 3;
    } else if (mediumRegex.test(this.userData.password)) {
      this.passwordStrength = 2;
    } else if (this.userData.password.length > 0) {
      this.passwordStrength = 1;
    } else {
      this.passwordStrength = 0;
    }
  }

  sanitizeInput(input: string): string {
    return input.replace(/[<>]/g, '');
  }

  validateStep3(): boolean {
    if (!this.userData.status) {
      this.errorMessage = 'Iltimos, rolni tanlang (Kuzatuvchi yoki Duradgor)';
      return false;
    }
    
    if (this.userData.status === 'EXPERT' && !this.userData.masterType) {
      this.errorMessage = 'Iltimos, mutaxassislik turini tanlang';
      return false;
    }

    return true;
  }

  onSubmit(): void {
    if (!this.termsAccepted) {
      this.errorMessage = 'Please accept the terms and conditions';
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;

    const formData = new FormData();
    formData.append('FullName', this.userData.fullName);
    formData.append('Username', this.userData.username);
    formData.append('Password', this.userData.password);
    formData.append('Phone', this.userData.phone);
    formData.append('Location', this.userData.location);
    formData.append('Dob', new Date(this.userData.dob).toISOString().split('T')[0]);
    formData.append('Status', this.userData.status);

    formData.append('PhotoPath', this.userData.photoPath || 'assets/default-profile.png');
    
    if (this.userData.masterType) {
      formData.append('MasterType', this.userData.masterType);
    }
    
    if (this.userData.bio) {
      formData.append('Bio', this.userData.bio);
    }
    
    if (this.userData.experience) {
      formData.append('Experience', this.userData.experience.toString());
    }
    
    if (this.userData.telegramUrl) {
      formData.append('TelegramUrl', this.userData.telegramUrl);
    }
    
    if (this.userData.instagramUrl) {
      formData.append('InstagramUrl', this.userData.instagramUrl);
    }
    
    if (this.selectedFile) {
      formData.append('Photo', this.selectedFile);
    }

    this.authService.signup(formData).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.token) {
          localStorage.setItem('token', response.token);
        }
        this.router.navigate(['/feed']);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = this.formatErrorMessage(err);
      }
    });
  }

  formatErrorMessage(err: any): string {
    if (err.status === 409) {
      return 'Bu foydalanuvchi nomi yoki telefon raqami allaqachon roʻyxatdan oʻtgan.';
    }
    if (err.status === 400 && err.message.includes('Validation failed')) {
      return err.message || 'Maʼlumotlar notoʻgʻri kiritildi. Iltimos, tekshirib qayta urinib koʻring.';
    }
    return err.message || 'Roʻyxatdan oʻtish amalga oshmadi. Iltimos, qayta urinib koʻring.';
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toISOString().split('T')[0];
    } catch {
      return '';
    }
  }
}