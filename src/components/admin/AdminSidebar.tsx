'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, ShieldCheck, Settings } from 'lucide-react'; // Added ShieldCheck for Groups

const AdminSidebar = () => {
  const pathname = usePathname();

  const linkClasses = (path: string) => 
    `flex items-center px-4 py-3 rounded-md transition-colors duration-150 ease-in-out 
    ${pathname === path 
      ? 'bg-teal-100 text-teal-800 font-semibold' 
      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`;

  const iconClasses = (path: string) =>
    `mr-3 h-5 w-5 ${pathname === path ? 'text-teal-600' : 'text-gray-400 group-hover:text-gray-500'}`;

  return (
    <div className="w-64 bg-white border-r border-gray-200 p-4 flex flex-col h-full">
      <div className="mb-6">
        {/* You can add a logo or title here if needed */}
        <h2 className="text-xl font-semibold text-gray-800 px-4">Admin Panel</h2>
      </div>
      <nav className="flex-grow">
        <ul>
          <li>
            <Link href="/admin" className={linkClasses('/admin')}>
              <LayoutDashboard className={iconClasses('/admin')} />
              Dashboard
            </Link>
          </li>
          <li className="mt-1">
            <Link href="/admin/users" className={linkClasses('/admin/users')}>
              <Users className={iconClasses('/admin/users')} />
              Users
            </Link>
          </li>
          {/* Add Groups Link */}
          <li className="mt-1">
            <Link href="/admin/groups" className={linkClasses('/admin/groups')}>
              <ShieldCheck className={iconClasses('/admin/groups')} /> 
              Groups
            </Link>
          </li>
          {/* Add other links like Settings if needed */}
          {/* <li className="mt-1">
            <Link href="/admin/settings" className={linkClasses('/admin/settings')}>
              <Settings className={iconClasses('/admin/settings')} />
              Settings
            </Link>
          </li> */}
        </ul>
      </nav>
      <div className="mt-auto p-4 text-center text-sm text-gray-500">
        {/* Footer content if needed */}
        © {new Date().getFullYear()} Reconnect
      </div>
    </div>
  );
};

export default AdminSidebar; 