'use client';

import React, { useState } from 'react';
import { HardDrive, RefreshCw, Plus } from 'lucide-react';
import EditableDetailsModal from '../EditableDetailsModal';
import AddEntryModal from '../AddEntryModal';
import { VmInstance } from '../../types/database';
import { keysToCamel, keysToSnake } from '../../utils/caseConverter';

// --- Reusable Modal Field Type Definitions ---
// (Consider moving to a shared file)
type FieldType = 'text' | 'number' | 'date' | 'select';
interface SelectOption { value: string; label: string; }
interface BaseField { name: string; label: string; required?: boolean; editable?: boolean; }
interface TextField extends BaseField { type: 'text'; }
interface NumberField extends BaseField { type: 'number'; }
interface DateField extends BaseField { type: 'date'; }
interface SelectField extends BaseField { type: 'select'; options: SelectOption[]; }
type ModalField = TextField | NumberField | DateField | SelectField;
// --- End Reusable Modal Field Type Definitions ---

export default function VmInstancesList() {
  const [vmInstances, setVmInstances] = useState<VmInstance[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedVmInstance, setSelectedVmInstance] = useState<VmInstance | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const fetchData = async () => {
    if (hasLoaded) return;
    setLoading(true);
    setError(null);
    try {
      // Assuming the API endpoint is /api/vm-instances (adjust if different)
      const response = await fetch('/api/vminstances');
      if (!response.ok) {
        throw new Error('Failed to fetch VM instances');
      }
      const data = await response.json();
      // Convert incoming snake_case keys to camelCase
      setVmInstances(keysToCamel<VmInstance[]>(data.vmInstances || [])); 
      setHasLoaded(true);
    } catch (err) {
      setError('Error loading VM instances: ' + (err instanceof Error ? err.message : String(err)));
      console.error('Error fetching VM instances:', err);
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
    setIsAddModalOpen(true);
  };

  const handleSaveEntry = async (formData: Record<string, any>) => {
    try {
      // Convert outgoing camelCase keys to snake_case
      const snakeCaseData = keysToSnake(formData);
      const response = await fetch('/api/vminstances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(snakeCaseData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add VM instance');
      }

      // Refresh data - API returns snake_case, convert to camelCase
      const savedData = await response.json();
      const newVmInstance = keysToCamel<VmInstance>(savedData.vmInstance); // Adjust key if needed
      setVmInstances(prev => [...prev, newVmInstance]);
      setIsAddModalOpen(false);

    } catch (err) {
      console.error("Failed to save VM instance:", err);
      throw err;
    }
  };

  const handleUpdateVmInstance = async (formData: Record<string, any>) => {
    try {
      // Ensure vmId is present (camelCase)
      if (!formData.vmId) {
        throw new Error('VM ID is required');
      }

      // Convert outgoing camelCase keys to snake_case
      const snakeCaseData = keysToSnake(formData);
      const response = await fetch('/api/vminstances', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(snakeCaseData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update VM instance');
      }

      // API returns updated record in snake_case, convert to camelCase
      const data = await response.json();
      const updatedVmInstance = keysToCamel<VmInstance>(data.vmInstance); // Adjust key if needed

      // Update local state with camelCase data
      setVmInstances(prev =>
        prev.map(vmInstance =>
          vmInstance.vmId === updatedVmInstance.vmId ? updatedVmInstance : vmInstance
        )
      );

      // Update selected VM instance with camelCase data
      setSelectedVmInstance(updatedVmInstance);
      // setSelectedVmInstance(null); // Optionally close modal

    } catch (err) {
      console.error("Failed to update VM instance:", err);
      throw err;
    }
  };

  // Define fields for the add entry modal using camelCase names
  const addEntryFields: ModalField[] = [
    { name: 'vmName', label: 'VM Name', type: 'text', required: true },
    { name: 'vmAddress', label: 'VM Address', type: 'text', required: true },
    { name: 'installedTools', label: 'Installed Tools', type: 'text' },
  ];

  // Define fields for the editable details modal using camelCase names
  const detailsFields: ModalField[] = [
    { name: 'vmId', label: 'VM ID', type: 'number', editable: false },
    { name: 'vmName', label: 'VM Name', type: 'text', required: true },
    { name: 'vmAddress', label: 'VM Address', type: 'text', required: true },
    { name: 'installedTools', label: 'Installed Tools', type: 'text' },
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
          <HardDrive size={18} />
          VM Instances {hasLoaded ? `(${vmInstances.length})` : ''}
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {loading && <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite', color: '#6b7280' }} />}
          <button
            onClick={handleAddClick}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
                     width: '24px', height: '24px', borderRadius: '50%', background: '#2563eb',
                     color: 'white', border: 'none', cursor: 'pointer', padding: 0 }}
            title="Add new VM instance"
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
              <p style={{ margin: 0 }}>Loading VM instances...</p>
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
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563' }}>ID</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563' }}>VM Name</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563' }}>VM Address</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563' }}>Installed Tools</th>
                </tr>
              </thead>
              <tbody>
                {vmInstances.length === 0 ? (
                  <tr><td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>No VM instances found</td></tr>
                ) : (
                  vmInstances.map((vmInstance) => (
                    <tr key={vmInstance.vmId} style={{ borderBottom: '1px solid #e5e7eb', transition: 'background-color 0.2s', cursor: 'pointer' }}
                        onClick={() => setSelectedVmInstance(vmInstance)} // Use camelCase data
                        onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#f9fafb'; }}
                        onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827' }}>{vmInstance.vmId}</td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827' }}>{vmInstance.vmName}</td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827' }}>{vmInstance.vmAddress}</td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827' }}>{vmInstance.installedTools}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      )}

      {selectedVmInstance && (
        <EditableDetailsModal
          isOpen={selectedVmInstance !== null}
          onClose={() => setSelectedVmInstance(null)}
          title={`VM Instance Details: ${selectedVmInstance.vmName}`} // Use camelCase
          data={selectedVmInstance} // Pass camelCase data
          fields={detailsFields} // Pass camelCase fields
          onSave={handleUpdateVmInstance} // Handler expects camelCase
        />
      )}

      {isAddModalOpen && (
        <AddEntryModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Add New VM Instance"
          fields={addEntryFields} // Pass camelCase fields
          onSave={handleSaveEntry} // Handler expects camelCase
        />
      )}
    </div>
  );
} 