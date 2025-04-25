'use client';

import React from 'react'; // Keep React import, useState is no longer needed here
import Header from '@/components/layout/Header';
import { Database as DatabaseIcon, Table, Server, Lock } from 'lucide-react'; // Keep only used icons

// Import all refactored list components
import TestBenchList from '@/components/database/TestBenchList'; 
import ProjectsList from '@/components/database/ProjectsList'; 
import UsersList from '@/components/database/UsersList';
import LicensesList from '@/components/database/LicensesList';
import VmInstancesList from '@/components/database/VmInstancesList';
import ModelStandsList from '@/components/database/ModelStandsList';
import WetbenchesList from '@/components/database/WetbenchesList';
import HilTechnologyList from '@/components/database/HilTechnologyList';
import HilOperationList from '@/components/database/HilOperationList';
import HardwareInstallationList from '@/components/database/HardwareInstallationList';
import PcOverviewList from '@/components/database/PcOverviewList';
import ProjectOverviewList from '@/components/database/ProjectOverviewList';
import SoftwareList from '@/components/database/SoftwareList';

// Removed all original List function definitions (UsersList, LicensesList, etc.)
// Removed imports for specific database types (TestBench, Project, etc.)
// Removed modal imports (DetailsModal, AddEntryModal, EditableDetailsModal)

export default function DatabasePage() {
  return (
    <main style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      overflow: 'auto',
      maxHeight: '100vh'
    }}>
      <Header />
      
      <div style={{ 
        flex: 1, 
        padding: '2rem', 
        backgroundColor: '#f8fafc',
        overflowY: 'auto'
      }}>
        <div style={{ 
          maxWidth: '1200px', 
          margin: '0 auto'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '2rem'
          }}>
            <DatabaseIcon size={28} style={{ color: '#0F3460', marginRight: '1rem' }} />
            <h1 style={{
              fontSize: '1.75rem',
              fontWeight: 'bold',
              color: '#0F3460',
              margin: 0
            }}>Database Management</h1>
          </div>
          
          {/* Static Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '1.5rem',
            marginBottom: '2rem'
          }}>
            {/* Database Connection Card */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '0.5rem',
              padding: '1.5rem',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              transition: 'transform 0.2s, box-shadow 0.2s',
              cursor: 'pointer'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-3px)';
              e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <h2 style={{
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  color: '#111827',
                  margin: 0
                }}>Connection Settings</h2>
                <Server size={20} style={{ color: '#0F3460' }} />
              </div>
              <p style={{
                fontSize: '0.875rem',
                color: '#4b5563',
                margin: 0
              }}>Configure database connection parameters and credentials</p>
            </div>
            
            {/* Database Tables Card */}
             <div style={{
              backgroundColor: 'white',
              borderRadius: '0.5rem',
              padding: '1.5rem',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              transition: 'transform 0.2s, box-shadow 0.2s',
              cursor: 'pointer'
            }}
             onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-3px)';
              e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <h2 style={{
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  color: '#111827',
                  margin: 0
                }}>Tables</h2>
                <Table size={20} style={{ color: '#0F3460' }} />
              </div>
              <p style={{
                fontSize: '0.875rem',
                color: '#4b5563',
                margin: 0
              }}>View and manage database tables and records</p>
            </div>
            
            {/* Database Security Card */}
             <div style={{
              backgroundColor: 'white',
              borderRadius: '0.5rem',
              padding: '1.5rem',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              transition: 'transform 0.2s, box-shadow 0.2s',
              cursor: 'pointer'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-3px)';
              e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <h2 style={{
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  color: '#111827',
                  margin: 0
                }}>Security</h2>
                <Lock size={20} style={{ color: '#0F3460' }} />
              </div>
              <p style={{
                fontSize: '0.875rem',
                color: '#4b5563',
                margin: 0
              }}>Manage database access permissions and security settings</p>
            </div>
          </div> {/* End Static Cards Grid */}
          
          {/* Connection Status */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '0.5rem',
            padding: '1.5rem',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            marginBottom: '2rem'
          }}>
            <h2 style={{
              fontSize: '1.25rem',
              fontWeight: '600',
              color: '#111827',
              marginTop: 0,
              marginBottom: '1rem'
            }}>Connection Status</h2>
            
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '1rem'
            }}>
              <div style={{
                width: '0.75rem',
                height: '0.75rem',
                borderRadius: '50%',
                backgroundColor: '#10b981',
                boxShadow: '0 0 5px #10b981'
              }}></div>
              <span style={{ fontSize: '0.875rem', color: '#111827' }}>Connected to SQLite database</span>
            </div>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '1rem'
            }}>
              <div>
                <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '0 0 0.25rem 0' }}>Database File</p>
                <p style={{ fontSize: '0.875rem', color: '#111827', margin: 0 }}>reconnect.db</p>
              </div>
              
              <div>
                <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '0 0 0.25rem 0' }}>Tables</p>
                <p style={{ fontSize: '0.875rem', color: '#111827', margin: 0 }}>12</p>
              </div>
              
              <div>
                <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '0 0 0.25rem 0' }}>Records</p>
                <p style={{ fontSize: '0.875rem', color: '#111827', margin: 0 }}>Multiple</p>
              </div>
            </div>
          </div> {/* End Connection Status */}
          
          {/* Display all database tables using imported components */}
          <TestBenchList />
          <PcOverviewList />
          <ProjectsList />
          <UsersList />
          <SoftwareList />
          <ModelStandsList />
          <VmInstancesList />
          <LicensesList />
          <WetbenchesList />
          <HilTechnologyList />
          <HilOperationList />
          <HardwareInstallationList />
          <ProjectOverviewList />
        </div> {/* End Inner Wrapper */}
      </div> {/* End Content Wrapper */}
    </main>
  );
} 