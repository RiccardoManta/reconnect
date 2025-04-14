'use client';

import React, { useState } from 'react';
import { Lock, RefreshCw, Plus } from 'lucide-react';
import EditableDetailsModal from '../EditableDetailsModal';
import AddEntryModal from '../AddEntryModal';
import { License } from '../../types/database';
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

export default function LicensesList() {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedLicense, setSelectedLicense] = useState<License | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const fetchData = async () => {
    if (hasLoaded) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/licenses');
      if (!response.ok) {
        throw new Error('Failed to fetch licenses');
      }
      const data = await response.json();
      // Convert incoming snake_case keys to camelCase
      setLicenses(keysToCamel<License[]>(data.licenses || []));
      setHasLoaded(true);
    } catch (err) {
      setError('Error loading licenses: ' + (err instanceof Error ? err.message : String(err)));
      console.error('Error fetching licenses:', err);
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
      const response = await fetch('/api/licenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(snakeCaseData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add license');
      }

      // Refresh data - API returns snake_case, convert to camelCase
      const savedData = await response.json();
      const newLicense = keysToCamel<License>(savedData.license);
      setLicenses(prev => [...prev, newLicense]);
      setIsAddModalOpen(false);

    } catch (err) {
      console.error("Failed to save license:", err);
      throw err;
    }
  };

  const handleUpdateLicense = async (formData: Record<string, any>) => {
    try {
      // Ensure licenseId is present (camelCase)
      if (!formData.licenseId) {
        throw new Error('License ID is required');
      }

      // Convert outgoing camelCase keys to snake_case
      const snakeCaseData = keysToSnake(formData);
      const response = await fetch('/api/licenses', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(snakeCaseData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update license');
      }

      // API returns updated record in snake_case, convert to camelCase
      const data = await response.json();
      const updatedLicense = keysToCamel<License>(data.license);

      // Update local state with camelCase data
      setLicenses(prev =>
        prev.map(license =>
          license.licenseId === updatedLicense.licenseId ? updatedLicense : license
        )
      );

      // Update selected license with camelCase data
      setSelectedLicense(updatedLicense);
      // setSelectedLicense(null); // Optionally close modal

    } catch (err) {
      console.error("Failed to update license:", err);
      throw err;
    }
  };

  // Define fields for the add entry modal using camelCase names
  const addEntryFields: ModalField[] = [
    { name: 'toolName', label: 'Tool Name', type: 'text', required: true },
    { name: 'licenseNumber', label: 'License Number', type: 'text', required: true },
    { name: 'maintenanceEnd', label: 'Maintenance End', type: 'date' },
    { name: 'owner', label: 'Owner', type: 'text' },
  ];

  // Define fields for the editable details modal using camelCase names
  const detailsFields: ModalField[] = [
    { name: 'licenseId', label: 'License ID', type: 'number', editable: false },
    { name: 'toolName', label: 'Tool Name', type: 'text', required: true },
    { name: 'licenseNumber', label: 'License Number', type: 'text', required: true },
    { name: 'maintenanceEnd', label: 'Maintenance End', type: 'date' },
    { name: 'owner', label: 'Owner', type: 'text' },
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
          <Lock size={18} />
          Licenses {hasLoaded ? `(${licenses.length})` : ''}
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {loading && <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite', color: '#6b7280' }} />}
          <button
            onClick={handleAddClick}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
                     width: '24px', height: '24px', borderRadius: '50%', background: '#2563eb',
                     color: 'white', border: 'none', cursor: 'pointer', padding: 0 }}
            title="Add new license"
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
              <p style={{ margin: 0 }}>Loading licenses...</p>
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
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563' }}>Tool Name</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563' }}>License Number</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563' }}>Maintenance End</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563' }}>Owner</th>
                </tr>
              </thead>
              <tbody>
                {licenses.length === 0 ? (
                  <tr><td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>No licenses found</td></tr>
                ) : (
                  licenses.map((license) => (
                    <tr key={license.licenseId} style={{ borderBottom: '1px solid #e5e7eb', transition: 'background-color 0.2s', cursor: 'pointer' }}
                        onClick={() => setSelectedLicense(license)} // Use camelCase data
                        onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#f9fafb'; }}
                        onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827' }}>{license.licenseId}</td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827' }}>{license.toolName}</td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827' }}>{license.licenseNumber}</td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827' }}>{license.maintenanceEnd}</td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827' }}>{license.owner}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      )}

      {selectedLicense && (
        <EditableDetailsModal
          isOpen={selectedLicense !== null}
          onClose={() => setSelectedLicense(null)}
          title={`License Details: ${selectedLicense.toolName}`} // Use camelCase
          data={selectedLicense} // Pass camelCase data
          fields={detailsFields} // Pass camelCase fields
          onSave={handleUpdateLicense} // Handler expects camelCase
        />
      )}

      {isAddModalOpen && (
        <AddEntryModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Add New License"
          fields={addEntryFields} // Pass camelCase fields
          onSave={handleSaveEntry} // Handler expects camelCase
        />
      )}
    </div>
  );
} 