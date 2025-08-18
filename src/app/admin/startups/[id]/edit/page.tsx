'use client';
import AdminStartupForm from '@/components/admin/startups/AdminStartupForm';

export default function EditStartupPage({ params }: { params: { id: string } }) {
  return <AdminStartupForm startupId={params.id} />;
}
