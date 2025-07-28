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
  isProcessing = false;
  showErrorModal = false;
  
  regions = [
    'Andijon', 'Buxoro', 'Farg`ona', 'Jizzax', 
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
        this.showError('Rasm hajmi 5MB dan kichik boʻlishi kerak.');
        return;
      }
      if (!['image/jpeg', 'image/png'].includes(file.type)) {
        this.showError('Faqat JPEG yoki PNG rasmlar yuklanadi.');
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

    if (!this.userData.fullName) {
      this.showError('Iltimos, toʻliq ismingizni kiriting');
      return false;
    }

    if (!this.userData.username) {
      this.showError('Iltimos, foydalanuvchi nomini kiriting');
      return false;
    }

    if (!this.userData.password) {
      this.showError('Iltimos, parol yarating');
      return false;
    }

    if (!this.userData.phone) {
      this.showError('Iltimos, telefon raqamingizni kiriting');
      return false;
    }

    this.checkPasswordStrength();
    if (this.passwordStrength < 2) {
      this.showError(`
        Parolingiz yetarli darajada mustahkam emas. Quyidagilarni tekshiring:
        - Kamida 8 ta belgi
        - Kamida 1 ta katta harf
        - Kamida 1 ta kichik harf
        - Kamida 1 ta raqam
      `);
      return false;
    }

    const phoneRegex = /^\+998[0-9]{9}$/;
    if (!phoneRegex.test(this.userData.phone)) {
      this.showError(`
        Telefon raqam notoʻgʻri formatda. Toʻgʻri format:
        +998XXYYYYYYY (masalan: +998901234567)
      `);
      return false;
    }

    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(this.userData.username)) {
      this.showError(`
        Foydalanuvchi nomi notoʻgʻri. Quyidagi shartlarni tekshiring:
        - 3-20 belgi uzunlikda
        - Faqat harflar (a-z, A-Z)
        - Raqamlar (0-9)
        - Pastki chiziq (_) ishlatilishi mumkin
      `);
      return false;
    }

    return true;
  }

  showError(message: string) {
    this.errorMessage = message;
    this.showErrorModal = true;
  }

  closeErrorModal() {
    this.showErrorModal = false;
    this.errorMessage = null;
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
      this.showError('Iltimos, rolni tanlang (Mutaxassis)');
      return false;
    }
    
    if (this.userData.status === 'EXPERT' && !this.userData.masterType) {
      this.showError('Iltimos, mutaxassislik turini tanlang');
      return false;
    }

    return true;
  }

  onSubmit(): void {
    if (!this.termsAccepted) {
      this.showError('Iltimos, foydalanish shartlari bilan tanishib chiqing va rozilik bering');
      return;
    }

    if (!this.validateStep3()) {
      return;
    }

    this.isProcessing = true;
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
        this.isProcessing = false;
        if (response.token) {
          localStorage.setItem('token', response.token);
        }
        this.router.navigate(['/feed']);
      },
      error: (err) => {
        this.isProcessing = false;
        this.showError(this.formatErrorMessage(err));
      }
    });
  }

  formatErrorMessage(err: any): string {
    if (err.status === 409) {
      return `
        Ushbu maʼlumotlar allaqachon roʻyxatdan oʻtgan:
        - ${err.error?.username ? 'Foydalanuvchi nomi' : ''}
        - ${err.error?.phone ? 'Telefon raqami' : ''}
        Iltimos, boshqa maʼlumotlardan foydalaning yoki hisobingizga kiring.
      `;
    }
    if (err.status === 400 && err.message.includes('Validation failed')) {
      return 'Maʼlumotlar notoʻgʻri kiritildi. Iltimos, barcha maydonlarni toʻgʻri toʻldirganingizni tekshiring.';
    }
    return 'Roʻyxatdan oʻtish amalga oshmadi. Iltimos, qayta urinib koʻring yoki texnik yordamga murojaat qiling.';
  }
}