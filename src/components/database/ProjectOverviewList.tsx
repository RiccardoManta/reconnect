'use client';

import React, { useState, useEffect, CSSProperties } from 'react';
import { Gauge, RefreshCw, Plus } from 'lucide-react';
import EditableDetailsModal from '../EditableDetailsModal';
import AddEntryModal from '../AddEntryModal';
import { ProjectOverview, TestBench, Platform, Wetbench } from '../../types/database';

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
      color: 'white' 
  },
  tableContainer: { backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', overflowX: 'auto' },
  loadingContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem', color: '#6b7280' },
  loadingIcon: { animation: 'spin 1s linear infinite', marginBottom: '0.5rem' },
  errorContainer: { textAlign: 'center', padding: '1rem', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: '0.5rem', fontSize: '0.875rem' },
  table: { width: '100%', borderCollapse: 'collapse', tableLayout: 'auto' },
  tableHeaderRow: { borderBottom: '1px solid #e5e7eb', backgroundColor: '#f9fafb' },
  tableHeaderCell: { padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: 600, color: '#4b5563', whiteSpace: 'nowrap' },
  tableBodyRow: { borderBottom: '1px solid #e5e7eb', transition: 'background-color 0.2s', cursor: 'pointer' },
  tableBodyCell: { padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827', whiteSpace: 'nowrap' },
  noDataCell: { padding: '2rem', textAlign: 'center', color: '#6b7280' },
};
const keyframesStyle = ` @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } } `;

export default function ProjectOverviewList() {
  const [projectOverviews, setProjectOverviews] = useState<ProjectOverview[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedOverview, setSelectedOverview] = useState<ProjectOverview | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [testBenches, setTestBenches] = useState<TestBench[]>([]);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [wetbenches, setWetbenches] = useState<Wetbench[]>([]);

  const fetchRelatedData = async () => {
     try {
       const benchResponse = await fetch('/api/testbenches');
       if (benchResponse.ok) {
         const benchData = await benchResponse.json();
         setTestBenches(benchData.test_benches || []);
       } else { console.error('Failed to fetch test benches'); setTestBenches([]); }
       
       const platformResponse = await fetch('/api/platforms');
       if (platformResponse.ok) {
         const platformData = await platformResponse.json();
         setPlatforms(platformData.platforms || []);
       } else { console.error('Failed to fetch platforms'); setPlatforms([]); }

       const wetbenchResponse = await fetch('/api/wetbenches');
       if (wetbenchResponse.ok) {
         const wetbenchData = await wetbenchResponse.json();
         setWetbenches(wetbenchData.wetbenches || []);
       } else { console.error('Failed to fetch wetbenches'); setWetbenches([]); }

     } catch (err) {
       console.error('Error fetching related data for dropdowns:', err);
       setTestBenches([]); setPlatforms([]); setWetbenches([]);
     }
  };

  const fetchData = async () => {
     setLoading(true); setError(null);
     try {
       const response = await fetch('/api/projectoverview');
       if (!response.ok) throw new Error('Failed to fetch project overviews');
       const data = await response.json();
       setProjectOverviews(data.project_overviews || []);
     } catch (err) {
       setError('Error loading project overviews: ' + (err instanceof Error ? err.message : String(err)));
       console.error('Error fetching project overviews:', err);
     } finally { setLoading(false); }
  };

  useEffect(() => {
    const loadInitialData = async () => {
      await fetchRelatedData();
      await fetchData();
    };
    loadInitialData();
  }, []);

  const handleAddClick = () => setIsAddModalOpen(true);
  const handleRowClick = (overview: ProjectOverview) => {
     setSelectedOverview(overview);
  }

  const handleSaveEntry = async (formData: Record<string, any>) => {
    try {
      // platformName is derived by the backend. platform_id (if present) will be sent.
      const response = await fetch('/api/projectoverview', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData),
      });
      if (!response.ok) {
        const errorData = await response.json(); throw new Error(errorData.error || 'Failed to add project overview');
      }
      const savedData = await response.json();
      const newOverview = savedData.project_overview as ProjectOverview;
      setProjectOverviews(prev => [...prev, newOverview].sort((a,b) => a.overview_id - b.overview_id));
      setIsAddModalOpen(false);
    } catch (err) {
      console.error("Failed to save project overview:", err); throw err;
    }
  };

  const handleUpdateOverview = async (formData: Record<string, any>) => {
    try {
      if (!formData.overview_id) throw new Error('Overview ID (overview_id) is required');
      
      // platformName is derived by the backend. platform_id (if present) will be sent.
      const response = await fetch('/api/projectoverview', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData),
      });
      if (!response.ok) {
        const errorData = await response.json(); throw new Error(errorData.error || 'Failed to update project overview');
      }
      const data = await response.json();
      const updatedOverview = data.project_overview as ProjectOverview;
      setProjectOverviews(prev => prev.map(ov => ov.overview_id === updatedOverview.overview_id ? updatedOverview : ov).sort((a,b) => a.overview_id - b.overview_id));
      setSelectedOverview(updatedOverview); // Show updated details in modal
    } catch (err) {
      console.error("Failed to update project overview:", err); throw err;
    }
  };

  const platformOptions: SelectOption[] = platforms.map(p => ({ value: String(p.platform_id), label: p.platform_name }));
  const benchOptions: SelectOption[] = testBenches.map(tb => ({ value: String(tb.bench_id), label: tb.hil_name }));
  const wetbenchOptions: SelectOption[] = wetbenches.map(wb => ({ value: String(wb.wetbench_id), label: wb.wetbench_name}));

  const addEntryFields: ModalField[] = [
    { name: 'bench_id', label: 'Test Bench', type: 'select', required: true, options: benchOptions },
    { name: 'platform_id', label: 'Platform', type: 'select', options: [{ value: '', label: 'None' }, ...platformOptions], required: false },
    { name: 'wetbench_id', label: 'Wetbench', type: 'select', options: [{value: '', label: 'None'}, ...wetbenchOptions], required: false },
    { name: 'system_supplier', label: 'System Supplier', type: 'text' },
    { name: 'wetbench_info', label: 'Wetbench Info (text)', type: 'text' },
    { name: 'actuator_info', label: 'Actuator Info (text)', type: 'text' },
    { name: 'hardware', label: 'Hardware (text)', type: 'text' },
    { name: 'software', label: 'Software (text)', type: 'text' },
    { name: 'model_version', label: 'Model Version', type: 'text' },
    { name: 'ticket_notes', label: 'Ticket Notes (text)', type: 'text' },
  ];

  const detailsFields: ModalField[] = [
    { name: 'overview_id', label: 'Overview ID', type: 'number', editable: false },
    { name: 'bench_id', label: 'Test Bench', type: 'select', required: true, editable: true, options: benchOptions },
    { name: 'platform_id', label: 'Platform', type: 'select', editable: true, options: [{ value: '', label: 'None' }, ...platformOptions], required: false },
    { name: 'wetbench_id', label: 'Wetbench', type: 'select', editable: true, options: [{value: '', label: 'None'}, ...wetbenchOptions], required: false },
    { name: 'system_supplier', label: 'System Supplier', type: 'text', editable: true },
    { name: 'wetbench_info', label: 'Wetbench Info (text)', type: 'text', editable: true },
    { name: 'actuator_info', label: 'Actuator Info (text)', type: 'text', editable: true },
    { name: 'hardware', label: 'Hardware (text)', type: 'text', editable: true },
    { name: 'software', label: 'Software (text)', type: 'text', editable: true },
    { name: 'model_version', label: 'Model Version', type: 'text', editable: true },
    { name: 'ticket_notes', label: 'Ticket Notes (text)', type: 'text', editable: true },
    { name: 'hil_name', label: 'HIL Name', type: 'text', editable: false },
    { name: 'platform_name', label: 'Platform Name', type: 'text', editable: false },
    { name: 'wetbench_name', label: 'Wetbench Name', type: 'text', editable: false },
  ];
  
  const getBenchName = (id: number | undefined | null): string => testBenches.find(tb => tb.bench_id === id)?.hil_name || 'N/A';
  const getPlatformNameForDisplay = (id: number | undefined | null): string => platforms.find(p => p.platform_id === id)?.platform_name || 'N/A';
  const getWetbenchNameForDisplay = (id: number | undefined | null): string => wetbenches.find(wb => wb.wetbench_id === id)?.wetbench_name || 'N/A';

  return (
    <div>
      <style>{keyframesStyle}</style>
      <div style={styles.headerContainer}>
        <div style={styles.headerTitleContainer}>
          <Gauge size={28} style={styles.headerIcon} />
          <h1 style={styles.headerTitle}>Project Overviews {projectOverviews.length > 0 ? `(${projectOverviews.length})` : ''}</h1>
        </div>
        <button onClick={handleAddClick} style={styles.addButton} title="Add new project overview">
          <Plus size={18} style={{marginRight: '0.5rem'}} /> Add Overview
        </button>
      </div>

      <div style={styles.tableContainer}>
        {loading ? (
          <div style={styles.loadingContainer}><RefreshCw size={24} style={styles.loadingIcon} /><p>Loading overviews...</p></div>
        ) : error ? (
          <div style={styles.errorContainer}><p>{error}</p></div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr style={styles.tableHeaderRow}>
                <th style={styles.tableHeaderCell}>HIL Name (Bench)</th>
                <th style={styles.tableHeaderCell}>Platform</th>
                <th style={styles.tableHeaderCell}>System Supplier</th>
                <th style={styles.tableHeaderCell}>Hardware</th>
                <th style={styles.tableHeaderCell}>Software</th>
                <th style={styles.tableHeaderCell}>Model Ver.</th>
                <th style={styles.tableHeaderCell}>Wetbench Name</th>
                <th style={styles.tableHeaderCell}>Ticket Notes</th>
              </tr>
            </thead>
            <tbody>
              {projectOverviews.length === 0 ? (
                <tr><td colSpan={8} style={styles.noDataCell}>No project overviews found.</td></tr>
              ) : (
                projectOverviews.map((overview) => (
                  <tr key={overview.overview_id} style={styles.tableBodyRow} onClick={() => handleRowClick(overview)} 
                      onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#f9fafb'; }} 
                      onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
                    <td style={styles.tableBodyCell}>{overview.hil_name || getBenchName(overview.bench_id)}</td>
                    <td style={styles.tableBodyCell}>{overview.platform_name || getPlatformNameForDisplay(overview.platform_id)}</td>
                    <td style={styles.tableBodyCell}>{overview.system_supplier || '-'}</td>
                    <td style={styles.tableBodyCell}>{overview.hardware || '-'}</td>
                    <td style={styles.tableBodyCell}>{overview.software || '-'}</td>
                    <td style={styles.tableBodyCell}>{overview.model_version || '-'}</td>
                    <td style={styles.tableBodyCell}>{overview.wetbench_name || '-'}</td>
                    <td style={styles.tableBodyCell}>{overview.ticket_notes || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {selectedOverview && (
        <EditableDetailsModal
          isOpen={selectedOverview !== null}
          onClose={() => setSelectedOverview(null)}
          title={`Project Overview Details: ${selectedOverview.hilName || selectedOverview.overviewId}`}
          data={selectedOverview}
          fields={detailsFields}
          onSave={handleUpdateOverview}
        />
      )}

      {isAddModalOpen && (
        <AddEntryModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Add New Project Overview"
          fields={addEntryFields}
          onSave={handleSaveEntry}
        />
      )}
    </div>
  );
}
