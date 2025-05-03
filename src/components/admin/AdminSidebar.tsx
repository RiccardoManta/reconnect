'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Users, ShieldCheck } from 'lucide-react'; // Removed LayoutDashboard

// Replicated styles from database/page.tsx
const styles: { [key: string]: React.CSSProperties } = {
    sidebar: {
      width: 240,
      minWidth: 240,
      backgroundColor: '#eef2f6',
      borderRight: '1px solid #d1d5db',
      padding: '1.5rem 1rem',
      display: 'flex',
      flexDirection: 'column',
      overflowY: 'auto'
    },
    navList: {
      listStyle: 'none', 
      padding: 0, 
      margin: 0 
    },
    navLinkBase: { // Replaced navButton
      display: 'flex',
      alignItems: 'center',
      padding: '0.75rem 1rem',
      borderRadius: '0.375rem',
      width: '100%', 
      textAlign: 'left',
      border: 'none', 
      cursor: 'pointer',
      backgroundColor: 'transparent', 
      color: '#4b5563', 
      fontWeight: 'normal',
      textDecoration: 'none', // Added for Link
      transition: 'background-color 0.2s ease, color 0.2s ease',
      marginBottom: '0.5rem' 
    },
    navLinkActive: { // Replaced navButtonActive
      backgroundColor: '#dbeafe', // Light blue active
      color: '#0F3460', // Dark blue text active
      fontWeight: '600',
      borderRadius: 0 // Attempt to fix Firefox rendering glitch
    },
    navIcon: {
      marginRight: '0.75rem'
    }
  };

// Define navigation items here directly
const adminNavItems = [
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Groups', href: '/admin/groups', icon: ShieldCheck },
];

const AdminSidebar = () => {
  const pathname = usePathname();

  return (
    // Use the sidebar style
    <div style={styles.sidebar}>
      {/* Header removed */}
      <nav style={{ flexGrow: 1 }}> {/* Use style instead of className */}
        <ul style={styles.navList}>
          {/* Dashboard link removed */}
          {adminNavItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.name}> {/* Removed className="mt-1" */}
                <Link 
                  href={item.href} 
                  style={{
                    ...styles.navLinkBase,
                    ...(isActive ? styles.navLinkActive : {}),
                  }}
                  // Apply hover directly for non-active links
                  onMouseOver={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = '#f3f4f6'; }}
                  onMouseOut={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                  <item.icon size={18} style={styles.navIcon} />
                  {item.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      {/* Footer removed for closer match to database sidebar appearance */}
      {/* <div className="mt-auto p-4 text-center text-sm text-gray-500">
        © {new Date().getFullYear()} Reconnect
      </div> */}
    </div>
  );
};

export default AdminSidebar; 