export interface Profile {
  id: string;
  email: string | null;
  name: string | null;
  avatarUrl: string | null;
  currency: string;
  locale: string;
  showLanguageSelector: boolean;
  activeSpaceId: string | null;
  dashboardCards: string[] | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  accentColor: string | null;
  role: "user" | "admin";
  createdAt: string;
}
