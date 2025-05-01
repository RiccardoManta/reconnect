'use client';

import React, { useState, useEffect, Suspense, lazy } from 'react';
import { useSession } from 'next-auth/react';
import Header from '@/components/layout/Header';
// Import necessary icons for sidebar and loading/error states
import { 
    Database as DatabaseIcon, 
    Server, // TestBenches
    Users, // Users
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
const UsersList = lazy(() => import('@/components/database/UsersList'));
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
    { key: 'Users', name: 'Users', icon: Users, component: UsersList },
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

export default function DatabasePage() {
  const { data: session, status: sessionStatus } = useSession();
  const [permissionStatus, setPermissionStatus] = useState<{ 
      loading: boolean; 
      isAdmin: boolean; 
      error: string | null; 
  }>({ loading: true, isAdmin: false, error: null });

  // State to track the selected table view
  const [selectedTable, setSelectedTable] = useState<string>(tableConfig[0].key); // Default to first table

  useEffect(() => {
    if (sessionStatus === 'authenticated') {
      setPermissionStatus({ loading: true, isAdmin: false, error: null });
      
      const checkPermission = async () => {
        try {
          const response = await fetch('/api/auth/permission');
          if (!response.ok) {
             let errorMsg = 'Failed to fetch permissions';
             try { const errorData = await response.json(); errorMsg = errorData.message || errorMsg; } catch(e){} 
             throw new Error(errorMsg);
          }
          const data = await response.json();
          if (data.permissionName === 'Admin') {
            setPermissionStatus({ loading: false, isAdmin: true, error: null });
          } else {
            setPermissionStatus({ loading: false, isAdmin: false, error: 'Access Denied: Admin permission required.' });
          }
        } catch (err) {
          console.error("Permission check error:", err);
          setPermissionStatus({ loading: false, isAdmin: false, error: err instanceof Error ? err.message : 'Error checking permissions' });
        }
      };
      checkPermission();
    } else if (sessionStatus === 'unauthenticated') {
       setPermissionStatus({ loading: false, isAdmin: false, error: 'Access Denied: Please log in.' });
    } else {
       setPermissionStatus({ loading: true, isAdmin: false, error: null });
    }

  }, [sessionStatus]);

  // --- Loading State --- 
  if (permissionStatus.loading) {
      return (
        <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
          <Header />
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#0F3460' }}>
            <Loader2 size={24} className="animate-spin" style={{ marginRight: '0.5rem' }} />
            <span>Loading...</span>
          </div>
        </main>
      );
  }

  // --- Access Denied State --- 
  if (!permissionStatus.isAdmin) {
      return (
        <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
          <Header />
          <div style={{
            flex: 1, 
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '2rem',
            textAlign: 'center'
          }}>
            <AlertTriangle size={48} style={{ color: '#ef4444', marginBottom: '1rem' }} />
            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#dc2626', marginBottom: '0.5rem' }}>Access Denied</h1>
            <p style={{ color: '#4b5563' }}>{permissionStatus.error || 'You do not have permission to view this page.'}</p>
          </div>
        </main>
      );
  }

  // --- Admin Access Granted: Render Page Content with Sidebar Layout --- 

  // Find the component to render based on selectedTable state
  const ActiveComponent = tableConfig.find(t => t.key === selectedTable)?.component;

  const sidebarWidth = 240; // Define sidebar width

  return (
    <main style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
    }}>
      <Header />
      
      {/* Flex container for sidebar and content - THIS should handle overflow and height */}
      <div style={{ 
        flex: 1, // Take remaining vertical space
        display: 'flex', 
        overflow: 'hidden' // Prevent this container itself from scrolling; children will scroll
      }}>
        
        {/* Sidebar */}
        <aside style={{
          width: `${sidebarWidth}px`,
          minWidth: `${sidebarWidth}px`,
          backgroundColor: '#eef2f6',
          borderRight: '1px solid #d1d5db',
          padding: '1.5rem 1rem',
          overflowY: 'auto', // Allow sidebar scrolling if needed
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem'
          // Removed height: 100% - let the parent div control height
        }}>
            <nav>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {tableConfig.map((item) => {
                        const isActive = item.key === selectedTable;
                        return (
                            <li key={item.key} style={{ marginBottom: '0.5rem' }}>
                                <button
                                    onClick={() => setSelectedTable(item.key)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        padding: '0.75rem 1rem',
                                        borderRadius: '0.375rem',
                                        width: '100%', // Make button full width
                                        textAlign: 'left', // Align text left
                                        border: 'none', // Remove button default border
                                        cursor: 'pointer',
                                        backgroundColor: isActive ? '#dbeafe' : 'transparent', // Light blue active
                                        color: isActive ? '#0F3460' : '#4b5563', // Dark blue text active
                                        fontWeight: isActive ? '600' : 'normal',
                                        transition: 'background-color 0.2s ease, color 0.2s ease'
                                    }}
                                    onMouseOver={(e) => {
                                        if (!isActive) {
                                            e.currentTarget.style.backgroundColor = '#f3f4f6'; // Light gray hover
                                            e.currentTarget.style.color = '#111827'; // Darker text on hover
                                        }
                                    }}
                                    onMouseOut={(e) => {
                                        if (!isActive) {
                                            e.currentTarget.style.backgroundColor = 'transparent';
                                            e.currentTarget.style.color = '#4b5563';
                                        }
                                    }}
                                >
                                    <item.icon size={18} style={{ marginRight: '0.75rem' }} />
                                    {item.name}
                                </button>
                            </li>
                        );
                    })}
                </ul>
            </nav>
        </aside>

        {/* Main Content Area Wrapper - This should scroll */}
        <div style={{ 
          flex: 1, 
          padding: '2rem', 
          backgroundColor: '#f8fafc',
          overflowY: 'auto', // Allow content scrolling
          height: 'calc(100vh - 64px)' // Explicit height (adjust 64px if header height differs)
        }}>
            <Suspense fallback={
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <Loader2 size={24} className="animate-spin" style={{ marginRight: '0.5rem' }} />
                    Loading...
                </div>
            }>
                {ActiveComponent ? <ActiveComponent /> : <div>Select a table</div>} 
            </Suspense>
        </div> {/* End Content Wrapper */}
      </div> {/* End Flex Container */}
    </main>
  );
} 