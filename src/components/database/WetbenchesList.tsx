'use client';

import React, { useState } from 'react';
import { Beaker, RefreshCw, Plus } from 'lucide-react';
import EditableDetailsModal from '../EditableDetailsModal';
import AddEntryModal from '../AddEntryModal';
import { Wetbench, TestBench } from '../../types/database'; // Import related types
import { keysToCamel, keysToSnake } from '../../utils/caseConverter';

// --- Reusable Modal Field Type Definitions --- (Copied again, consider shared file)
// ... (ModalField types definition - kept same as previous components) ...
type FieldType = 'text' | 'number' | 'date' | 'select';
interface SelectOption { value: string; label: string; }
interface BaseField { name: string; label: string; required?: boolean; editable?: boolean; }
interface TextField extends BaseField { type: 'text'; }
interface NumberField extends BaseField { type: 'number'; }
interface DateField extends BaseField { type: 'date'; }
interface SelectField extends BaseField { type: 'select'; options: SelectOption[]; }
type ModalField = TextField | NumberField | DateField | SelectField;
// --- End Reusable Modal Field Type Definitions ---

export default function WetbenchesList() {
  const [wetbenches, setWetbenches] = useState<Wetbench[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedWetbench, setSelectedWetbench] = useState<Wetbench | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [testBenches, setTestBenches] = useState<TestBench[]>([]); // State for related TestBenches

  // Fetch related TestBench data for dropdowns
  const fetchRelatedData = async () => {
    try {
      const response = await fetch('/api/testbenches');
      if (response.ok) {
        const data = await response.json();
        setTestBenches(keysToCamel<TestBench[]>(data.testBenches || []));
      } else {
          console.error('Failed to fetch test benches for dropdown');
          setTestBenches([]); // Set to empty array on failure
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
      const response = await fetch('/api/wetbenches'); // Assuming endpoint
      if (!response.ok) {
        throw new Error('Failed to fetch wetbenches');
      }
      const data = await response.json();
      setWetbenches(keysToCamel<Wetbench[]>(data.wetbenches || [])); // Assuming key
      setHasLoaded(true);
    } catch (err) {
      setError('Error loading wetbenches: ' + (err instanceof Error ? err.message : String(err)));
      console.error('Error fetching wetbenches:', err);
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
    fetchRelatedData(); // Fetch test benches before opening add modal
    setIsAddModalOpen(true);
  };

  const handleRowClick = (wetbench: Wetbench) => {
      fetchRelatedData(); // Fetch test benches before opening edit modal
      setSelectedWetbench(wetbench);
  }

  const handleSaveEntry = async (formData: Record<string, any>) => {
    try {
      const snakeCaseData = keysToSnake(formData);
      const response = await fetch('/api/wetbenches', { // Assuming endpoint
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(snakeCaseData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add wetbench');
      }

      const savedData = await response.json();
      const newWetbench = keysToCamel<Wetbench>(savedData.wetbench); // Assuming key
      setWetbenches(prev => [...prev, newWetbench]);
      setIsAddModalOpen(false);

    } catch (err) {
      console.error("Failed to save wetbench:", err);
      throw err;
    }
  };

  const handleUpdateWetbench = async (formData: Record<string, any>) => {
    try {
      if (!formData.wetbenchId) { // Check camelCase ID
        throw new Error('Wetbench ID is required');
      }

      const snakeCaseData = keysToSnake(formData);
      const response = await fetch('/api/wetbenches', { // Assuming endpoint
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(snakeCaseData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update wetbench');
      }

      const data = await response.json();
      const updatedWetbench = keysToCamel<Wetbench>(data.wetbench); // Assuming key

      setWetbenches(prev =>
        prev.map(wb =>
          wb.wetbenchId === updatedWetbench.wetbenchId ? updatedWetbench : wb
        )
      );
      setSelectedWetbench(updatedWetbench);
      // setSelectedWetbench(null); // Optionally close

    } catch (err) {
      console.error("Failed to update wetbench:", err);
      throw err;
    }
  };

  // Define fields using camelCase names
  const addEntryFields: ModalField[] = [
    { name: 'wetbenchName', label: 'Wetbench Name', type: 'text', required: true },
    { name: 'ppNumber', label: 'PP Number', type: 'text' },
    { name: 'owner', label: 'Owner', type: 'text' },
    { name: 'systemType', label: 'System Type', type: 'text' },
    { name: 'platform', label: 'Platform', type: 'text' },
    { name: 'systemSupplier', label: 'System Supplier', type: 'text' },
    {
      name: 'linkedBenchId', 
      label: 'Linked Test Bench', 
      type: 'select',
      options: testBenches.map(tb => ({ value: String(tb.benchId), label: tb.hilName }))
    },
    { name: 'actuatorInfo', label: 'Actuator Info', type: 'text' },
    { name: 'hardwareComponents', label: 'Hardware Components', type: 'text' },
    { name: 'inventoryNumber', label: 'Inventory Number', type: 'text' },
  ];

  const detailsFields: ModalField[] = [
    { name: 'wetbenchId', label: 'Wetbench ID', type: 'number', editable: false },
    { name: 'wetbenchName', label: 'Wetbench Name', type: 'text', required: true },
    { name: 'ppNumber', label: 'PP Number', type: 'text' },
    { name: 'owner', label: 'Owner', type: 'text' },
    { name: 'systemType', label: 'System Type', type: 'text' },
    { name: 'platform', label: 'Platform', type: 'text' },
    { name: 'systemSupplier', label: 'System Supplier', type: 'text' },
    {
      name: 'linkedBenchId',
      label: 'Linked Test Bench',
      type: 'select',
      options: testBenches.map(tb => ({ value: String(tb.benchId), label: tb.hilName }))
    },
    { name: 'actuatorInfo', label: 'Actuator Info', type: 'text' },
    { name: 'hardwareComponents', label: 'Hardware Components', type: 'text' },
    { name: 'inventoryNumber', label: 'Inventory Number', type: 'text' },
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
          <Beaker size={18} />
          Wetbenches {hasLoaded ? `(${wetbenches.length})` : ''}
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {loading && <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite', color: '#6b7280' }} />}
          <button
            onClick={handleAddClick}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
                     width: '24px', height: '24px', borderRadius: '50%', background: '#2563eb',
                     color: 'white', border: 'none', cursor: 'pointer', padding: 0 }}
            title="Add new wetbench"
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
              <p style={{ margin: 0 }}>Loading wetbenches...</p>
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
                  {/* Adjust table headers based on desired display columns */}
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563' }}>ID</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563' }}>Name</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563' }}>PP Number</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563' }}>Owner</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563' }}>System Type</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563' }}>Platform</th>
                </tr>
              </thead>
              <tbody>
                {wetbenches.length === 0 ? (
                  <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>No wetbenches found</td></tr>
                ) : (
                  wetbenches.map((wb) => (
                    <tr key={wb.wetbenchId} style={{ borderBottom: '1px solid #e5e7eb', transition: 'background-color 0.2s', cursor: 'pointer' }}
                        onClick={() => handleRowClick(wb)} // Use specific handler to fetch related data before opening modal
                        onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#f9fafb'; }}
                        onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
                      {/* Display relevant columns */}
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827' }}>{wb.wetbenchId}</td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827' }}>{wb.wetbenchName}</td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827' }}>{wb.ppNumber}</td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827' }}>{wb.owner}</td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827' }}>{wb.systemType}</td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827' }}>{wb.platform}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      )}

      {selectedWetbench && (
        <EditableDetailsModal
          isOpen={selectedWetbench !== null}
          onClose={() => setSelectedWetbench(null)}
          title={`Wetbench Details: ${selectedWetbench.wetbenchName}`}
          data={selectedWetbench}
          fields={detailsFields} // Ensure options are populated from fetchRelatedData
          onSave={handleUpdateWetbench}
        />
      )}

      {isAddModalOpen && (
        <AddEntryModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Add New Wetbench"
          fields={addEntryFields} // Ensure options are populated from fetchRelatedData
          onSave={handleSaveEntry}
        />
      )}
    </div>
  );
} 