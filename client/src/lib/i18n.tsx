import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Language = "en" | "fr" | "ar";

export interface TranslationResources {
  [key: string]: {
    [key: string]: string;
  };
}

const translations: Record<Language, TranslationResources> = {
  en: {
    common: {
      loading: "Loading...",
      save: "Save",
      saveChanges: "Save changes",
      cancel: "Cancel",
      delete: "Delete",
      edit: "Edit",
      create: "Create",
      close: "Close",
      yes: "Yes",
      no: "No",
      confirm: "Confirm",
      search: "Search...",
      tryAgain: "Try again",
    },
    auth: {
      signIn: "Sign in",
      signUp: "Sign up",
      createAccount: "Create account",
      alreadyHaveAccount: "Already have an account?",
      forgotPassword: "Forgot password?",
      email: "Email",
      password: "Password",
      name: "Name",
      phone: "Phone",
      countryCode: "Country Code",
      loginDescription: "Sign in to your account to load saved tasks.",
      registerDescription: "New users get their own private task database view.",
      welcomeBack: "Welcome back",
      welcomeBackDescription: "Your saved tracking data is loaded.",
      accountCreated: "Account created",
      accountCreatedDescription: "Your private workspace is ready.",
      loginFailed: "Login failed",
      createAccountFailed: "Could not create account",
      namePlaceholder: "Your name",
      passwordPlaceholder: "At least 6 characters",
    },
    tasks: {
      tasks: "Tasks",
      newTask: "New task",
      editTask: "Edit task",
      title: "Title",
      notes: "Notes",
      period: "Period",
      status: "Status",
      priority: "Priority",
      category: "Category",
      progress: "Progress",
      dueDate: "Due Date",
      startDate: "Start Date",
      endDate: "End Date",
      timeEstimate: "Time Estimate (min)",
      metricTarget: "Metric Target",
      metricUnit: "Unit",
      day: "Day",
      month: "Month",
      year: "Year",
      todo: "To do",
      inProgress: "In progress",
      done: "Done",
      low: "Low",
      medium: "Medium",
      high: "High",
      work: "Work",
      health: "Health",
      learning: "Learning",
      personal: "Personal",
      finance: "Finance",
      creative: "Creative",
      general: "General",
      overdue: "Overdue",
      duration: "Duration",
      hours: "hours",
      days: "days",
      months: "months",
      taskCreated: "Task created",
      taskUpdated: "Task updated",
      taskDeleted: "Task deleted",
      deleteConfirm: "Delete this task?",
      deleteDescription: "This task will be removed from your tracker. This can't be undone.",
      emptyTasks: "No tasks yet",
      emptyTasksDescription: "Add your first task to begin building daily, monthly, and yearly momentum.",
      taskDialogDescription: "Track work across day, month, and year — keep your tempo steady.",
      titlePlaceholder: "e.g. Review Q3 metrics",
      metricUnitPlaceholder: "km, books, USD…",
      notesPlaceholder: "Optional context, links, or sub-steps…",
      createTask: "Create task",
      noDuration: "No duration set",
      saveChanges: "Save changes",
      tryAgain: "Try again",
      subtitle: "Capture, organize, and complete what matters.",
      markedDone: "Marked done",
      reopened: "Reopened",
      reopenTask: "Reopen task",
      markTaskDone: "Mark task done",
      edit: "Edit",
      delete: "Delete",
      target: "Target",
      min: "min",
      noMatches: "No tasks match these filters",
      tryClearingFilters: "Try clearing search or switching periods.",
      createFirstTask: "Create your first task",
    },
    dashboard: {
      dashboard: "Dashboard",
      focusScore: "Focus Score",
      today: "Today",
      thisMonth: "This Month",
      thisYear: "This Year",
      completed: "Completed",
      inProgress: "In Progress",
      overdue: "Overdue",
      momentum: "Momentum",
    },
    navigation: {
      dashboard: "Dashboard",
      tasks: "Tasks",
      analytics: "Analytics",
      timeline: "Timeline",
      logout: "Logout",
    },
    errors: {
      required: "This field is required",
      invalidEmail: "Enter a valid email",
      minLength: "Must be at least {min} characters",
      somethingWentWrong: "Something went wrong",
    },
  },
  fr: {
    common: {
      loading: "Chargement...",
      save: "Enregistrer",
      saveChanges: "Enregistrer les modifications",
      cancel: "Annuler",
      delete: "Supprimer",
      edit: "Modifier",
      create: "Créer",
      close: "Fermer",
      yes: "Oui",
      no: "Non",
      confirm: "Confirmer",
      search: "Rechercher...",
      tryAgain: "Réessayer",
      all: "Tous",
    },
    auth: {
      signIn: "Se connecter",
      signUp: "S'inscrire",
      createAccount: "Créer un compte",
      alreadyHaveAccount: "Vous avez déjà un compte?",
      forgotPassword: "Mot de passe oublié?",
      email: "Email",
      password: "Mot de passe",
      name: "Nom",
      phone: "Téléphone",
      countryCode: "Code pays",
      loginDescription: "Connectez-vous à votre compte pour charger vos tâches sauvegardées.",
      registerDescription: "Les nouveaux utilisateurs obtiennent leur propre vue de base de données de tâches privée.",
      welcomeBack: "Bon retour",
      welcomeBackDescription: "Vos données de suivi sauvegardées sont chargées.",
      accountCreated: "Compte créé",
      accountCreatedDescription: "Votre espace de travail privé est prêt.",
      loginFailed: "Échec de la connexion",
      createAccountFailed: "Impossible de créer le compte",
      namePlaceholder: "Votre nom",
      passwordPlaceholder: "Au moins 6 caractères",
    },
    tasks: {
      tasks: "Tâches",
      newTask: "Nouvelle tâche",
      editTask: "Modifier la tâche",
      title: "Titre",
      notes: "Notes",
      period: "Période",
      status: "Statut",
      priority: "Priorité",
      category: "Catégorie",
      progress: "Progression",
      dueDate: "Date d'échéance",
      startDate: "Date de début",
      endDate: "Date de fin",
      timeEstimate: "Estimation du temps (min)",
      metricTarget: "Objectif métrique",
      metricUnit: "Unité",
      day: "Jour",
      month: "Mois",
      year: "Année",
      todo: "À faire",
      inProgress: "En cours",
      done: "Terminé",
      low: "Basse",
      medium: "Moyenne",
      high: "Haute",
      work: "Travail",
      health: "Santé",
      learning: "Apprentissage",
      personal: "Personnel",
      finance: "Finances",
      creative: "Créatif",
      general: "Général",
      overdue: "En retard",
      duration: "Durée",
      hours: "heures",
      days: "jours",
      months: "mois",
      taskCreated: "Tâche créée",
      taskUpdated: "Tâche mise à jour",
      taskDeleted: "Tâche supprimée",
      deleteConfirm: "Supprimer cette tâche?",
      deleteDescription: "Cette tâche sera retirée de votre suivi. Cette action est irréversible.",
      emptyTasks: "Aucune tâche pour l'instant",
      emptyTasksDescription: "Ajoutez votre première tâche pour commencer à bâtir votre élan quotidien, mensuel et annuel.",
      taskDialogDescription: "Suivez le travail sur la journée, le mois et l'année — gardez votre rythme régulier.",
      titlePlaceholder: "ex. Examiner les métriques du T3",
      metricUnitPlaceholder: "km, livres, USD…",
      notesPlaceholder: "Contexte, liens ou sous-étapes facultatifs…",
      createTask: "Créer une tâche",
      noDuration: "Aucune durée définie",
      saveChanges: "Enregistrer les modifications",
      tryAgain: "Réessayer",
      subtitle: "Capturez, organisez et terminez ce qui compte.",
      markedDone: "Marqué comme terminé",
      reopened: "Réouvert",
      reopenTask: "Rouvrir la tâche",
      markTaskDone: "Marquer la tâche comme terminée",
      edit: "Modifier",
      delete: "Supprimer",
      target: "Objectif",
      min: "min",
      noMatches: "Aucune tâche ne correspond à ces filtres",
      tryClearingFilters: "Essayez d'effacer la recherche ou de changer de période.",
      createFirstTask: "Créez votre première tâche",
    },
    dashboard: {
      dashboard: "Tableau de bord",
      focusScore: "Score de concentration",
      today: "Aujourd'hui",
      thisMonth: "Ce mois",
      thisYear: "Cette année",
      completed: "Terminé",
      inProgress: "En cours",
      overdue: "En retard",
      momentum: "Élan",
    },
    navigation: {
      dashboard: "Tableau de bord",
      tasks: "Tâches",
      analytics: "Analyses",
      timeline: "Chronologie",
      logout: "Déconnexion",
      navigate: "Navigation",
      workspace: "Espace de travail",
    },
    errors: {
      required: "Ce champ est requis",
      invalidEmail: "Veuillez entrer un email valide",
      minLength: "Doit contenir au moins {min} caractères",
      somethingWentWrong: "Quelque chose s'est mal passé",
    },
  },
  ar: {
    common: {
      loading: "جاري التحميل...",
      save: "حفظ",
      saveChanges: "حفظ التغييرات",
      cancel: "إلغاء",
      delete: "حذف",
      edit: "تعديل",
      create: "إنشاء",
      close: "إغلاق",
      yes: "نعم",
      no: "لا",
      confirm: "تأكيد",
      search: "بحث...",
      tryAgain: "حاول مرة أخرى",
      all: "الكل",
    },
    auth: {
      signIn: "تسجيل الدخول",
      signUp: "إنشاء حساب",
      createAccount: "إنشاء حساب",
      alreadyHaveAccount: "لديك حساب بالفعل؟",
      forgotPassword: "نسيت كلمة المرور؟",
      email: "البريد الإلكتروني",
      password: "كلمة المرور",
      name: "الاسم",
      phone: "الهاتف",
      countryCode: "رمز الدولة",
      loginDescription: "سجل الدخول إلى حسابك لتحميل المهام المحفوظة.",
      registerDescription: "يحصل المستخدمون الجدد على عرض قاعدة بيانات المهام الخاصة بهم.",
      welcomeBack: "مرحبًا بعودتك",
      welcomeBackDescription: "تم تحميل بيانات التتبع المحفوظة الخاصة بك.",
      accountCreated: "تم إنشاء الحساب",
      accountCreatedDescription: "مساحة عملك الخاصة جاهزة.",
      loginFailed: "فشل تسجيل الدخول",
      createAccountFailed: "تعذر إنشاء الحساب",
      namePlaceholder: "اسمك",
      passwordPlaceholder: "6 أحرف على الأقل",
    },
    tasks: {
      tasks: "المهام",
      newTask: "مهمة جديدة",
      editTask: "تعديل المهمة",
      title: "العنوان",
      notes: "ملاحظات",
      period: "الفترة",
      status: "الحالة",
      priority: "الأولوية",
      category: "الفئة",
      progress: "التقدم",
      dueDate: "تاريخ الاستحقاق",
      startDate: "تاريخ البدء",
      endDate: "تاريخ الانتهاء",
      timeEstimate: "تقدير الوقت (دقيقة)",
      metricTarget: "الهدف المتري",
      metricUnit: "الوحدة",
      day: "يوم",
      month: "شهر",
      year: "سنة",
      todo: "للقيام",
      inProgress: "قيد التنفيذ",
      done: "مكتمل",
      low: "منخفضة",
      medium: "متوسطة",
      high: "عالية",
      work: "عمل",
      health: "صحة",
      learning: "تعلم",
      personal: "شخصي",
      finance: "مالية",
      creative: "إبداعي",
      general: "عام",
      overdue: "متأخر",
      duration: "المدة",
      hours: "ساعات",
      days: "أيام",
      months: "أشهر",
      taskCreated: "تم إنشاء المهمة",
      taskUpdated: "تم تحديث المهمة",
      taskDeleted: "تم حذف المهمة",
      deleteConfirm: "حذف هذه المهمة؟",
      deleteDescription: "سيتم إزالة هذه المهمة من متتبعك. لا يمكن التراجع عن هذا الإجراء.",
      emptyTasks: "لا توجد مهام بعد",
      emptyTasksDescription: "أضف مهمتك الأولى لبدء بناء الزخم اليومي والشهري والسنوي.",
      taskDialogDescription: "تتبع العمل عبر اليوم والشهر والسنة — حافظ على إيقاعك ثابتًا.",
      titlePlaceholder: "مثال: مراجعة مقاييس الربع الثالث",
      metricUnitPlaceholder: "كم، كتب، دولار…",
      notesPlaceholder: "سياق اختياري، روابط، أو خطوات فرعية…",
      createTask: "إنشاء مهمة",
      noDuration: "لم يتم تحديد المدة",
      saveChanges: "حفظ التغييرات",
      tryAgain: "حاول مرة أخرى",
    },
    dashboard: {
      dashboard: "لوحة التحكم",
      focusScore: "درجة التركيز",
      today: "اليوم",
      thisMonth: "هذا الشهر",
      thisYear: "هذا العام",
      completed: "مكتمل",
      inProgress: "قيد التنفيذ",
      overdue: "متأخر",
      momentum: "الزخم",
      workspace: "مساحة العمل",
    },
    navigation: {
      dashboard: "لوحة التحكم",
      tasks: "المهام",
      analytics: "التحليلات",
      timeline: "الجدول الزمني",
      logout: "تسجيل الخروج",
      navigate: "التنقل",
      workspace: "مساحة العمل",
    },
    errors: {
      required: "هذا الحقل مطلوب",
      invalidEmail: "الرجاء إدخال بريد إلكتروني صالح",
      minLength: "يجب أن يحتوي على الأقل على {min} حرف",
      somethingWentWrong: "حدث خطأ ما",
    },
  },
};

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  direction: "ltr" | "rtl";
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

// Get browser language
function getBrowserLanguage(): Language {
  const browserLang = navigator.language.split("-")[0];
  if (browserLang === "fr") return "fr";
  if (browserLang === "ar") return "ar";
  return "en";
}

// Language storage key
const LANGUAGE_STORAGE_KEY = "tempotrack_language";

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY) as Language;
    return saved || getBrowserLanguage();
  });

  const direction = language === "ar" ? "rtl" : "ltr";

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = lang;
  };

  // Initialize direction on mount
  useEffect(() => {
    document.documentElement.dir = direction;
    document.documentElement.lang = language;
  }, [language, direction]);

  const t = (key: string, params?: Record<string, string | number>): string => {
    const [namespace, ...path] = key.split(".");
    let value = translations[language][namespace];
    
    for (const p of path) {
      if (value && typeof value === "object") {
        value = value[p];
      } else {
        break;
      }
    }

    let result = typeof value === "string" ? value : key;
    
    // Replace parameters
    if (params) {
      Object.entries(params).forEach(([paramKey, paramValue]) => {
        result = result.replace(`{${paramKey}}`, paramValue.toString());
      });
    }

    return result;
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage, t, direction }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) throw new Error("useI18n must be used inside I18nProvider");
  return context;
}

// Helper function to get translated category list
export function getTranslatedCategories(t: (key: string) => string): string[] {
  return [
    t("tasks.work"),
    t("tasks.health"),
    t("tasks.learning"),
    t("tasks.personal"),
    t("tasks.finance"),
    t("tasks.creative"),
    t("tasks.general"),
  ];
}