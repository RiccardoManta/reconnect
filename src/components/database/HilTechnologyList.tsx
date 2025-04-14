'use client';

import React, { useState } from 'react';
import { Microchip, RefreshCw, Plus } from 'lucide-react';
import EditableDetailsModal from '../EditableDetailsModal';
import AddEntryModal from '../AddEntryModal';
import { HilTechnology, TestBench } from '../../types/database';
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

export default function HilTechnologyList() {
  const [hilTechnology, setHilTechnology] = useState<HilTechnology[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTechnology, setSelectedTechnology] = useState<HilTechnology | null>(null);
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
      const response = await fetch('/api/hil-technology'); // Assuming endpoint
      if (!response.ok) {
        throw new Error('Failed to fetch HIL technology');
      }
      const data = await response.json();
      setHilTechnology(keysToCamel<HilTechnology[]>(data.hilTechnology || [])); // Assuming key
      setHasLoaded(true);
    } catch (err) {
      setError('Error loading HIL technology: ' + (err instanceof Error ? err.message : String(err)));
      console.error('Error fetching HIL technology:', err);
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

  const handleRowClick = (tech: HilTechnology) => {
      fetchRelatedData();
      setSelectedTechnology(tech);
  }

  const handleSaveEntry = async (formData: Record<string, any>) => {
    try {
      const snakeCaseData = keysToSnake(formData);
      const response = await fetch('/api/hil-technology', { // Assuming endpoint
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(snakeCaseData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add HIL technology');
      }

      const savedData = await response.json();
      const newTechnology = keysToCamel<HilTechnology>(savedData.hilTechnology); // Assuming key
      setHilTechnology(prev => [...prev, newTechnology]);
      setIsAddModalOpen(false);

    } catch (err) {
      console.error("Failed to save HIL technology:", err);
      throw err;
    }
  };

  const handleUpdateTechnology = async (formData: Record<string, any>) => {
    try {
      if (!formData.techId) { // Check camelCase ID
        throw new Error('Technology ID is required');
      }

      const snakeCaseData = keysToSnake(formData);
      const response = await fetch('/api/hil-technology', { // Assuming endpoint
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(snakeCaseData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update HIL technology');
      }

      const data = await response.json();
      const updatedTechnology = keysToCamel<HilTechnology>(data.hilTechnology); // Assuming key

      setHilTechnology(prev =>
        prev.map(tech =>
          tech.techId === updatedTechnology.techId ? updatedTechnology : tech
        )
      );
      setSelectedTechnology(updatedTechnology);
      // setSelectedTechnology(null); // Optionally close

    } catch (err) {
      console.error("Failed to update HIL technology:", err);
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
    // benchId select will populate hilName automatically based on selection in the API/backend ideally
    // If not, hilName might need to be set based on benchId selection or be a read-only field populated after selection
    // { name: 'hilName', label: 'HIL Name', type: 'text', required: true, editable: false }, 
    { name: 'fiuInfo', label: 'FIU Info', type: 'text' },
    { name: 'ioInfo', label: 'I/O Info', type: 'text' },
    { name: 'canInterface', label: 'CAN Interface', type: 'text' },
    { name: 'powerInterface', label: 'Power Interface', type: 'text' },
    { name: 'possibleTests', label: 'Possible Tests', type: 'text' },
    { name: 'leakageModule', label: 'Leakage Module', type: 'text' },
  ];

  const detailsFields: ModalField[] = [
    { name: 'techId', label: 'Technology ID', type: 'number', editable: false },
    {
      name: 'benchId',
      label: 'Test Bench',
      type: 'select',
      required: true,
      options: testBenches.map(tb => ({ value: String(tb.benchId), label: tb.hilName }))
    },
    { name: 'hilName', label: 'HIL Name', type: 'text', editable: false }, // Typically non-editable if linked to benchId
    { name: 'fiuInfo', label: 'FIU Info', type: 'text' },
    { name: 'ioInfo', label: 'I/O Info', type: 'text' },
    { name: 'canInterface', label: 'CAN Interface', type: 'text' },
    { name: 'powerInterface', label: 'Power Interface', type: 'text' },
    { name: 'possibleTests', label: 'Possible Tests', type: 'text' },
    { name: 'leakageModule', label: 'Leakage Module', type: 'text' },
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
          <Microchip size={18} />
          HIL Technology {hasLoaded ? `(${hilTechnology.length})` : ''}
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {loading && <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite', color: '#6b7280' }} />}
          <button
            onClick={handleAddClick}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
                     width: '24px', height: '24px', borderRadius: '50%', background: '#2563eb',
                     color: 'white', border: 'none', cursor: 'pointer', padding: 0 }}
            title="Add new HIL technology"
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
              <p style={{ margin: 0 }}>Loading HIL technology...</p>
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
                  {/* Adjust headers based on desired display columns */}
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563' }}>ID</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563' }}>HIL Name</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563' }}>FIU Info</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563' }}>I/O Info</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563' }}>CAN Interface</th>
                </tr>
              </thead>
              <tbody>
                {hilTechnology.length === 0 ? (
                  <tr><td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>No HIL technology found</td></tr>
                ) : (
                  hilTechnology.map((tech) => (
                    <tr key={tech.techId} style={{ borderBottom: '1px solid #e5e7eb', transition: 'background-color 0.2s', cursor: 'pointer' }}
                        onClick={() => handleRowClick(tech)}
                        onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#f9fafb'; }}
                        onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
                      {/* Display relevant columns */}
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827' }}>{tech.techId}</td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827' }}>{tech.hilName}</td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827' }}>{tech.fiuInfo}</td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827' }}>{tech.ioInfo}</td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827' }}>{tech.canInterface}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      )}

      {selectedTechnology && (
        <EditableDetailsModal
          isOpen={selectedTechnology !== null}
          onClose={() => setSelectedTechnology(null)}
          title={`HIL Technology Details: ${selectedTechnology.hilName}`}
          data={selectedTechnology}
          fields={detailsFields} // Ensure options are populated
          onSave={handleUpdateTechnology}
        />
      )}

      {isAddModalOpen && (
        <AddEntryModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Add New HIL Technology"
          fields={addEntryFields} // Ensure options are populated
          onSave={handleSaveEntry}
        />
      )}
    </div>
  );
} 