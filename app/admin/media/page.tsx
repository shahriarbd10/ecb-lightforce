import AdminMediaManager from "@/components/AdminMediaManager";
import AdminLandingCustomizer from "@/components/AdminLandingCustomizer";

export default function AdminMediaPage() {
  return (
    <main className="container-page">
      <h1 className="text-3xl font-bold">Admin Media Dashboard</h1>
      <p className="mt-2 text-white/75">Manage landing page photos, videos, and advertisement cards.</p>
      <div className="mt-6">
        <AdminLandingCustomizer />
      </div>
      <AdminMediaManager />
    </main>
  );
}
