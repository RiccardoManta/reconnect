'use client';

import React, { useState, useEffect, CSSProperties } from 'react';
import { KeyRound, RefreshCw, PlusCircle } from 'lucide-react';
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
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/licenses');
      if (!response.ok) {
        throw new Error('Failed to fetch licenses');
      }
      const data = await response.json();
      setLicenses(keysToCamel<License[]>(data.licenses || []));
    } catch (err) {
      setError('Error loading licenses: ' + (err instanceof Error ? err.message : String(err)));
      console.error('Error fetching licenses:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    const loadInitialData = async () => {
      await fetchData(); // Fetch main licenses list
      await fetchRelatedData(); // Fetch related data (including software)
    };
    loadInitialData();
  }, []); // Empty dependency array ensures this runs once on mount

  const handleAddClick = () => {
    // fetchRelatedData(); // No longer needed here, fetched on mount
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
    // Add a check for when software list might still be loading
    if (software.length === 0 && loading) return 'Loading...'; 
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

  // --- Styles --- 
  const styles: { [key: string]: CSSProperties } = {
    headerContainer: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' },
    headerTitleContainer: { display: 'flex', alignItems: 'center' },
    headerIcon: { color: '#0F3460', marginRight: '1rem' },
    headerTitle: { fontSize: '1.75rem', fontWeight: 'bold', color: '#0F3460', margin: 0 },
    addButton: { border: 'none', borderRadius: '0.375rem', padding: '0.5rem 0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', fontSize: '0.875rem', fontWeight: 500, boxShadow: '0 1px 2px rgba(0,0,0,0.05)', backgroundColor: '#0F3460', color: 'white' },
    tableContainer: { backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', overflowX: 'auto' },
    loadingContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem', color: '#6b7280' },
    loadingSpinner: { animation: 'spin 1s linear infinite', marginBottom: '0.5rem' },
    errorContainer: { textAlign: 'center', padding: '1rem', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: '0.5rem', fontSize: '0.875rem' },
    table: { width: '100%', borderCollapse: 'collapse' },
    tableHeaderRow: { borderBottom: '1px solid #e5e7eb', backgroundColor: '#f9fafb' },
    tableHeaderCell: { padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: 600, color: '#4b5563' },
    tableBodyRow: { borderBottom: '1px solid #e5e7eb', transition: 'background-color 0.2s', cursor: 'pointer' },
    tableBodyCell: { padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827' },
    // Styles for assignment section in modal
    assignmentSection: { marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #e5e7eb', },
  };

  return (
    <div>
      {/* Page Header */}
      <div style={styles.headerContainer}>
        <div style={styles.headerTitleContainer}>
          <KeyRound size={28} style={styles.headerIcon} />
          <h1 style={styles.headerTitle}>Licenses {licenses.length > 0 ? `(${licenses.length})` : ''}</h1>
        </div>
        <button
          onClick={handleAddClick}
          style={styles.addButton}
          title="Add new license"
        >
          <PlusCircle size={18} style={{ marginRight: '0.5rem' }} />
          Add License
        </button>
      </div>

      {/* Table Container */}
      <div style={styles.tableContainer}>
        {loading ? (
          <div style={styles.loadingContainer}>
            <RefreshCw size={24} style={styles.loadingSpinner} />
            <p style={{ margin: 0 }}>Loading licenses...</p>
            <style jsx>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : error ? (
          <div style={styles.errorContainer}><p>{error}</p></div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr style={styles.tableHeaderRow}>
                <th style={styles.tableHeaderCell}>ID</th>
                <th style={styles.tableHeaderCell}>Software</th>
                <th style={styles.tableHeaderCell}>License Name</th>
                <th style={styles.tableHeaderCell}>Type</th>
                <th style={styles.tableHeaderCell}>License No.</th>
                <th style={styles.tableHeaderCell}>Dongle No.</th>
                <th style={styles.tableHeaderCell}>User</th>
                <th style={styles.tableHeaderCell}>Maintenance End</th>
              </tr>
            </thead>
            <tbody>
              {licenses.length === 0 ? (
                <tr><td colSpan={8} style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>No licenses found</td></tr>
              ) : (
                licenses.map((license) => (
                  <tr key={license.licenseId}
                    style={styles.tableBodyRow}
                    onClick={() => handleRowClick(license)}
                    onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#f9fafb'; }}
                    onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    <td style={styles.tableBodyCell}>{license.licenseId}</td>
                    <td style={styles.tableBodyCell}>{getSoftwareName(license.softwareId)}</td>
                    <td style={styles.tableBodyCell}>{license.licenseName || '-'}</td>
                    <td style={styles.tableBodyCell}>{license.licenseType || '-'}</td>
                    <td style={styles.tableBodyCell}>{license.licenseNumber || '-'}</td>
                    <td style={styles.tableBodyCell}>{license.dongleNumber || '-'}</td>
                    <td style={styles.tableBodyCell}>{license.licenseUser || '-'}</td>
                    <td style={styles.tableBodyCell}>{license.maintenanceEnd ? new Date(license.maintenanceEnd).toLocaleDateString() : '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Modals */} 
      {selectedLicense && (
        <EditableDetailsModal
          isOpen={selectedLicense !== null}
          onClose={() => setSelectedLicense(null)}
          title={`License Details: ${selectedLicense.licenseName || `ID ${selectedLicense.licenseId}`}`}
          data={selectedLicense}
          fields={detailsFields}
          onSave={handleUpdateLicense}
        >
          {/* Add Assignment Management Section */}
          <div style={styles.assignmentSection}>
              <ManageLicenseAssignment
                  allPcs={allPcs}
                  allVms={allVms}
                  currentAssignment={currentAssignment}
                  isLoading={assignmentLoading}
                  error={assignmentError}
                  onAssign={handleAssignLicense}
                  onUnassign={handleUnassignLicense}
                  // Pass any necessary styles if ManageLicenseAssignment expects them
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