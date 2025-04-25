'use client';

import React, { useState } from 'react';
import { Activity, RefreshCw, Plus } from 'lucide-react';
import EditableDetailsModal from '../EditableDetailsModal';
import AddEntryModal from '../AddEntryModal';
import { HilOperation, TestBench } from '../../types/database';
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

export default function HilOperationList() {
  const [hilOperations, setHilOperations] = useState<HilOperation[]>([]); // Changed state variable name
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedOperation, setSelectedOperation] = useState<HilOperation | null>(null);
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
      const response = await fetch('/api/hiloperation'); // Changed endpoint
      if (!response.ok) {
        throw new Error('Failed to fetch HIL operations');
      }
      const data = await response.json();
      setHilOperations(keysToCamel<HilOperation[]>(data.operations || [])); // Changed data.hilOperations to data.operations
      setHasLoaded(true);
    } catch (err) {
      setError('Error loading HIL operations: ' + (err instanceof Error ? err.message : String(err)));
      console.error('Error fetching HIL operations:', err);
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

  const handleRowClick = (op: HilOperation) => {
      fetchRelatedData();
      setSelectedOperation(op);
  }

  const handleSaveEntry = async (formData: Record<string, any>) => {
    try {
      const snakeCaseData = keysToSnake(formData);
      const response = await fetch('/api/hiloperation', { // Changed endpoint
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(snakeCaseData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add HIL operation');
      }

      const savedData = await response.json();
      const newOperation = keysToCamel<HilOperation>(savedData.operation); // Changed savedData.hilOperation to savedData.operation
      setHilOperations(prev => [...prev, newOperation]);
      setIsAddModalOpen(false);

    } catch (err) {
      console.error("Failed to save HIL operation:", err);
      throw err;
    }
  };

  const handleUpdateOperation = async (formData: Record<string, any>) => {
    try {
      if (!formData.operationId) {
        throw new Error('HIL Operation ID is required');
      }

      const snakeCaseData = keysToSnake(formData);
      const response = await fetch('/api/hiloperation', { // Changed endpoint
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(snakeCaseData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update HIL operation');
      }

      const data = await response.json();
      const updatedOperation = keysToCamel<HilOperation>(data.operation); // Changed data.hilOperation to data.operation

      setHilOperations(prev =>
        prev.map(op =>
          op.operationId === updatedOperation.operationId ? updatedOperation : op
        )
      );
      setSelectedOperation(updatedOperation);
      // setSelectedOperation(null); // Optionally close

    } catch (err) {
      console.error("Failed to update HIL operation:", err);
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
    // hilName might be auto-populated or read-only based on benchId
    { name: 'possibleTests', label: 'Possible Tests', type: 'text' },
    { name: 'vehicleDatasets', label: 'Vehicle Datasets', type: 'text' },
    { name: 'scenarios', label: 'Scenarios', type: 'text' },
    { name: 'controldeskProjects', label: 'Controldesk Projects', type: 'text' },
  ];

  const detailsFields: ModalField[] = [
    { name: 'operationId', label: 'Operation ID', type: 'number', editable: false },
    {
      name: 'benchId',
      label: 'Test Bench',
      type: 'select',
      required: true,
      editable: true,
      options: testBenches.map(tb => ({ value: String(tb.benchId), label: tb.hilName }))
    },
    { name: 'possibleTests', label: 'Possible Tests', type: 'text', editable: true },
    { name: 'vehicleDatasets', label: 'Vehicle Datasets', type: 'text', editable: true },
    { name: 'scenarios', label: 'Scenarios', type: 'text', editable: true },
    { name: 'controldeskProjects', label: 'Controldesk Projects', type: 'text', editable: true },
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
          <Activity size={18} />
          HIL Operation {hasLoaded ? `(${hilOperations.length})` : ''}
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {loading && <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite', color: '#6b7280' }} />}
          <button
            onClick={handleAddClick}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
                     width: '24px', height: '24px', borderRadius: '50%', background: '#2563eb',
                     color: 'white', border: 'none', cursor: 'pointer', padding: 0 }}
            title="Add new HIL operation"
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
              <p style={{ margin: 0 }}>Loading HIL operations...</p>
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
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563' }}>Possible Tests</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563' }}>Vehicle Datasets</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563' }}>Scenarios</th>
                </tr>
              </thead>
              <tbody>
                {hilOperations.length === 0 ? (
                  <tr><td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>No HIL operations found</td></tr>
                ) : (
                  hilOperations.map((op) => {
                    // Find the associated test bench name
                    const hilName = testBenches.find(tb => tb.benchId === op.benchId)?.hilName || 'N/A';
                    
                    return (
                      <tr key={op.operationId} style={{ borderBottom: '1px solid #e5e7eb', transition: 'background-color 0.2s', cursor: 'pointer' }}
                          onClick={() => handleRowClick(op)}
                          onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#f9fafb'; }}
                          onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
                        {/* Adjust columns */}
                        <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827' }}>{op.operationId}</td>
                        <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827' }}>{hilName}</td>
                        <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827' }}>{op.possibleTests || '-'}</td>
                        <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827' }}>{op.vehicleDatasets || '-'}</td>
                        <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827' }}>{op.scenarios || '-'}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
      )}

      {selectedOperation && (
        <EditableDetailsModal
          isOpen={selectedOperation !== null}
          onClose={() => setSelectedOperation(null)}
          title={`HIL Operation Details for Bench: ${testBenches.find(tb => tb.benchId === selectedOperation.benchId)?.hilName || selectedOperation.benchId}`}
          data={selectedOperation}
          fields={detailsFields} // Ensure options populated
          onSave={handleUpdateOperation}
        />
      )}

      {isAddModalOpen && (
        <AddEntryModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Add New HIL Operation"
          fields={addEntryFields} // Ensure options populated
          onSave={handleSaveEntry}
        />
      )}
    </div>
  );
} 