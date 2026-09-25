import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      appName: 'A2Z Printing',
      platform: 'Shop workspace',
      domain: 'a2z.kw',
      nav: {
        dashboard: 'Dashboard',
        jobOrders: 'Job Orders',
        invoices: 'Invoices',
        customers: 'Customers',
        employees: 'Employees',
        attendance: 'Attendance',
        leaves: 'Leaves',
        payroll: 'Payroll',
        settings: 'Settings',
      },
      common: {
        search: 'Search',
        cancel: 'Cancel',
        save: 'Save',
        edit: 'Edit',
        delete: 'Delete',
        back: 'Back',
        print: 'Print',
        add: 'Add',
        all: 'All',
        loading: 'Loading...',
        retry: 'Something went wrong. Retry.',
        noRecords: 'No records',
        signIn: 'Sign in',
        logout: 'Logout',
        approve: 'Approve',
        reject: 'Reject',
      },
      login: {
        email: 'Email',
        password: 'Password',
        remember: 'Remember me',
        invalid: 'Invalid email or password.',
        forgot: 'Forgot password?',
      },
      status: {
        new: 'New',
        in_press: 'In press',
        done: 'Done',
        unpaid: 'Unpaid',
        partial: 'Partial',
        paid: 'Paid',
        overdue: 'Overdue',
        pending: 'Pending',
        approved: 'Approved',
        rejected: 'Rejected',
        present: 'Present',
        absent: 'Absent',
        off: 'Off',
        active: 'Active',
        inactive: 'Inactive',
        draft: 'Draft',
        open: 'Open',
      },
    },
  },
  ar: {
    translation: {
      appName: 'مطبعة A2Z',
      platform: 'مساحة العمل',
      domain: 'a2z.kw',
      nav: {
        dashboard: 'لوحة التحكم',
        jobOrders: 'أوامر العمل',
        invoices: 'الفواتير',
        customers: 'العملاء',
        employees: 'الموظفون',
        attendance: 'الحضور',
        leaves: 'الإجازات',
        payroll: 'الرواتب',
        settings: 'الإعدادات',
      },
      common: {
        search: 'بحث',
        cancel: 'إلغاء',
        save: 'حفظ',
        edit: 'تعديل',
        delete: 'حذف',
        back: 'رجوع',
        print: 'طباعة',
        add: 'إضافة',
        all: 'الكل',
        loading: 'جاري التحميل...',
        retry: 'حدث خطأ. أعد المحاولة.',
        noRecords: 'لا توجد سجلات',
        signIn: 'تسجيل الدخول',
        logout: 'خروج',
        approve: 'موافقة',
        reject: 'رفض',
      },
      login: {
        email: 'البريد الإلكتروني',
        password: 'كلمة المرور',
        remember: 'تذكرني',
        invalid: 'البريد أو كلمة المرور غير صحيحة.',
        forgot: 'نسيت كلمة المرور؟',
      },
      status: {
        new: 'جديد',
        in_press: 'قيد الطباعة',
        done: 'منجز',
        unpaid: 'غير مدفوع',
        partial: 'جزئي',
        paid: 'مدفوع',
        overdue: 'متأخر',
        pending: 'قيد الانتظار',
        approved: 'موافق عليه',
        rejected: 'مرفوض',
        present: 'حاضر',
        absent: 'غائب',
        off: 'عطلة',
        active: 'نشط',
        inactive: 'غير نشط',
        draft: 'مسودة',
        open: 'مفتوح',
      },
    },
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: localStorage.getItem('lang') || 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export function applyDocumentDir(lng) {
  document.documentElement.lang = lng;
  document.documentElement.dir = lng === 'ar' ? 'rtl' : 'ltr';
}

applyDocumentDir(i18n.language);
i18n.on('languageChanged', (lng) => {
  localStorage.setItem('lang', lng);
  applyDocumentDir(lng);
});

export default i18n;
