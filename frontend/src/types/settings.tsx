export interface PreferencesData {
  displayName: string;
  theme: "light" | "dark" | "system";
  locale: string;
  currency: string;
}

export interface PasswordData {
  oldPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

export interface TaxData {
  taxResidency: string;
  salary: number;
  taxCode: string;
  pensionContribution: number;
  studentLoanStatus: string;
}

export interface ProfileData { 
    name: string; 
    email: string 
}