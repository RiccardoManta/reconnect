'use client';

import React, { useState, useEffect, CSSProperties } from 'react';
import { Gauge, RefreshCw, Plus } from 'lucide-react';
import EditableDetailsModal from '../EditableDetailsModal';
import AddEntryModal from '../AddEntryModal';
import { ProjectOverview, TestBench, Platform } from '../../types/database';
import { keysToCamel, keysToSnake } from '../../utils/caseConverter';

// Reusable Modal Field Type Definitions
interface SelectOption { value: string; label: string; }
interface BaseField { name: string; label: string; required?: boolean; editable?: boolean; }
interface TextField extends BaseField { type: 'text'; }
interface NumberField extends BaseField { type: 'number'; }
interface DateField extends BaseField { type: 'date'; }
interface SelectField extends BaseField { type: 'select'; options: SelectOption[]; }
type ModalField = TextField | NumberField | DateField | SelectField;

// --- Styles ---
const styles: { [key: string]: CSSProperties } = {
  headerContainer: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' },
  headerTitleContainer: { display: 'flex', alignItems: 'center' },
  headerIcon: { color: '#0F3460', marginRight: '1rem' },
  headerTitle: { fontSize: '1.75rem', fontWeight: 'bold', color: '#0F3460', margin: 0 },
  addButton: { border: 'none', borderRadius: '0.375rem', padding: '0.5rem 0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', fontSize: '0.875rem', fontWeight: 500, boxShadow: '0 1px 2px rgba(0,0,0,0.05)', backgroundColor: '#0F3460', color: 'white' },
  tableContainer: { backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', overflowX: 'auto' },
  loadingContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem', color: '#6b7280' },
  loadingIcon: { animation: 'spin 1s linear infinite', marginBottom: '0.5rem' },
  errorContainer: { textAlign: 'center', padding: '1rem', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: '0.5rem', fontSize: '0.875rem' },
  table: { width: '100%', borderCollapse: 'collapse' },
  tableHeaderRow: { borderBottom: '1px solid #e5e7eb', backgroundColor: '#f9fafb' },
  tableHeaderCell: { padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: 600, color: '#4b5563' },
  tableBodyRow: { borderBottom: '1px solid #e5e7eb', transition: 'background-color 0.2s', cursor: 'pointer' },
  tableBodyCell: { padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827' },
  noDataCell: { padding: '2rem', textAlign: 'center', color: '#6b7280' },
};

export default function ProjectOverviewList() {
  const [projectOverviews, setProjectOverviews] = useState<ProjectOverview[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedOverview, setSelectedOverview] = useState<ProjectOverview | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [testBenches, setTestBenches] = useState<TestBench[]>([]);
  const [platforms, setPlatforms] = useState<Platform[]>([]);

  const fetchRelatedData = async () => {
     try {
       const benchResponse = await fetch('/api/testbenches');
       if (benchResponse.ok) {
         const benchData = await benchResponse.json();
         setTestBenches(keysToCamel<TestBench[]>(benchData.testBenches || []));
       } else {
         console.error('Failed to fetch test benches for dropdown');
         setTestBenches([]);
       }
       const platformResponse = await fetch('/api/platforms');
       if (platformResponse.ok) {
         const platformData = await platformResponse.json();
         setPlatforms(keysToCamel<Platform[]>(platformData.platforms || []));
       } else {
         console.error('Failed to fetch platforms for dropdown');
         setPlatforms([]);
       }
     } catch (err) {
       console.error('Error fetching related data for dropdowns:', err);
       setTestBenches([]);
       setPlatforms([]);
     }
  };

  const fetchData = async () => {
     setLoading(true);
     setError(null);
     try {
       const response = await fetch('/api/projectoverview');
       if (!response.ok) {
         throw new Error('Failed to fetch project overviews');
       }
       const data = await response.json();
       setProjectOverviews(keysToCamel<ProjectOverview[]>(data.projectOverviews || []));
     } catch (err) {
       setError('Error loading project overviews: ' + (err instanceof Error ? err.message : String(err)));
       console.error('Error fetching project overviews:', err);
     } finally {
       setLoading(false);
     }
  };

  // Fetch data on mount
  useEffect(() => {
    const loadInitialData = async () => {
      await fetchData(); // Fetch main overview list
      await fetchRelatedData(); // Fetch related benches and platforms
    };
    loadInitialData();
  }, []);

  const handleAddClick = () => {
     setIsAddModalOpen(true);
  };

  const handleRowClick = (overview: ProjectOverview) => {
     const platform = platforms.find(p => p.platformName === overview.platformName);
     const platformIdAsNumber = platform ? Number(platform.platformId) : NaN;
     const overviewWithPlatformId = { 
       ...overview, 
       platformId: isNaN(platformIdAsNumber) ? null : platformIdAsNumber 
     };
     setSelectedOverview(overviewWithPlatformId);
  }

  const getPlatformNameFromId = (platformId: string | number | undefined): string | undefined => {
      if (platformId === undefined || platformId === null || platformId === '') return undefined;
      const platform = platforms.find(p => String(p.platformId) === String(platformId));
      return platform?.platformName;
  }

  const handleSaveEntry = async (formData: Record<string, any>) => {
    try {
      const platformName = getPlatformNameFromId(formData.platformId);

      const { platformId: _, ...restOfFormData } = formData;
      const apiPayload = {
        ...restOfFormData,
        platformName: platformName,
      };

      const snakeCaseData = keysToSnake(apiPayload);

      const response = await fetch('/api/projectoverview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(snakeCaseData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add project overview');
      }

      const savedData = await response.json();
      const newOverview = keysToCamel<ProjectOverview>(savedData.projectOverview);
      setProjectOverviews(prev => [...prev, newOverview]);
      setIsAddModalOpen(false);

    } catch (err) {
      console.error("Failed to save project overview:", err);
      throw err;
    }
  };

  const handleUpdateOverview = async (formData: Record<string, any>) => {
    try {
      if (!formData.overviewId) {
        throw new Error('Overview ID is required');
      }

      const platformName = getPlatformNameFromId(formData.platformId);

      const { platformId: _, ...restOfFormData } = formData;
      const apiPayload = {
        ...restOfFormData,
        platformName: platformName,
      };

      const snakeCaseData = keysToSnake(apiPayload);

      const response = await fetch('/api/projectoverview', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(snakeCaseData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update project overview');
      }

      const data = await response.json();
      const updatedOverview = keysToCamel<ProjectOverview>(data.projectOverview);

      setProjectOverviews(prev =>
        prev.map(ov =>
          ov.overviewId === updatedOverview.overviewId ? updatedOverview : ov
        )
      );

      const platformIdFromForm = formData.platformId;
      const platformIdAsNumberForState = platformIdFromForm !== null && platformIdFromForm !== '' && !isNaN(Number(platformIdFromForm)) ? Number(platformIdFromForm) : null;

      const updatedOverviewForState = {
         ...updatedOverview, 
         platformId: platformIdAsNumberForState
      };
      setSelectedOverview(updatedOverviewForState);

    } catch (err) {
      console.error("Failed to update project overview:", err);
      throw err;
    }
  };

  const platformOptions: SelectOption[] = platforms.map(p => ({
      value: String(p.platformId),
      label: p.platformName
  }));
  const benchOptions: SelectOption[] = testBenches.map(tb => ({
      value: String(tb.benchId),
      label: tb.hilName
  }));

  const addEntryFields: ModalField[] = [
    { name: 'benchId', label: 'Test Bench', type: 'select', required: true, options: benchOptions },
    { name: 'platformId', label: 'Platform', type: 'select', options: [{ value: '', label: 'None' }, ...platformOptions], required: false },
    { name: 'systemSupplier', label: 'System Supplier', type: 'text' },
    { name: 'wetbenchInfo', label: 'Wetbench Info', type: 'text' },
    { name: 'actuatorInfo', label: 'Actuator Info', type: 'text' },
    { name: 'hardware', label: 'Hardware', type: 'text' },
    { name: 'software', label: 'Software', type: 'text' },
    { name: 'modelVersion', label: 'Model Version', type: 'text' },
    { name: 'ticketNotes', label: 'Ticket Notes', type: 'text' },
  ];

  const detailsFields: ModalField[] = [
    { name: 'overviewId', label: 'Overview ID', type: 'number', editable: false },
    { name: 'benchId', label: 'Test Bench', type: 'select', required: true, editable: true, options: benchOptions },
    { name: 'platformId', label: 'Platform', type: 'select', editable: true, options: [{ value: '', label: 'None' }, ...platformOptions], required: false },
    { name: 'systemSupplier', label: 'System Supplier', type: 'text', editable: true },
    { name: 'wetbenchInfo', label: 'Wetbench Info', type: 'text', editable: true },
    { name: 'actuatorInfo', label: 'Actuator Info', type: 'text', editable: true },
    { name: 'hardware', label: 'Hardware', type: 'text', editable: true },
    { name: 'software', label: 'Software', type: 'text', editable: true },
    { name: 'modelVersion', label: 'Model Version', type: 'text', editable: true },
    { name: 'ticketNotes', label: 'Ticket Notes', type: 'text', editable: true },
  ];
  
  const getBenchName = (id: number): string => {
    if (testBenches.length === 0 && loading) return 'Loading...';
    return testBenches.find(tb => tb.benchId === id)?.hilName || 'N/A';
  };

  return (
    <div>
      {/* Page Header */}
       <div style={styles.headerContainer}>
         <div style={styles.headerTitleContainer}>
           <Gauge size={28} style={styles.headerIcon} />
           <h1 style={styles.headerTitle}>
             Project Overview {projectOverviews.length > 0 ? `(${projectOverviews.length})` : ''}
           </h1>
         </div>
         <button
           onClick={handleAddClick}
           style={styles.addButton}
           title="Add new project overview"
         >
           <Plus size={18} style={{ marginRight: '0.5rem' }} />
           Add Overview
         </button>
       </div>

       {/* Table Container */}
       <div style={styles.tableContainer}>
          {loading ? (
             <div style={styles.loadingContainer}>
               <RefreshCw size={24} style={styles.loadingIcon} />
               <p style={{ margin: 0 }}>Loading project overviews...</p>
             </div>
           ) : error ? (
             <div style={styles.errorContainer}>
               <p>{error}</p>
             </div>
           ) : (
             <table style={styles.table}>
               <thead>
                 <tr style={styles.tableHeaderRow}>
                   <th style={styles.tableHeaderCell}>ID</th>
                   <th style={styles.tableHeaderCell}>HIL Name</th>
                   <th style={styles.tableHeaderCell}>Platform</th>
                   <th style={styles.tableHeaderCell}>System Supplier</th>
                   <th style={styles.tableHeaderCell}>Wetbench</th>
                   <th style={styles.tableHeaderCell}>Model Version</th>
                 </tr>
               </thead>
               <tbody>
                 {projectOverviews.length === 0 ? (
                   <tr><td colSpan={6} style={styles.noDataCell}>No project overviews found</td></tr>
                 ) : (
                   projectOverviews.map((overview) => (
                     <tr key={overview.overviewId}
                       style={styles.tableBodyRow}
                       onClick={() => handleRowClick(overview)}
                       onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#f9fafb'; }}
                       onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                     >
                       <td style={styles.tableBodyCell}>{overview.overviewId}</td>
                       <td style={styles.tableBodyCell}>{getBenchName(overview.benchId)}</td>
                       <td style={styles.tableBodyCell}>{overview.platformName || '-'}</td>
                       <td style={styles.tableBodyCell}>{overview.systemSupplier || '-'}</td>
                       <td style={styles.tableBodyCell}>{overview.wetbenchInfo || '-'}</td>
                       <td style={styles.tableBodyCell}>{overview.modelVersion || '-'}</td>
                     </tr>
                   ))
                 )}
               </tbody>
             </table>
           )}
        </div>

       {isAddModalOpen && (
         <AddEntryModal
           isOpen={isAddModalOpen}
           onClose={() => setIsAddModalOpen(false)}
           onSave={handleSaveEntry}
           fields={addEntryFields}
           title="Add New Project Overview"
         />
       )}

       {selectedOverview && (
         <EditableDetailsModal
           isOpen={!!selectedOverview}
           onClose={() => setSelectedOverview(null)}
           onSave={handleUpdateOverview}
           fields={detailsFields}
           data={selectedOverview}
           title={`Edit Project Overview (Bench: ${getBenchName(selectedOverview.benchId)})`}
         />
       )}

      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
