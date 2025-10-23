// app/admin/page.tsx
import { auth } from '@/auth';

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== 'admin') {
    return <div>Access denied. Admins only.</div>;
  }

  return (
    <div>
      <h1>Admin Panel</h1>
      <p>Welcome, {session.user.name}! You have admin privileges.</p>
    </div>
  );
}
