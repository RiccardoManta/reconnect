'use client';

import React, { useState } from 'react';
import { Gauge, RefreshCw, Plus } from 'lucide-react';
import EditableDetailsModal from '../EditableDetailsModal';
import AddEntryModal from '../AddEntryModal';
import { ProjectOverview, TestBench } from '../../types/database';
import { keysToCamel, keysToSnake } from '../../utils/caseConverter';

// --- Reusable Modal Field Type Definitions ---
// ... (ModalField types definition) ...
type FieldType = 'text' | 'number' | 'date' | 'select';
interface SelectOption { value: string; label: string; }
interface BaseField { name: string; label: string; required?: boolean; editable?: boolean; }
interface TextField extends BaseField { type: 'text'; }
interface NumberField extends BaseField { type: 'number'; }
interface DateField extends BaseField { type: 'date'; }
interface SelectField extends BaseField { type: 'select'; options: SelectOption[]; }
type ModalField = TextField | NumberField | DateField | SelectField;
// --- End Reusable Modal Field Type Definitions ---

export default function ProjectOverviewList() {
  const [projectOverviews, setProjectOverviews] = useState<ProjectOverview[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedOverview, setSelectedOverview] = useState<ProjectOverview | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [testBenches, setTestBenches] = useState<TestBench[]>([]); // For dropdown

  const fetchRelatedData = async () => {
    try {
      const response = await fetch('/api/testbenches');
      if (response.ok) {
        const data = await response.json();
        setTestBenches(keysToCamel<TestBench[]>(data.testBenches || []));
      } else {
        console.error('Failed to fetch test benches for dropdown');
        setTestBenches([]);
      }
    } catch (err) {
      console.error('Error fetching test benches for dropdown:', err);
      setTestBenches([]);
    }
  };

  const fetchData = async () => {
    if (hasLoaded) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/projectoverview');
      if (!response.ok) {
        throw new Error('Failed to fetch project overviews');
      }
      const data = await response.json();
      setProjectOverviews(keysToCamel<ProjectOverview[]>(data.projectOverviews || []));
      setHasLoaded(true);
    } catch (err) {
      setError('Error loading project overviews: ' + (err instanceof Error ? err.message : String(err)));
      console.error('Error fetching project overviews:', err);
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
    fetchRelatedData();
    setIsAddModalOpen(true);
  };

  const handleRowClick = (overview: ProjectOverview) => {
    fetchRelatedData();
    setSelectedOverview(overview);
  }

  const handleSaveEntry = async (formData: Record<string, any>) => {
    try {
      const snakeCaseData = keysToSnake(formData);
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

      const snakeCaseData = keysToSnake(formData);
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
      setSelectedOverview(updatedOverview);

    } catch (err) {
      console.error("Failed to update project overview:", err);
      throw err;
    }
  };

  // Define fields using camelCase names
  const addEntryFields: ModalField[] = [
    {
      name: 'benchId',
      label: 'Test Bench',
      type: 'select',
      required: true,
      options: testBenches.map(tb => ({ value: String(tb.benchId), label: tb.hilName }))
    },
    // hilName might be auto-populated
    { name: 'platform', label: 'Platform', type: 'text' },
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
    {
      name: 'benchId',
      label: 'Test Bench',
      type: 'select',
      required: true,
      editable: true,
      options: testBenches.map(tb => ({ value: String(tb.benchId), label: tb.hilName }))
    },
    { name: 'platform', label: 'Platform', type: 'text', editable: true },
    { name: 'systemSupplier', label: 'System Supplier', type: 'text', editable: true },
    { name: 'wetbenchInfo', label: 'Wetbench Info', type: 'text', editable: true },
    { name: 'actuatorInfo', label: 'Actuator Info', type: 'text', editable: true },
    { name: 'hardware', label: 'Hardware', type: 'text', editable: true },
    { name: 'software', label: 'Software', type: 'text', editable: true },
    { name: 'modelVersion', label: 'Model Version', type: 'text', editable: true },
    { name: 'ticketNotes', label: 'Ticket Notes', type: 'text', editable: true },
  ];

  return (
    <div style={{ marginTop: '2rem' }}>
      <div 
        style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '0.75rem 1rem', backgroundColor: 'white', borderRadius: '0.5rem',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', cursor: 'pointer',
          marginBottom: isExpanded ? '0.5rem' : '0', transition: 'background-color 0.2s'
        }}
        onClick={toggleExpand}
        onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#f9fafb'; }}
        onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'white'; }}
      >
        <h2 style={{
          fontSize: '1.25rem', fontWeight: '600', color: '#111827',
          display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0
        }}>
          <Gauge size={18} />
          Project Overview {hasLoaded ? `(${projectOverviews.length})` : ''}
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {loading && <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite', color: '#6b7280' }} />}
          <button
            onClick={handleAddClick}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
                     width: '24px', height: '24px', borderRadius: '50%', background: '#2563eb',
                     color: 'white', border: 'none', cursor: 'pointer', padding: 0 }}
            title="Add new project overview"
          >
            <Plus size={16} />
          </button>
          <div style={{ transform: `rotate(${isExpanded ? 180 : 0}deg)`, transition: 'transform 0.2s' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
          </div>
        </div>
      </div>
      
      {isExpanded && (
        <div style={{
          backgroundColor: 'white', borderRadius: '0 0 0.5rem 0.5rem', padding: '1rem',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', overflowX: 'auto', transition: 'max-height 0.3s ease-in-out'
        }}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem', color: '#6b7280' }}>
              <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', marginBottom: '0.5rem' }} />
              <p style={{ margin: 0 }}>Loading project overviews...</p>
              <style jsx>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
            </div>
          ) : error ? (
            <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: '0.5rem', fontSize: '0.875rem' }}>
              <p>{error}</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
                  {/* Adjust headers */}
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563' }}>ID</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563' }}>HIL Name</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563' }}>Platform</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563' }}>Hardware</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563' }}>Software</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563' }}>Model Version</th>
                </tr>
              </thead>
              <tbody>
                {projectOverviews.length === 0 ? (
                  <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>No project overviews found</td></tr>
                ) : (
                  projectOverviews.map((ov) => {
                    // Find the associated test bench name
                    const hilName = testBenches.find(tb => tb.benchId === ov.benchId)?.hilName || 'N/A';

                    return (
                      <tr key={ov.overviewId} style={{ borderBottom: '1px solid #e5e7eb', transition: 'background-color 0.2s', cursor: 'pointer' }}
                          onClick={() => handleRowClick(ov)}
                          onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#f9fafb'; }}
                          onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
                        {/* Adjust columns */}
                        <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827' }}>{ov.overviewId}</td>
                        <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827' }}>{hilName}</td>
                        <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827' }}>{ov.platform || '-'}</td>
                        <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827' }}>{ov.hardware || '-'}</td>
                        <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827' }}>{ov.software || '-'}</td>
                        <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827' }}>{ov.modelVersion || '-'}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
      )}

      {selectedOverview && (
        <EditableDetailsModal
          isOpen={selectedOverview !== null}
          onClose={() => setSelectedOverview(null)}
          title={`Project Overview for Bench: ${testBenches.find(tb => tb.benchId === selectedOverview.benchId)?.hilName || selectedOverview.benchId}`}
          data={selectedOverview}
          fields={detailsFields} // Ensure options populated
          onSave={handleUpdateOverview}
        />
      )}

      {isAddModalOpen && (
        <AddEntryModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Add New Project Overview"
          fields={addEntryFields} // Ensure options populated
          onSave={handleSaveEntry}
        />
      )}
    </div>
  );
} 