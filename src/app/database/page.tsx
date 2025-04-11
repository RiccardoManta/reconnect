'use client';

import React from 'react';
import Header from '@/components/layout/Header';
import { Database as DatabaseIcon, Table, Server, Lock } from 'lucide-react';

export default function DatabasePage() {
  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      
      <div style={{ 
        flex: 1, 
        padding: '2rem',
        backgroundColor: '#f8fafc'
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
          </div>
          
          <div style={{
            backgroundColor: 'white',
            borderRadius: '0.5rem',
            padding: '1.5rem',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
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
              <span style={{ fontSize: '0.875rem', color: '#111827' }}>Connected to primary database</span>
            </div>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '1rem'
            }}>
              <div>
                <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '0 0 0.25rem 0' }}>Host</p>
                <p style={{ fontSize: '0.875rem', color: '#111827', margin: 0 }}>db.chassis.local</p>
              </div>
              
              <div>
                <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '0 0 0.25rem 0' }}>Port</p>
                <p style={{ fontSize: '0.875rem', color: '#111827', margin: 0 }}>5432</p>
              </div>
              
              <div>
                <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '0 0 0.25rem 0' }}>Database</p>
                <p style={{ fontSize: '0.875rem', color: '#111827', margin: 0 }}>chassis_production</p>
              </div>
              
              <div>
                <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '0 0 0.25rem 0' }}>User</p>
                <p style={{ fontSize: '0.875rem', color: '#111827', margin: 0 }}>admin</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
} 