'use client';

import React, { useState, useEffect, CSSProperties } from 'react';
import { Server, RefreshCw, PlusCircle } from 'lucide-react';
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
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [systemTypes, setSystemTypes] = useState<string[]>([]);
  const [benchTypes, setBenchTypes] = useState<string[]>([]);

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

      // Fetch system types
      const systemTypesResponse = await fetch('/api/system-types');
      if (systemTypesResponse.ok) {
        const systemTypesData = await systemTypesResponse.json();
        setSystemTypes(systemTypesData.systemTypes || []);
      }

      // Fetch bench types
      const benchTypesResponse = await fetch('/api/bench-types');
      if (benchTypesResponse.ok) {
        const benchTypesData = await benchTypesResponse.json();
        setBenchTypes(benchTypesData.benchTypes || []);
      }
    } catch (err) {
      console.error('Error fetching related data:', err);
      // Optionally set an error state here
    }
  };

  const fetchData = async () => {
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
    } catch (err) {
      setError('Error loading test benches: ' + (err instanceof Error ? err.message : String(err)));
      console.error('Error fetching test benches:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    const loadInitialData = async () => {
      await fetchData(); // Fetch main test benches
      await fetchRelatedData(); // Fetch related users, projects, types
    };
    loadInitialData();
  }, []);

  const handleAddClick = () => {
    // fetchRelatedData(); // No longer needed here
    setIsAddModalOpen(true);
  };

  const handleRowClick = (bench: TestBench) => {
    // fetchRelatedData(); // No longer needed here
    setSelectedTestBench(bench);
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

      // Check if updatedBench exists and update state
      if (updatedBench) {
          // Update local list state with camelCase data
          setTestBenches(prev =>
            prev.map(bench =>
              bench.benchId === updatedBench.benchId ? updatedBench : bench
            )
          );
          // Update the selected state as well
          setSelectedTestBench(updatedBench);
      } else {
          console.error("Failed to get updated Test Bench data from API response:", data);
          throw new Error("Failed to process update response from server.");
      }

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
    { name: 'usagePeriod', label: 'Usage Period', type: 'text' },
    { name: 'location', label: 'Location', type: 'text' },
    { name: 'inventoryNumber', label: 'Inventory Number', type: 'text' },
    { name: 'eplan', label: 'E-Plan', type: 'text' },
    {
      name: 'userId',
      label: 'User',
      type: 'select',
      options: users.map(user => ({
        value: String(user.userId),
        label: user.userName,
      })),
    },
    {
      name: 'projectId',
      label: 'Project',
      type: 'select',
      options: projects.map(project => ({
        value: String(project.projectId),
        label: project.projectName,
      })),
    },
  ];

  // Define fields for the editable details modal using camelCase names
  const detailsFields: ModalField[] = [
    { name: 'benchId', label: 'Bench ID', type: 'number', editable: false },
    { name: 'hilName', label: 'HIL Name', type: 'text', required: true, editable: true },
    { name: 'ppNumber', label: 'PP Number', type: 'text', editable: true },
    {
      name: 'systemType',
      label: 'System Type',
      type: 'select',
      options: systemTypes.map(type => ({ value: type, label: type })),
      editable: true,
    },
    {
      name: 'benchType',
      label: 'Bench Type',
      type: 'select',
      options: benchTypes.map(type => ({ value: type, label: type })),
      editable: true,
    },
    { name: 'acquisitionDate', label: 'Acquisition Date', type: 'date', editable: true },
    { name: 'usagePeriod', label: 'Usage Period', type: 'text', editable: true },
    { name: 'location', label: 'Location', type: 'text', editable: true },
    { name: 'inventoryNumber', label: 'Inventory Number', type: 'text', editable: true },
    { name: 'eplan', label: 'E-Plan', type: 'text', editable: true },
    {
      name: 'userId',
      label: 'User',
      type: 'select',
      options: users.map(user => ({
        value: String(user.userId),
        label: user.userName,
      })),
      editable: true,
    },
    {
      name: 'projectId',
      label: 'Project',
      type: 'select',
      options: projects.map(project => ({
        value: String(project.projectId),
        label: project.projectName,
      })),
      editable: true,
    },
  ];

  // Explicitly type the styles object
  const styles: { [key: string]: CSSProperties } = {
    headerContainer: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '2rem'
    },
    headerTitleContainer: {
      display: 'flex',
      alignItems: 'center'
    },
    headerIcon: {
      color: '#0F3460',
      marginRight: '1rem'
    },
    headerTitle: {
      fontSize: '1.75rem',
      fontWeight: 'bold',
      color: '#0F3460',
      margin: 0
    },
    addButton: {
      border: 'none',
      borderRadius: '0.375rem',
      padding: '0.5rem 0.75rem',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      fontSize: '0.875rem',
      fontWeight: 500,
      boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
      backgroundColor: '#39A2DB',
      color: 'white',
    },
    tableContainer: {
      backgroundColor: 'white',
      borderRadius: '0.5rem',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      overflowX: 'auto' as 'auto',
    },
     loadingContainer: {
        display: 'flex',
        flexDirection: 'column', // No longer needs 'as const'
        alignItems: 'center',
        padding: '2rem',
        color: '#6b7280'
      },
      loadingSpinner: {
        animation: 'spin 1s linear infinite',
        marginBottom: '0.5rem'
      },
      errorContainer: {
        textAlign: 'center', // No longer needs 'as const'
        padding: '1rem',
        backgroundColor: '#fee2e2',
        color: '#b91c1c',
        borderRadius: '0.5rem',
        fontSize: '0.875rem'
      },
      table: {
        width: '100%',
        borderCollapse: 'collapse' // No longer needs 'as const'
      },
      tableHeaderRow: {
        borderBottom: '1px solid #e5e7eb',
        backgroundColor: '#f9fafb'
      },
      tableHeaderCell: {
        padding: '0.75rem 1rem',
        textAlign: 'left', // No longer needs 'as const'
        fontSize: '0.875rem',
        fontWeight: 600, // Use number for fontWeight
        color: '#4b5563'
      },
      tableBodyRow: {
        borderBottom: '1px solid #e5e7eb',
        transition: 'background-color 0.2s',
        cursor: 'pointer'
      },
      tableBodyCell: {
        padding: '0.75rem 1rem',
        fontSize: '0.875rem',
        color: '#111827'
      }
  };

  return (
     <div>
       {/* Page Header */}
       <div style={styles.headerContainer}>
         <div style={styles.headerTitleContainer}>
           {/* Use Server Icon */}
           <Server size={28} style={styles.headerIcon} />
           {/* Update Title */}
           <h1 style={styles.headerTitle}>
             Test Benches {testBenches.length > 0 ? `(${testBenches.length})` : ''}
           </h1>
         </div>
         {/* Add Test Bench Button */}
         <button
           onClick={handleAddClick} // Use updated handler
           style={styles.addButton}
           title="Add new test bench"
         >
           <PlusCircle size={18} style={{ marginRight: '0.5rem' }} />
           Add Test Bench
         </button>
       </div>

      {/* Table Container - No longer conditional */}
       <div style={styles.tableContainer}>
          {loading ? (
             <div style={styles.loadingContainer}>
               <RefreshCw size={24} style={styles.loadingSpinner} />
               <p style={{ margin: 0 }}>Loading test benches...</p>
               <style jsx>{`
                 @keyframes spin {
                   from { transform: rotate(0deg); }
                   to { transform: rotate(360deg); }
                 }
               `}</style>
             </div>
           ) : error ? (
             <div style={styles.errorContainer}>
               <p>{error}</p>
             </div>
           ) : (
             <table style={styles.table}>
               <thead>
                 <tr style={styles.tableHeaderRow}>
                   {/* Use style objects for header cells */}
                   <th style={styles.tableHeaderCell}>ID</th>
                   <th style={styles.tableHeaderCell}>HIL Name</th>
                   <th style={styles.tableHeaderCell}>PP Number</th>
                   <th style={styles.tableHeaderCell}>System Type</th>
                   <th style={styles.tableHeaderCell}>Bench Type</th> {/* Added Bench Type Header */}
                   <th style={styles.tableHeaderCell}>Acquisition Date</th> {/* Added Acq Date Header */}
                   <th style={styles.tableHeaderCell}>Usage Period</th>
                   <th style={styles.tableHeaderCell}>Location</th>
                   <th style={styles.tableHeaderCell}>Inv. Number</th>
                   <th style={styles.tableHeaderCell}>E-Plan</th>
                   <th style={styles.tableHeaderCell}>User</th>
                   <th style={styles.tableHeaderCell}>Project</th>
                 </tr>
               </thead>
               <tbody>
                 {testBenches.length === 0 ? (
                   <tr>
                     {/* Update colspan */}
                     <td colSpan={12} style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>No test benches found</td>
                   </tr>
                 ) : (
                   testBenches.map((bench) => {
                     // Find user and project names based on IDs
                     const userName = (users.length === 0 && loading) ? 'Loading...' : (users.find(u => u.userId === bench.userId)?.userName || 'N/A');
                     const projectName = (projects.length === 0 && loading) ? 'Loading...' : (projects.find(p => p.projectId === bench.projectId)?.projectName || 'N/A');

                     // Format date if it exists
                     const formattedAcquisitionDate = bench.acquisitionDate
                       ? new Date(bench.acquisitionDate).toLocaleDateString()
                       : '-';

                     return (
                       <tr key={bench.benchId}
                         style={styles.tableBodyRow}
                         onClick={() => {
                             handleRowClick(bench);
                         }}
                         onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#f9fafb'; }}
                         onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                       >
                         {/* Use style objects for body cells */}
                         <td style={styles.tableBodyCell}>{bench.benchId}</td>
                         <td style={styles.tableBodyCell}>{bench.hilName}</td>
                         <td style={styles.tableBodyCell}>{bench.ppNumber || '-'}</td>
                         <td style={styles.tableBodyCell}>{bench.systemType || '-'}</td>
                         <td style={styles.tableBodyCell}>{bench.benchType || '-'}</td> {/* Added Bench Type Cell */}
                         <td style={styles.tableBodyCell}>{formattedAcquisitionDate}</td> {/* Added Acq Date Cell */}
                         <td style={styles.tableBodyCell}>{bench.usagePeriod || '-'}</td>
                         <td style={styles.tableBodyCell}>{bench.location || '-'}</td>
                         <td style={styles.tableBodyCell}>{bench.inventoryNumber || '-'}</td>
                         <td style={styles.tableBodyCell}>{bench.eplan || '-'}</td>
                         <td style={styles.tableBodyCell}>{userName}</td>
                         <td style={styles.tableBodyCell}>{projectName}</td>
                       </tr>
                     );
                   })
                 )}
               </tbody>
             </table>
           )}
        </div>

       {/* Modals: Pass camelCase data and fields */}
       {selectedTestBench && (
         <EditableDetailsModal
           isOpen={selectedTestBench !== null}
           onClose={() => setSelectedTestBench(null)}
           title={`Test Bench Details: ${selectedTestBench.hilName}`}
           data={selectedTestBench}
           fields={detailsFields}
           onSave={handleUpdateTestBench}
         />
       )}

       {isAddModalOpen && (
         <AddEntryModal
           isOpen={isAddModalOpen}
           onClose={() => setIsAddModalOpen(false)}
           title="Add New Test Bench"
           fields={addEntryFields}
           onSave={handleSaveEntry}
         />
       )}
     </div>
  );
} 