'use client';

import React, { useState } from 'react';
import { Lock, RefreshCw, Plus } from 'lucide-react';
import EditableDetailsModal from '../EditableDetailsModal';
import AddEntryModal from '../AddEntryModal';
import { License, Software, PcOverview, VmInstance } from '../../types/database';
import { keysToCamel, keysToSnake } from '../../utils/caseConverter';
import ManageLicenseAssignment from './ManageLicenseAssignment';

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

// Interface for the assignment data fetched from API
// Must match the structure returned by /api/licenses/[id]/assignment GET
interface FetchedAssignment {
  assignmentId: number;
  licenseId: number;
  pcId: number | null;
  vmId: number | null;
  assignedOn: string | null;
}

export default function LicensesList() {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedLicense, setSelectedLicense] = useState<License | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [software, setSoftware] = useState<Software[]>([]);

  // State for license assignment management
  const [allPcs, setAllPcs] = useState<PcOverview[]>([]);
  const [allVms, setAllVms] = useState<VmInstance[]>([]);
  const [currentAssignment, setCurrentAssignment] = useState<FetchedAssignment | null>(null);
  const [assignmentLoading, setAssignmentLoading] = useState(false);
  const [assignmentError, setAssignmentError] = useState<string | null>(null);

  const fetchRelatedData = async () => {
    // Combine fetches for efficiency, prevent re-fetching if already loaded
    const softwareFetchNeeded = software.length === 0;
    const pcsFetchNeeded = allPcs.length === 0;
    const vmsFetchNeeded = allVms.length === 0;

    const fetches = [];
    if (softwareFetchNeeded) fetches.push(fetch('/api/software'));
    if (pcsFetchNeeded) fetches.push(fetch('/api/pcs'));
    if (vmsFetchNeeded) fetches.push(fetch('/api/vminstances'));

    if (fetches.length === 0) return; // All data already loaded
    
    // Note: Might need separate loading indicator if this takes time
    try {
      const responses = await Promise.all(fetches);
      const results = await Promise.all(responses.map(res => res.json()));

      let resultIndex = 0;
      if (softwareFetchNeeded) {
        const swData = results[resultIndex++];
        setSoftware(keysToCamel<Software[]>(swData.software || []));
      }
      if (pcsFetchNeeded) {
        const pcData = results[resultIndex++];
        setAllPcs(keysToCamel<PcOverview[]>(pcData.pcs || []));
      }
      if (vmsFetchNeeded) {
        const vmData = results[resultIndex++];
        setAllVms(keysToCamel<VmInstance[]>(vmData.vmInstances || []));
      }
    } catch (err) {
      console.error('Error fetching related data (SW/PC/VM):', err);
      // Handle individual fetch failures if needed by checking responses array status
      setError('Failed to load data needed for assignments.'); // Set general error maybe
    }
  };

  const fetchCurrentLicenseAssignment = async (licenseId: number) => {
      setAssignmentLoading(true);
      setAssignmentError(null);
      setCurrentAssignment(null); // Clear previous assignment
      try {
          const response = await fetch(`/api/licenses/${licenseId}/assignment`);
          if (!response.ok) {
              const errorData = await response.json();
              // 404 might be common if not assigned, handle gracefully
              if (response.status !== 404) {
                throw new Error(errorData.error || 'Failed to fetch assignment');
              }
          }
          const data = await response.json();
          if (data.assignment) {
             setCurrentAssignment(keysToCamel<FetchedAssignment>(data.assignment));
          } else {
             setCurrentAssignment(null); // Explicitly set to null if no assignment found
          }
      } catch (err) {
          console.error(`Error fetching assignment for license ${licenseId}:`, err);
          setAssignmentError('Failed to load current license assignment.');
      } finally {
          setAssignmentLoading(false);
      }
  };

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
      // Don't fetch all related data here, wait until modal opens
    }
  };

  const handleAddClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    fetchRelatedData(); // Need Software list for Add modal
    setIsAddModalOpen(true);
  };

  const handleSaveEntry = async (formData: Record<string, any>) => {
    try {
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
      if (!formData.licenseId || !selectedLicense) {
        throw new Error('License ID is required and license must be selected');
      }

      // --- Check if any editable fields actually changed ---
      let changed = false;
      for (const field of detailsFields) {
        if (field.editable) {
          const key = field.name as keyof License;
          // Basic comparison, handling potential null/undefined
          // For date fields, ensure consistent format or use Date objects if needed
          const originalValue = selectedLicense[key];
          const newValue = formData[key];
          
          // Coerce number fields from modal (might be string) to number for comparison
          const isNumberField = field.type === 'number';
          const coercedNewValue = isNumberField ? Number(newValue) : newValue;
          const coercedOriginalValue = isNumberField ? Number(originalValue) : originalValue;

          // Handle null/undefined/empty string equivalence for non-required fields
          const areEffectivelyEqual = 
              (coercedOriginalValue === coercedNewValue) || 
              ( (coercedOriginalValue === null || coercedOriginalValue === undefined || coercedOriginalValue === '') && 
                (coercedNewValue === null || coercedNewValue === undefined || coercedNewValue === '') );

          if (!areEffectivelyEqual) {
            // Special check for date: Ensure formats match or parse them
            if (field.type === 'date') {
                 // Assuming YYYY-MM-DD format from date input
                 const originalDate = originalValue ? String(originalValue).split('T')[0] : null;
                 const newDate = newValue ? String(newValue).split('T')[0] : null;
                 if (originalDate !== newDate) {
                     changed = true;
                     break;
                 }
            } else {
                changed = true;
                break; // Found a change, no need to check further
            }
          }
        }
      }

      if (!changed) {
        console.log("No changes detected in license details. Skipping update.");
        // Optionally close the modal here if desired, or just do nothing.
        // onClose(); // Example if you want it to close
        return; // Exit the function gracefully
      }
      // --- End change detection ---

      console.log("Changes detected, proceeding with update...");
      const snakeCaseData = keysToSnake(formData);
      const response = await fetch(`/api/licenses/${formData.licenseId}`, { 
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(snakeCaseData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update license');
      }
      const data = await response.json();
      const updatedLicense = keysToCamel<License>(data.license);
      setLicenses(prev =>
        prev.map(license =>
          license.licenseId === updatedLicense.licenseId ? updatedLicense : license
        )
      );
      setSelectedLicense(updatedLicense);
      // Don't close modal automatically after successful save, user might want to see changes
    } catch (err) {
      console.error("Failed to update license:", err);
      // IMPORTANT: Re-throw the error so EditableDetailsModal can catch it and display it
      throw err; 
    }
  };

  const handleRowClick = async (license: License) => {
    setSelectedLicense(license); // Set selected license first
    await fetchRelatedData(); // Ensure Software, PCs, VMs are loaded
    if (license.licenseId !== undefined) {
      await fetchCurrentLicenseAssignment(license.licenseId);
    }
  };

  // Helper function to get software name by ID
  const getSoftwareName = (id: number): string => {
    const sw = software.find(s => s.softwareId === id);
    if (!sw) return `ID: ${id}`; // Fallback if software not found
    return `${sw.softwareName}${sw.majorVersion ? ' ('+sw.majorVersion+')' : ''}`;
  };

  // Define fields for the add entry modal using camelCase names
  const addEntryFields: ModalField[] = [
    {
      name: 'softwareId',
      label: 'Software',
      type: 'select',
      required: true,
      // Populate options from the fetched software state
      options: software.map(s => ({ 
        value: String(s.softwareId), 
        // Combine name and version for clarity if needed
        label: `${s.softwareName}${s.majorVersion ? ' ('+s.majorVersion+')' : ''}` 
      }))
    },
    { name: 'licenseName', label: 'License Name', type: 'text' },
    { name: 'licenseDescription', label: 'Description', type: 'text' }, // Consider textarea type if available
    { name: 'licenseNumber', label: 'License Number', type: 'text' },
    { name: 'dongleNumber', label: 'Dongle Number', type: 'text' },
    { name: 'activationKey', label: 'Activation Key', type: 'text' },
    { name: 'systemId', label: 'System ID (e.g., IPG)', type: 'text' },
    { name: 'licenseUser', label: 'License User (e.g., MathWorks)', type: 'text' },
    { name: 'maintenanceEnd', label: 'Maintenance End', type: 'date' },
    { name: 'owner', label: 'Owner (Cost Center/Project)', type: 'text' },
    { name: 'licenseType', label: 'License Type', type: 'text' }, // Consider select if predefined types
    { name: 'remarks', label: 'Remarks', type: 'text' }, // Consider textarea type if available
  ];

  // Define fields for the editable details modal using camelCase names
  const detailsFields: ModalField[] = [
    { name: 'licenseId', label: 'License ID', type: 'number', editable: false },
    {
      name: 'softwareId',
      label: 'Software',
      type: 'select',
      required: true,
      editable: true,
      options: software.map(s => ({ 
        value: String(s.softwareId), 
        label: `${s.softwareName}${s.majorVersion ? ' ('+s.majorVersion+')' : ''}` 
      }))
    },
    { name: 'licenseName', label: 'License Name', type: 'text', editable: true },
    { name: 'licenseDescription', label: 'Description', type: 'text', editable: true },
    { name: 'licenseNumber', label: 'License Number', type: 'text', editable: true },
    { name: 'dongleNumber', label: 'Dongle Number', type: 'text', editable: true },
    { name: 'activationKey', label: 'Activation Key', type: 'text', editable: true },
    { name: 'systemId', label: 'System ID', type: 'text', editable: true },
    { name: 'licenseUser', label: 'License User', type: 'text', editable: true },
    { name: 'maintenanceEnd', label: 'Maintenance End', type: 'date', editable: true },
    { name: 'owner', label: 'Owner', type: 'text', editable: true },
    { name: 'licenseType', label: 'License Type', type: 'text', editable: true },
    { name: 'remarks', label: 'Remarks', type: 'text', editable: true },
  ];

  // --- Handlers for Assigning/Unassigning License --- 
  const handleAssignLicense = async (targetType: 'pc' | 'vm', targetId: number) => {
      if (!selectedLicense?.licenseId) {
          setAssignmentError("Cannot assign: No license selected.");
          return;
      }
      setAssignmentLoading(true);
      setAssignmentError(null);
      try {
          const body = {
              pc_id: targetType === 'pc' ? targetId : null,
              vm_id: targetType === 'vm' ? targetId : null,
          };
          const response = await fetch(`/api/licenses/${selectedLicense.licenseId}/assignment`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(body),
          });
          if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.error || 'Failed to assign license');
          }
          const data = await response.json();
          // Update local state with the new assignment data
          setCurrentAssignment(keysToCamel<FetchedAssignment>(data.assignment)); 
      } catch (err) {
          const errorMsg = `Error assigning license: ${err instanceof Error ? err.message : String(err)}`;
          setAssignmentError(errorMsg);
      } finally {
          setAssignmentLoading(false);
      }
  };

  const handleUnassignLicense = async () => {
      if (!selectedLicense?.licenseId) {
          setAssignmentError("Cannot unassign: No license selected.");
          return;
      }
      // Optional: Confirmation
      if (!confirm('Are you sure you want to unassign this license?')) return;

      setAssignmentLoading(true);
      setAssignmentError(null);
      try {
          const response = await fetch(`/api/licenses/${selectedLicense.licenseId}/assignment`, {
              method: 'DELETE',
          });
          if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.error || 'Failed to unassign license');
          }
          // Update local state - no assignment exists now
          setCurrentAssignment(null);
      } catch (err) {
          const errorMsg = `Error unassigning license: ${err instanceof Error ? err.message : String(err)}`;
          setAssignmentError(errorMsg);
      } finally {
          setAssignmentLoading(false);
      }
  };
  // --- End Assignment Handlers ---

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
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563' }}>Software Name</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563' }}>License Name</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563' }}>License Number</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563' }}>Type</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563' }}>Maintenance End</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563' }}>Owner</th>
                </tr>
              </thead>
              <tbody>
                {licenses.length === 0 ? (
                  <tr><td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>No licenses found</td></tr>
                ) : (
                  licenses.map((license) => (
                    <tr key={license.licenseId} style={{ borderBottom: '1px solid #e5e7eb', transition: 'background-color 0.2s', cursor: 'pointer' }}
                        onClick={() => handleRowClick(license)}
                        onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#f9fafb'; }}
                        onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827' }}>{license.licenseId}</td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827' }}>{getSoftwareName(license.softwareId)}</td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827' }}>{license.licenseName || '-'}</td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827' }}>{license.licenseNumber || '-'}</td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827' }}>{license.licenseType || '-'}</td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827' }}>{license.maintenanceEnd || '-'}</td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827' }}>{license.owner || '-'}</td>
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
          onClose={() => {
            setSelectedLicense(null);
            // Clear assignment state when closing modal
            setCurrentAssignment(null);
            setAssignmentError(null);
          }}
          title={`License Details: ${selectedLicense.licenseName || getSoftwareName(selectedLicense.softwareId)}`}
          data={selectedLicense}
          fields={detailsFields}
          onSave={handleUpdateLicense}
        >
          <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #e5e7eb' }}>
            <h3 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '1.1rem', fontWeight: '600' }}>
              Assignment
            </h3>
            <ManageLicenseAssignment 
              allPcs={allPcs}
              allVms={allVms}
              currentAssignment={currentAssignment}
              isLoading={assignmentLoading} 
              error={assignmentError}
              onAssign={handleAssignLicense}
              onUnassign={handleUnassignLicense}
            />
          </div>
        </EditableDetailsModal>
      )}

      {isAddModalOpen && (
        <AddEntryModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Add New License"
          fields={addEntryFields}
          onSave={handleSaveEntry}
        />
      )}
    </div>
  );
} 