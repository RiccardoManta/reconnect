'use client';

import React, { useState } from 'react';
import { PcCase, RefreshCw, Plus } from 'lucide-react';
import EditableDetailsModal from '../EditableDetailsModal';
import AddEntryModal from '../AddEntryModal';
import { PcOverview, TestBench } from '../../types/database';
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

export default function PcOverviewList() {
  const [pcOverviews, setPcOverviews] = useState<PcOverview[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPc, setSelectedPc] = useState<PcOverview | null>(null);
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
      const response = await fetch('/api/pcs');
      if (!response.ok) {
        throw new Error('Failed to fetch PC overviews');
      }
      const data = await response.json();
      setPcOverviews(keysToCamel<PcOverview[]>(data.pcs || []));
      setHasLoaded(true);
    } catch (err) {
      setError('Error loading PC overviews: ' + (err instanceof Error ? err.message : String(err)));
      console.error('Error fetching PC overviews:', err);
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

  const handleRowClick = (pc: PcOverview) => {
    fetchRelatedData();
    setSelectedPc(pc);
  }

  const handleSaveEntry = async (formData: Record<string, any>) => {
    try {
      const snakeCaseData = keysToSnake(formData);
      const response = await fetch('/api/pcs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(snakeCaseData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add PC overview');
      }

      const savedData = await response.json();
      const newPc = keysToCamel<PcOverview>(savedData.pcOverview);
      setPcOverviews(prev => [...prev, newPc]);
      setIsAddModalOpen(false);

    } catch (err) {
      console.error("Failed to save PC overview:", err);
      throw err;
    }
  };

  const handleUpdatePc = async (formData: Record<string, any>) => {
    try {
      if (!formData.pcId) {
        throw new Error('PC ID is required');
      }

      const snakeCaseData = keysToSnake(formData);
      const response = await fetch('/api/pcs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(snakeCaseData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update PC overview');
      }

      const data = await response.json();
      const updatedPc = keysToCamel<PcOverview>(data.pcOverview);

      setPcOverviews(prev =>
        prev.map(pc =>
          pc.pcId === updatedPc.pcId ? updatedPc : pc
        )
      );
      setSelectedPc(updatedPc);

    } catch (err) {
      console.error("Failed to update PC overview:", err);
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
    { name: 'pcName', label: 'PC Name', type: 'text', required: true },
    { name: 'purchaseYear', label: 'Purchase Year', type: 'number' },
    { name: 'inventoryNumber', label: 'Inventory Number', type: 'text' },
    { name: 'pcRole', label: 'PC Role', type: 'text' },
    { name: 'pcModel', label: 'PC Model', type: 'text' },
    { name: 'specialEquipment', label: 'Special Equipment', type: 'text' },
    { name: 'macAddress', label: 'MAC Address', type: 'text' },
    { name: 'ipAddress', label: 'IP Address', type: 'text' },
    { name: 'activeLicenses', label: 'Active Licenses', type: 'text' },
    { name: 'installedTools', label: 'Installed Tools', type: 'text' },
    { name: 'pcInfoText', label: 'PC Info Text', type: 'text' },
    { name: 'status', label: 'Status', type: 'text' },
    { name: 'activeUser', label: 'Active User', type: 'text' },
  ];

  const detailsFields: ModalField[] = [
    { name: 'pcId', label: 'PC ID', type: 'number', editable: false },
    {
      name: 'benchId',
      label: 'Test Bench',
      type: 'select',
      required: true,
      options: testBenches.map(tb => ({ value: String(tb.benchId), label: tb.hilName }))
    },
    { name: 'hilName', label: 'HIL Name', type: 'text', editable: false },
    { name: 'pcName', label: 'PC Name', type: 'text', required: true },
    { name: 'purchaseYear', label: 'Purchase Year', type: 'number' },
    { name: 'inventoryNumber', label: 'Inventory Number', type: 'text' },
    { name: 'pcRole', label: 'PC Role', type: 'text' },
    { name: 'pcModel', label: 'PC Model', type: 'text' },
    { name: 'specialEquipment', label: 'Special Equipment', type: 'text' },
    { name: 'macAddress', label: 'MAC Address', type: 'text' },
    { name: 'ipAddress', label: 'IP Address', type: 'text' },
    { name: 'activeLicenses', label: 'Active Licenses', type: 'text' },
    { name: 'installedTools', label: 'Installed Tools', type: 'text' },
    { name: 'pcInfoText', label: 'PC Info Text', type: 'text' },
    { name: 'status', label: 'Status', type: 'text' },
    { name: 'activeUser', label: 'Active User', type: 'text' },
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
          <PcCase size={18} />
          PC Overview {hasLoaded ? `(${pcOverviews.length})` : ''}
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {loading && <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite', color: '#6b7280' }} />}
          <button
            onClick={handleAddClick}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
                     width: '24px', height: '24px', borderRadius: '50%', background: '#2563eb',
                     color: 'white', border: 'none', cursor: 'pointer', padding: 0 }}
            title="Add new PC overview"
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
              <p style={{ margin: 0 }}>Loading PC overviews...</p>
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
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563' }}>PC Name</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563' }}>Role</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563' }}>Status</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563' }}>Active User</th>
                </tr>
              </thead>
              <tbody>
                {pcOverviews.length === 0 ? (
                  <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>No PC overviews found</td></tr>
                ) : (
                  pcOverviews.map((pc) => (
                    <tr key={pc.pcId} style={{ borderBottom: '1px solid #e5e7eb', transition: 'background-color 0.2s', cursor: 'pointer' }}
                        onClick={() => handleRowClick(pc)}
                        onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#f9fafb'; }}
                        onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
                      {/* Adjust columns */}
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827' }}>{pc.pcId}</td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827' }}>{pc.hilName}</td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827' }}>{pc.pcName}</td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827' }}>{pc.pcRole}</td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827' }}>{pc.status}</td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827' }}>{pc.activeUser}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      )}

      {selectedPc && (
        <EditableDetailsModal
          isOpen={selectedPc !== null}
          onClose={() => setSelectedPc(null)}
          title={`PC Overview Details: ${selectedPc.pcName}`}
          data={selectedPc}
          fields={detailsFields} // Ensure options populated
          onSave={handleUpdatePc}
        />
      )}

      {isAddModalOpen && (
        <AddEntryModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Add New PC Overview"
          fields={addEntryFields} // Ensure options populated
          onSave={handleSaveEntry}
        />
      )}
    </div>
  );
} 