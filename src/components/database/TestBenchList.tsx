'use client';

import React, { useState } from 'react';
import { Server, RefreshCw, Plus } from 'lucide-react';
import EditableDetailsModal from '@/components/EditableDetailsModal'; 
import AddEntryModal from '@/components/AddEntryModal'; 
import { TestBench, User, Project } from '@/types/database'; 
import { keysToCamel, keysToSnake } from '@/utils/caseConverter';

// Define field types for modals (can be moved to a shared types file later)
type FieldType = 'text' | 'number' | 'date' | 'select';

interface SelectOption {
  value: string;
  label: string;
}

interface BaseField {
  name: string;
  label: string;
  required?: boolean;
  editable?: boolean;
}

interface TextField extends BaseField {
  type: 'text';
}

interface NumberField extends BaseField {
    type: 'number';
}

interface DateField extends BaseField {
  type: 'date';
}

interface SelectField extends BaseField {
  type: 'select';
  options: SelectOption[];
}

type ModalField = TextField | NumberField | DateField | SelectField;


export default function TestBenchList() {
  const [testBenches, setTestBenches] = useState<TestBench[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTestBench, setSelectedTestBench] = useState<TestBench | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  const fetchRelatedData = async () => {
    try {
      // Fetch users
      const usersResponse = await fetch('/api/users');
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        // Convert incoming snake_case keys to camelCase
        setUsers(keysToCamel<User[]>(usersData.users || []));
      }

      // Fetch projects
      const projectsResponse = await fetch('/api/projects');
      if (projectsResponse.ok) {
        const projectsData = await projectsResponse.json();
        // Convert incoming snake_case keys to camelCase
        setProjects(keysToCamel<Project[]>(projectsData.projects || []));
      }
    } catch (err) {
      console.error('Error fetching related data:', err);
      // Optionally set an error state here
    }
  };

  const fetchData = async () => {
    if (hasLoaded) return;
    setLoading(true);
    setError(null); // Clear previous errors
    try {
      const response = await fetch('/api/testbenches');
      if (!response.ok) {
        throw new Error('Failed to fetch test benches');
      }
      const data = await response.json();
      // Convert incoming snake_case keys to camelCase
      setTestBenches(keysToCamel<TestBench[]>(data.testBenches || []));
      setHasLoaded(true);
    } catch (err) {
      setError('Error loading test benches: ' + (err instanceof Error ? err.message : String(err)));
      console.error('Error fetching test benches:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = () => {
    const newExpandedState = !isExpanded;
    setIsExpanded(newExpandedState);
    if (newExpandedState && !hasLoaded && !loading) {
      fetchData();
    }
  };

  const handleAddClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    fetchRelatedData(); // Fetch users and projects for dropdowns
    setIsAddModalOpen(true);
  };

  const handleSaveEntry = async (formData: Record<string, any>) => {
    try {
      // Convert outgoing camelCase keys to snake_case for the API
      const snakeCaseData = keysToSnake(formData);
      const response = await fetch('/api/testbenches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(snakeCaseData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add test bench');
      }

      // Refresh data - API returns snake_case, convert to camelCase
      // No need to call fetchData() again, just update state with new data
      const savedData = await response.json(); 
      const newBench = keysToCamel<TestBench>(savedData.testBench);
      setTestBenches(prev => [...prev, newBench]);
      setIsAddModalOpen(false); // Close modal on success

    } catch (err) {
       console.error("Failed to save entry:", err);
       // Let the modal handle displaying the error
       throw err; 
    }
  };

  const handleUpdateTestBench = async (formData: Record<string, any>) => {
    try {
      // Ensure benchId is present (already camelCase from modal)
      if (!formData.benchId) {
        throw new Error('Test bench ID is required');
      }

      // Convert outgoing camelCase keys to snake_case for the API
      const snakeCaseData = keysToSnake(formData);
      const response = await fetch('/api/testbenches', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(snakeCaseData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update test bench');
      }

      // API returns the updated record in snake_case, convert to camelCase
      const data = await response.json();
      const updatedBench = keysToCamel<TestBench>(data.testBench);

      // Update local state with camelCase data
      setTestBenches(prev =>
        prev.map(bench =>
          bench.benchId === updatedBench.benchId ? updatedBench : bench
        )
      );

      // Update selected test bench with camelCase data
      setSelectedTestBench(updatedBench);
      // Optionally close the modal on successful update
      // setSelectedTestBench(null);

    } catch (err) {
      console.error("Failed to update test bench:", err);
      // Let the modal handle displaying the error
      throw err; 
    }
  };

  // Define fields for the add entry modal using camelCase names
  const addEntryFields: ModalField[] = [
    { name: 'hilName', label: 'HIL Name', type: 'text', required: true },
    { name: 'ppNumber', label: 'PP Number', type: 'text' },
    { name: 'systemType', label: 'System Type', type: 'text' },
    { name: 'benchType', label: 'Bench Type', type: 'text' },
    { name: 'acquisitionDate', label: 'Acquisition Date', type: 'date' },
    { name: 'location', label: 'Location', type: 'text' },
    {
      name: 'userId', // Use camelCase for the form field name
      label: 'User',
      type: 'select',
      options: users.map(user => ({
        value: String(user.userId), // Reference camelCase property
        label: user.userName,      // Reference camelCase property
      })),
    },
    {
      name: 'projectId', // Use camelCase for the form field name
      label: 'Project',
      type: 'select',
      options: projects.map(project => ({
        value: String(project.projectId), // Reference camelCase property
        label: project.projectName,     // Reference camelCase property
      })),
    },
  ];

  // Define fields for the editable details modal using camelCase names
  // Note: Ensure the data passed to the modal includes userName and projectName if they need to be displayed initially
  const detailsFields: ModalField[] = [
    { name: 'benchId', label: 'Bench ID', type: 'number', editable: false },
    { name: 'hilName', label: 'HIL Name', type: 'text', required: true },
    { name: 'ppNumber', label: 'PP Number', type: 'text' },
    { name: 'systemType', label: 'System Type', type: 'text' },
    { name: 'benchType', label: 'Bench Type', type: 'text' },
    { name: 'acquisitionDate', label: 'Acquisition Date', type: 'date' },
    { name: 'location', label: 'Location', type: 'text' },
    {
      name: 'userId', // Use camelCase for the form field name
      label: 'User',
      type: 'select',
      options: users.map(user => ({
        value: String(user.userId), // Reference camelCase property
        label: user.userName,      // Reference camelCase property
      })),
    },
    {
      name: 'projectId', // Use camelCase for the form field name
      label: 'Project',
      type: 'select',
      options: projects.map(project => ({
        value: String(project.projectId), // Reference camelCase property
        label: project.projectName,     // Reference camelCase property
      })),
    },
  ];


  // JSX remains largely the same, but references camelCase properties
  return (
     <div style={{ marginTop: '2rem' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0.75rem 1rem',
          backgroundColor: 'white',
          borderRadius: '0.5rem',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          cursor: 'pointer',
          marginBottom: isExpanded ? '0.5rem' : '0',
          transition: 'background-color 0.2s'
        }}
        onClick={toggleExpand}
        onMouseOver={(e) => {
          e.currentTarget.style.backgroundColor = '#f9fafb';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.backgroundColor = 'white';
        }}
      >
        <h2 style={{
          fontSize: '1.25rem',
          fontWeight: '600',
          color: '#111827',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          margin: 0
        }}>
          <Server size={18} />
          Test Benches {hasLoaded ? `(${testBenches.length})` : ''}
        </h2>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          {loading && (
            <RefreshCw size={16} style={{ 
              animation: 'spin 1s linear infinite',
              color: '#6b7280'
            }} />
          )}
          <button
            onClick={handleAddClick}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              background: '#2563eb',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
            }}
            title="Add new test bench"
          >
            <Plus size={16} />
          </button>
          <div style={{
            transform: `rotate(${isExpanded ? 180 : 0}deg)`,
            transition: 'transform 0.2s'
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>
        </div>
      </div>
      
      {isExpanded && (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '0 0 0.5rem 0.5rem',
          padding: '1rem',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          overflowX: 'auto',
          transition: 'max-height 0.3s ease-in-out'
        }}>
          {loading ? (
             <div style={{ 
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '2rem',
              color: '#6b7280'
            }}>
              <RefreshCw size={24} style={{ 
                animation: 'spin 1s linear infinite',
                marginBottom: '0.5rem'
              }} />
              <p style={{ margin: 0 }}>Loading test benches...</p>
              {/* Keep keyframes style block if needed */}
              <style jsx>{`
                @keyframes spin {
                  from { transform: rotate(0deg); }
                  to { transform: rotate(360deg); }
                }
              `}</style>
            </div>
          ) : error ? (
             <div style={{ 
              textAlign: 'center', 
              padding: '1rem',
              backgroundColor: '#fee2e2',
              color: '#b91c1c',
              borderRadius: '0.5rem',
              fontSize: '0.875rem'
            }}>
              <p>{error}</p>
            </div>
          ) : (
            <table style={{
              width: '100%',
              borderCollapse: 'collapse'
            }}>
              <thead>
                <tr style={{
                  borderBottom: '1px solid #e5e7eb',
                  backgroundColor: '#f9fafb'
                }}>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563' }}>ID</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563' }}>HIL Name</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563' }}>PP Number</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563' }}>System Type</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563' }}>User</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563' }}>Project</th>
                </tr>
              </thead>
              <tbody>
                {testBenches.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>No test benches found</td>
                  </tr>
                ) : (
                  testBenches.map((bench) => ( // Use camelCase bench object
                    <tr key={bench.benchId} style={{ // Use camelCase key
                      borderBottom: '1px solid #e5e7eb',
                      transition: 'background-color 0.2s',
                      cursor: 'pointer'
                    }}
                    onClick={() => {
                      fetchRelatedData(); // Ensure related data is fetched (already uses camelCase)
                      setSelectedTestBench(bench); // Set camelCase bench
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = '#f9fafb';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827' }}>{bench.benchId}</td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827' }}>{bench.hilName}</td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827' }}>{bench.ppNumber}</td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827' }}>{bench.systemType}</td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827' }}>{bench.userName}</td> 
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827' }}>{bench.projectName}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Modals: Pass camelCase data and fields */} 
      {selectedTestBench && (
        <EditableDetailsModal
          isOpen={selectedTestBench !== null}
          onClose={() => setSelectedTestBench(null)}
          title={`Test Bench Details: ${selectedTestBench.hilName}`} // Use camelCase
          data={selectedTestBench} // Pass camelCase data
          fields={detailsFields} // Pass camelCase fields
          onSave={handleUpdateTestBench} // Handler expects camelCase, converts to snake_case for API
        />
      )}

      {isAddModalOpen && (
        <AddEntryModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Add New Test Bench"
          fields={addEntryFields} // Pass camelCase fields
          onSave={handleSaveEntry} // Handler expects camelCase, converts to snake_case for API
        />
      )}
    </div>
  );
} 