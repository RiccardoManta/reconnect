'use client';

import React, { useState } from 'react';
import { Wrench as Tool, RefreshCw, Plus } from 'lucide-react'; // Use alias for icon
import EditableDetailsModal from '../EditableDetailsModal';
import AddEntryModal from '../AddEntryModal';
import { HardwareInstallation, TestBench } from '../../types/database';
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

export default function HardwareInstallationList() {
  const [hardwareInstallations, setHardwareInstallations] = useState<HardwareInstallation[]>([]); // State variable name change
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedHardware, setSelectedHardware] = useState<HardwareInstallation | null>(null);
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
      const response = await fetch('/api/hardware-installations'); // Assuming endpoint
      if (!response.ok) {
        throw new Error('Failed to fetch hardware installations');
      }
      const data = await response.json();
      setHardwareInstallations(keysToCamel<HardwareInstallation[]>(data.hardwareInstallations || [])); // Assuming key
      setHasLoaded(true);
    } catch (err) {
      setError('Error loading hardware installations: ' + (err instanceof Error ? err.message : String(err)));
      console.error('Error fetching hardware installations:', err);
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

  const handleRowClick = (hw: HardwareInstallation) => {
      fetchRelatedData();
      setSelectedHardware(hw);
  }

  const handleSaveEntry = async (formData: Record<string, any>) => {
    try {
      const snakeCaseData = keysToSnake(formData);
      const response = await fetch('/api/hardware-installations', { // Assuming endpoint
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(snakeCaseData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add hardware installation');
      }

      const savedData = await response.json();
      const newHardware = keysToCamel<HardwareInstallation>(savedData.hardwareInstallation); // Assuming key
      setHardwareInstallations(prev => [...prev, newHardware]);
      setIsAddModalOpen(false);

    } catch (err) {
      console.error("Failed to save hardware installation:", err);
      throw err;
    }
  };

  const handleUpdateHardware = async (formData: Record<string, any>) => {
    try {
      if (!formData.installId) { // Check camelCase ID
        throw new Error('Installation ID is required');
      }

      const snakeCaseData = keysToSnake(formData);
      const response = await fetch('/api/hardware-installations', { // Assuming endpoint
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(snakeCaseData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update hardware installation');
      }

      const data = await response.json();
      const updatedHardware = keysToCamel<HardwareInstallation>(data.hardwareInstallation); // Assuming key

      setHardwareInstallations(prev =>
        prev.map(hw =>
          hw.installId === updatedHardware.installId ? updatedHardware : hw
        )
      );
      setSelectedHardware(updatedHardware);
      // setSelectedHardware(null); // Optionally close

    } catch (err) {
      console.error("Failed to update hardware installation:", err);
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
    // hilName might be auto-populated or read-only
    { name: 'ecuInfo', label: 'ECU Info', type: 'text' },
    { name: 'sensors', label: 'Sensors', type: 'text' },
    { name: 'additionalPeriphery', label: 'Additional Periphery', type: 'text' },
  ];

  const detailsFields: ModalField[] = [
    { name: 'installId', label: 'Install ID', type: 'number', editable: false },
    {
      name: 'benchId',
      label: 'Test Bench',
      type: 'select',
      required: true,
      options: testBenches.map(tb => ({ value: String(tb.benchId), label: tb.hilName }))
    },
    { name: 'hilName', label: 'HIL Name', type: 'text', editable: false },
    { name: 'ecuInfo', label: 'ECU Info', type: 'text' },
    { name: 'sensors', label: 'Sensors', type: 'text' },
    { name: 'additionalPeriphery', label: 'Additional Periphery', type: 'text' },
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
          <Tool size={18} /> {/* Use icon alias */}
          Hardware Installation {hasLoaded ? `(${hardwareInstallations.length})` : ''}
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {loading && <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite', color: '#6b7280' }} />}
          <button
            onClick={handleAddClick}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
                     width: '24px', height: '24px', borderRadius: '50%', background: '#2563eb',
                     color: 'white', border: 'none', cursor: 'pointer', padding: 0 }}
            title="Add new hardware installation"
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
              <p style={{ margin: 0 }}>Loading hardware installations...</p>
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
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563' }}>ECU Info</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563' }}>Sensors</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563' }}>Additional Periphery</th>
                </tr>
              </thead>
              <tbody>
                {hardwareInstallations.length === 0 ? (
                  <tr><td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>No hardware installations found</td></tr>
                ) : (
                  hardwareInstallations.map((hw) => (
                    <tr key={hw.installId} style={{ borderBottom: '1px solid #e5e7eb', transition: 'background-color 0.2s', cursor: 'pointer' }}
                        onClick={() => handleRowClick(hw)}
                        onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#f9fafb'; }}
                        onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
                      {/* Adjust columns */}
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827' }}>{hw.installId}</td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827' }}>{hw.hilName}</td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827' }}>{hw.ecuInfo}</td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827' }}>{hw.sensors}</td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827' }}>{hw.additionalPeriphery}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      )}

      {selectedHardware && (
        <EditableDetailsModal
          isOpen={selectedHardware !== null}
          onClose={() => setSelectedHardware(null)}
          title={`Hardware Installation Details: ${selectedHardware.hilName}`}
          data={selectedHardware}
          fields={detailsFields} // Ensure options populated
          onSave={handleUpdateHardware}
        />
      )}

      {isAddModalOpen && (
        <AddEntryModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Add New Hardware Installation"
          fields={addEntryFields} // Ensure options populated
          onSave={handleSaveEntry}
        />
      )}
    </div>
  );
} 