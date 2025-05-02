'use client';

import React, { useState, useEffect, Suspense, lazy } from 'react';
import { useSession } from 'next-auth/react';
import Header from '@/components/layout/Header';
import PermissionDeniedBanner from '@/components/layout/PermissionDeniedBanner'; // Import the banner
// Import necessary icons for sidebar and loading/error states
import { 
    Database as DatabaseIcon, 
    Server, // TestBenches
    Users, // Users - Keep icon for now, or remove if not used elsewhere
    ClipboardList, // Projects, ProjectOverview
    Package, // Software
    Cpu, // PcOverview
    Archive, // ModelStands
    TestTube, // Wetbenches
    CircuitBoard, // HilTechnology, HardwareInstallation
    SlidersHorizontal, // HilOperation
    KeyRound, // Licenses
    Cloud, // VmInstances
    AlertTriangle, 
    Loader2,
    Settings,
    CheckSquare,
    Activity,
    Wrench,
    FileText,
    Gauge
} from 'lucide-react'; 

// Lazy load components
const TestBenchList = lazy(() => import('@/components/database/TestBenchList'));
const PcOverviewList = lazy(() => import('@/components/database/PcOverviewList'));
const ProjectsList = lazy(() => import('@/components/database/ProjectsList'));
// Removed UsersList import
// const UsersList = lazy(() => import('@/components/database/UsersList')); 
const SoftwareList = lazy(() => import('@/components/database/SoftwareList'));
const ModelStandsList = lazy(() => import('@/components/database/ModelStandsList'));
const VmInstancesList = lazy(() => import('@/components/database/VmInstancesList'));
const LicensesList = lazy(() => import('@/components/database/LicensesList'));
const WetbenchesList = lazy(() => import('@/components/database/WetbenchesList'));
const HilTechnologyList = lazy(() => import('@/components/database/HilTechnologyList'));
const HilOperationList = lazy(() => import('@/components/database/HilOperationList'));
const HardwareInstallationList = lazy(() => import('@/components/database/HardwareInstallationList'));
const ProjectOverviewList = lazy(() => import('@/components/database/ProjectOverviewList'));

// Type definition for table configuration
interface TableConfig {
    key: string;
    name: string;
    icon: React.ElementType;
    component: React.ElementType;
}

// Configuration for the sidebar navigation
const tableConfig: TableConfig[] = [
    { key: 'TestBenches', name: 'Test Benches', icon: Server, component: TestBenchList },
    { key: 'PcOverview', name: 'PC Overview', icon: Settings, component: PcOverviewList },
    { key: 'Projects', name: 'Projects', icon: FileText, component: ProjectsList },
    // Removed Users entry
    // { key: 'Users', name: 'Users', icon: Users, component: UsersList },
    { key: 'Software', name: 'Software', icon: CheckSquare, component: SoftwareList },
    { key: 'ModelStands', name: 'Model Stands', icon: DatabaseIcon, component: ModelStandsList },
    { key: 'VmInstances', name: 'VM Instances', icon: Server, component: VmInstancesList },
    { key: 'Licenses', name: 'Licenses', icon: KeyRound, component: LicensesList },
    { key: 'Wetbenches', name: 'Wetbenches', icon: TestTube, component: WetbenchesList },
    { key: 'HilTechnology', name: 'HIL Technology', icon: CircuitBoard, component: HilTechnologyList },
    { key: 'HilOperation', name: 'HIL Operation', icon: Activity, component: HilOperationList },
    { key: 'HardwareInstallation', name: 'Hardware Installation', icon: Wrench, component: HardwareInstallationList },
    { key: 'ProjectOverview', name: 'Project Overview', icon: Gauge, component: ProjectOverviewList },
];

// Permission levels (copied from page.tsx for typing)
type PermissionLevel = 'Admin' | 'Edit' | 'Read';

// Component Definition
export default function DatabasePage() {
  const { data: session, status: sessionStatus } = useSession(); // Get session status
  const [activeTable, setActiveTable] = useState<string>('TestBenches');
  const [loadingPermission, setLoadingPermission] = useState(true);
  const [userPermission, setUserPermission] = useState<PermissionLevel>('Read');

  // --- Fetch User Permission ---
  useEffect(() => {
    async function fetchPermission() {
      // Only fetch if session is loaded
      if (sessionStatus === 'authenticated') {
        setLoadingPermission(true);
        try {
          const response = await fetch('/api/user/permissions');
          if (!response.ok) {
            throw new Error('Failed to fetch permissions');
          }
          const data = await response.json();
          setUserPermission(data.permissionName || 'Read');
        } catch (error) {
          console.error("Error fetching user permission for Database page:", error);
          setUserPermission('Read'); // Default to Read on error
        }
        setLoadingPermission(false);
      } else if (sessionStatus === 'unauthenticated') {
        setUserPermission('Read'); // Treat unauthenticated as Read
        setLoadingPermission(false);
      }
      // If loading, wait for status change
    }
    fetchPermission();
  }, [sessionStatus]);

  // --- Table Configuration --- 
  const CurrentTableComponent = tableConfig.find(t => t.key === activeTable)?.component;

  // --- Styles (Moved UP) ---
  const styles: { [key: string]: React.CSSProperties } = {
    sidebar: {
      width: 240,
      minWidth: 240,
      backgroundColor: '#eef2f6',
      borderRight: '1px solid #d1d5db',
      padding: '1.5rem 1rem',
      overflowY: 'auto',
      height: 'calc(100vh - 64px)', // Match admin layout sidebar height
    },
    navList: {
      listStyle: 'none', 
      padding: 0, 
      margin: 0 
    },
    navButton: {
      display: 'flex',
      alignItems: 'center',
      padding: '0.75rem 1rem',
      borderRadius: '0.375rem',
      width: '100%', 
      textAlign: 'left',
      border: 'none', 
      cursor: 'pointer',
      backgroundColor: 'transparent', // Default background
      color: '#4b5563', // Default color
      fontWeight: 'normal',
      transition: 'background-color 0.2s ease, color 0.2s ease',
      marginBottom: '0.5rem' // Added spacing between items
    },
    navButtonActive: {
      backgroundColor: '#dbeafe', // Light blue active
      color: '#0F3460', // Dark blue text active
      fontWeight: '600'
    },
    navIcon: {
      marginRight: '0.75rem'
    },
    mainContent: {
      flex: 1, 
      padding: '2rem', 
      backgroundColor: '#f8fafc',
      overflowY: 'auto',
      height: 'calc(100vh - 64px)' // Explicit height to enable scrolling
    },
    loadingFallback: {
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100%', 
      color: '#6b7280'
    }
  };

  // --- Render Logic ---
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Header />

      {/* Loading Permissions State */}
      {loadingPermission && (
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          Loading Access Permissions...
        </div>
      )}

      {/* Permission Denied State - Added wrapper div for positioning */}
      {!loadingPermission && userPermission === 'Read' && (
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'flex-start', paddingTop: '2rem' }}>
              <PermissionDeniedBanner />
          </div>
      )}

      {/* Authorized State: Show Sidebar and Content */}
      {!loadingPermission && userPermission !== 'Read' && (
          <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
            {/* Sidebar */}
            <div style={styles.sidebar}>
              {/* Sidebar Title Removed */}
              <ul style={styles.navList}>
                {tableConfig.map((table) => {
                    const isActive = activeTable === table.key;
                    return (
                      <li key={table.key}>
                        <button
                          onClick={() => setActiveTable(table.key)}
                          style={{
                            ...styles.navButton, 
                            ...(isActive ? styles.navButtonActive : {}),
                          }}
                          // Add hover effects directly here for simplicity
                          onMouseOver={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = '#f3f4f6'; }}
                          onMouseOut={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = 'transparent'; }}
                        >
                          <table.icon size={18} style={styles.navIcon} />
                          {table.name}
                        </button>
                      </li>
                    );
                 }
                )}
              </ul>
            </div>
            
            {/* Main Content Area */}
            <div style={styles.mainContent}>
               {CurrentTableComponent ? (
                 <Suspense fallback={<div style={styles.loadingFallback}>Loading Table...</div>}>
                   <CurrentTableComponent />
                 </Suspense>
               ) : (
                 <div style={styles.loadingFallback}>Select a table</div>
               )}
            </div>
          </div>
      )}
    </div>
  );
}

// --- Styles --- 
// ... styles object ... 