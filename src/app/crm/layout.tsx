import { AuthProvider } from "@/contexts/AuthContext";

export const metadata = {
  title: "Goldstone Visa CRM",
  description: "Goldstone Visa CRM Yönetim Paneli",
};

export default function CrmLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
}
