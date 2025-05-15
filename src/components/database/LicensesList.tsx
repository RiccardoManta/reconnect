'use client';

import React, { useState, useEffect, CSSProperties } from 'react';
import { KeyRound, RefreshCw, PlusCircle } from 'lucide-react';
import EditableDetailsModal from '../EditableDetailsModal';
import AddEntryModal from '../AddEntryModal';
import { License, Software, PcOverview, VmInstance } from '../../types/database';
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
  assignment_id: number;
  license_id: number;
  pc_id: number | null;
  vm_id: number | null;
  assigned_on: string | null;
}

export default function LicensesList() {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected_license, setSelectedLicense] = useState<License | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [software, setSoftware] = useState<Software[]>([]);

  // State for license assignment management
  const [all_pcs, setAllPcs] = useState<PcOverview[]>([]);
  const [all_vms, setAllVms] = useState<VmInstance[]>([]);

  const fetchRelatedData = async () => {
    // Combine fetches for efficiency, prevent re-fetching if already loaded
    const software_fetch_needed = software.length === 0;
    const pcs_fetch_needed = all_pcs.length === 0;
    const vms_fetch_needed = all_vms.length === 0;

    const fetches = [];
    if (software_fetch_needed) fetches.push(fetch('/api/software'));
    if (pcs_fetch_needed) fetches.push(fetch('/api/pcs'));
    if (vms_fetch_needed) fetches.push(fetch('/api/vminstances'));

    if (fetches.length === 0) return; // All data already loaded
    
    // Note: Might need separate loading indicator if this takes time
    try {
      const responses = await Promise.all(fetches);
      const results = await Promise.all(responses.map(res => res.json()));

      let resultIndex = 0;
      if (software_fetch_needed) {
        const sw_data = results[resultIndex++];
        setSoftware(sw_data.software || []);
      }
      if (pcs_fetch_needed) {
        const pc_data = results[resultIndex++];
        setAllPcs(pc_data.pcs || []);
      }
      if (vms_fetch_needed) {
        const vm_data = results[resultIndex++];
        setAllVms(vm_data.vm_instances || []);
      }
    } catch (err) {
      console.error('Error fetching related data (SW/PC/VM):', err);
      // Handle individual fetch failures if needed by checking responses array status
      setError('Failed to load data needed for assignments.'); // Set general error maybe
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
      setLicenses(data.licenses || []);
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
      const response = await fetch('/api/licenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add license');
      }
      const savedData = await response.json();
      const new_license = savedData.license as License;
      setLicenses(prev => [...prev, new_license]);
      setIsAddModalOpen(false);

    } catch (err) {
      console.error("Failed to save license:", err);
      throw err;
    }
  };

  const handleUpdateLicense = async (formData: Record<string, any>) => {
    try {
      if (!formData.license_id) { // Simpler check, as selected_license is also checked later implicitly
        throw new Error('License ID is required for update.');
      }

      // Create a clean payload with only expected fields for a license
      const updatePayload: any = {
        license_id: formData.license_id,
        software_id: formData.software_id ? Number(formData.software_id) : null, // Ensure software_id is number
        license_name: formData.license_name || null,
        license_description: formData.license_description || null,
        license_number: formData.license_number || null,
        dongle_number: formData.dongle_number || null,
        activation_key: formData.activation_key || null,
        system_id: formData.system_id || null,
        license_user: formData.license_user || null,
        owner: formData.owner || null,
        license_type: formData.license_type || null,
        remarks: formData.remarks || null,
      };

      // Format maintenance_end to YYYY-MM-DD
      if (formData.maintenance_end) {
        try {
          const date = new Date(formData.maintenance_end);
          if (!isNaN(date.getTime())) {
            updatePayload.maintenance_end = date.toISOString().split('T')[0];
          } else {
            updatePayload.maintenance_end = null;
          }
        } catch (e) {
          console.warn('Could not parse maintenance_end, setting to null:', formData.maintenance_end, e);
          updatePayload.maintenance_end = null;
        }
      } else {
        updatePayload.maintenance_end = null; // Ensure empty/undefined becomes null
      }

      // Validate required fields in the payload
      if (updatePayload.software_id === null) {
          throw new Error('Software ID (software_id) is required for update.');
      }

      const response = await fetch('/api/licenses', { 
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatePayload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response for license update' }));
        console.error('Failed to update license:', errorData);
        throw new Error(errorData.error || `HTTP error ${response.status} during license update`);
      }
      
      const result = await response.json();
      const updated_license = result.license as License;

      if (result.success && updated_license) {
        setLicenses(prev =>
          prev.map(lic =>
            lic.license_id === updated_license.license_id ? updated_license : lic
          )
        );
        // If the updated license is the one currently selected, update selected_license
        // This ensures the modal reflects the changes IF it stays open (e.g. for assignment section)
        if (selected_license?.license_id === updated_license.license_id) {
            setSelectedLicense(updated_license); 
        }
        // The ManageLicenseAssignment component should handle its own state and closing the modal if needed.
        // We don't close the main modal here to allow assignment to proceed.

      } else {
        throw new Error(result.error || 'API did not return success or updated license data.');
      }

      // Assignment logic (from ManageLicenseAssignment component) will be handled separately by that component after this function resolves successfully.
      // The main modal will stay open if the ManageLicenseAssignment component logic dictates it.
      // If there's no assignment component or logic, the modal should be closed by its own onSave handler completing.
      // For now, assume ManageLicenseAssignment is a child and will react to selected_license update or trigger modal close.

    } catch (err: any) {
      console.error("Error in handleUpdateLicense:", err);
      throw err; 
    }
  };

  const handleRowClick = async (license: License) => {
    setSelectedLicense(license);
    // fetchRelatedData(); // Already called on mount, ensure all_pcs/all_vms are populated
    // No need to fetch current assignment separately, it's part of the License object from /api/licenses
  };

  const getSoftwareName = (id: number | undefined): string => {
    if (id === undefined) return 'N/A';
    if (software.length === 0 && loading) return 'Loading Software...'; // Add loading check
    return software.find(s => s.software_id === id)?.software_name || 'Unknown Software';
  };

  // Define fields for the Add Entry Modal (snake_case)
  const addEntryFields: ModalField[] = [
    {
      name: 'software_id',
      label: 'Software',
      type: 'select',
      required: true,
      options: [
        { value: '', label: 'Select Software' },
        ...software.map(s => ({ value: String(s.software_id), label: `${s.software_name}${s.major_version ? ' ('+s.major_version+')' : ''}` }))
      ]
    },
    { name: 'license_name', label: 'License Name', type: 'text' },
    { name: 'license_description', label: 'Description', type: 'text' },
    { name: 'license_number', label: 'License Number/Key', type: 'text' },
    { name: 'dongle_number', label: 'Dongle Number', type: 'text' },
    { name: 'activation_key', label: 'Activation Key', type: 'text' },
    { name: 'system_id', label: 'System ID', type: 'text' },
    { name: 'license_user', label: 'User', type: 'text' },
    { name: 'maintenance_end', label: 'Maintenance End', type: 'date' },
    { name: 'owner', label: 'Owner', type: 'text' },
    { name: 'license_type', label: 'License Type', type: 'text' },
    { name: 'remarks', label: 'Remarks', type: 'text' },
  ];

  // Define fields for the Editable Details Modal (snake_case)
  const detailsFields: ModalField[] = [
    { name: 'license_id', label: 'License ID', type: 'number', editable: false },
    {
      name: 'software_id',
      label: 'Software',
      type: 'select',
      required: true,
      editable: true,
      options: [
          { value: '', label: 'Select Software' },
          ...software.map(s => ({ value: String(s.software_id), label: `${s.software_name}${s.major_version ? ' ('+s.major_version+')' : ''}` }))
      ]
    },
    { name: 'license_name', label: 'License Name', type: 'text', editable: true },
    { name: 'license_description', label: 'Description', type: 'text', editable: true },
    { name: 'license_number', label: 'License Number/Key', type: 'text', editable: true },
    { name: 'dongle_number', label: 'Dongle Number', type: 'text', editable: true },
    { name: 'activation_key', label: 'Activation Key', type: 'text', editable: true },
    { name: 'system_id', label: 'System ID', type: 'text', editable: true },
    { name: 'license_user', label: 'User', type: 'text', editable: true },
    { name: 'maintenance_end', label: 'Maintenance End', type: 'date', editable: true },
    { name: 'owner', label: 'Owner', type: 'text', editable: true },
    { name: 'license_type', label: 'License Type', type: 'text', editable: true },
    { name: 'remarks', label: 'Remarks', type: 'text', editable: true },
  ];

  // --- Handlers for Assigning/Unassigning License ---
  const handleAssignLicenseWrapper = async (license_id_to_assign: number, target_type: 'pc' | 'vm', target_id: number) => {
    setLoading(true); // Use main loading state or a specific one for this operation
    setError(null);

    const endpoint = `/api/licenses/${license_id_to_assign}/assignment`;
    let requestBody: any;

    if (target_type === 'pc') {
      requestBody = { pc_id: target_id };
    } else if (target_type === 'vm') {
      requestBody = { vm_id: target_id };
    } else {
      setError('Invalid target type for assignment');
      setLoading(false);
      const err = new Error('Invalid target type for assignment');
      console.error(err);
      throw err; // Re-throw for ManageLicenseAssignment to catch
    }

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        let errorData = { error: 'Failed to assign license due to server error.' };
        try {
          errorData = await response.json();
        } catch (parseError) {
          console.error('Failed to parse error response from server:', parseError);
          // const textError = await response.text(); // Uncomment for further debugging if needed
          // console.error('Server response text:', textError);
        }
        throw new Error(errorData.error || `Failed to assign license. Status: ${response.status}`);
      }
      
      // Successfully assigned, now refresh data
      await fetchData(); // Refreshes the main licenses list

      // If the currently selected license is the one being assigned, 
      // we need to update `selected_license` to reflect the new assignment details.
      if (selected_license && selected_license.license_id === license_id_to_assign) {
        // The POST request to /api/licenses/[id]/assignment now returns the updated assignment.
        // We can use this, or re-fetch the license details. 
        // For simplicity and to ensure we have the freshest full license object (including software_name etc.),
        // let's re-fetch the specific license or find it in the updated `licenses` list.

        // Option 1: Find in the already re-fetched `licenses` list by fetchData()
        // `licenses` state should be updated by `fetchData()` by this point.
        // Need to ensure `fetchData` completes and sets state before trying to find.
        // However, direct access to `licenses` here might get stale closure value.
        // A safer way is to get fresh full list and then find, or fetch the specific license.

        const updated_licenses_list_response = await fetch('/api/licenses');
        if (!updated_licenses_list_response.ok) {
            console.warn('Failed to fetch updated licenses list after assignment for selected_license refresh.');
        } else {
            const updated_licenses_list_data = await updated_licenses_list_response.json();
            const refreshed_selected_license = updated_licenses_list_data.licenses?.find((l: License) => l.license_id === license_id_to_assign);
            if (refreshed_selected_license) {
                setSelectedLicense(refreshed_selected_license); // Update the modal details
            }
        }
      }

      // const assignmentResult = await response.json(); // This line would fail if response.ok is false and body is not json
      // console.log('Assignment successful, API response:', assignmentResult); // For debugging the successful response structure

    } catch (err) {
      console.error(`Error assigning license ${license_id_to_assign} to ${target_type} ${target_id}:`, err);
      const errorMessage = err instanceof Error ? err.message : 'Could not assign license.';
      setError(errorMessage);
      throw err; // Re-throw for ManageLicenseAssignment to catch in its actionError
    } finally {
      setLoading(false);
    }
  };

  const handleUnassignLicenseWrapper = async (license_id_to_unassign: number) => {
    setLoading(true);
    setError(null);
    try {
      // This API should clear the assignment for the given license_id
      const response = await fetch(`/api/licenses/${license_id_to_unassign}/assignment`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to unassign license');
      }
      // Refresh data
      await fetchData(); // Refreshes the main list
      if (selected_license && selected_license.license_id === license_id_to_unassign) {
        // If the currently selected license is the one being unassigned, refresh its details
        const updated_licenses_list = await (await fetch('/api/licenses')).json();
        const refreshed_selected_license = updated_licenses_list.licenses.find((l: License) => l.license_id === license_id_to_unassign);
        if (refreshed_selected_license) {
            setSelectedLicense(refreshed_selected_license);
        } else {
            setSelectedLicense(null); // It might have been deleted or no longer accessible
        }
      }
    } catch (err) {
      console.error(`Error unassigning license ${license_id_to_unassign}:`, err);
      setError(err instanceof Error ? err.message : 'Could not unassign license.');
      throw err; // Re-throw for ManageLicenseAssignment to catch
    } finally {
      setLoading(false);
    }
  };
  // --- End Assignment Handlers ---

  // --- Styles --- (Includes common styles and specific ones for assignment)
  const styles: { [key: string]: CSSProperties } = {
    headerContainer: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' },
    headerTitleContainer: { display: 'flex', alignItems: 'center' },
    headerIcon: { color: '#0F3460', marginRight: '1rem' },
    headerTitle: { fontSize: '1.75rem', fontWeight: 'bold', color: '#0F3460', margin: 0 },
    addButton: { 
        border: 'none', 
        borderRadius: '0.375rem', 
        padding: '0.5rem 0.75rem', 
        cursor: 'pointer', 
        display: 'flex', 
        alignItems: 'center', 
        fontSize: '0.875rem', 
        fontWeight: 500, 
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)', 
        backgroundColor: '#39A2DB',
        color: 'white' 
    },
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
    assignmentTitle: { fontSize: '1.25rem', fontWeight: 'bold', color: '#0F3460', marginBottom: '1rem' },
    noDataCell: { padding: '2rem', textAlign: 'center', color: '#6b7280' },
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
                <th style={styles.tableHeaderCell}>License Name</th>
                <th style={styles.tableHeaderCell}>Software</th>
                <th style={styles.tableHeaderCell}>Assigned To</th>
                <th style={styles.tableHeaderCell}>Assigned Type</th>
                <th style={styles.tableHeaderCell}>License Number</th>
                <th style={styles.tableHeaderCell}>Type</th>
                <th style={styles.tableHeaderCell}>Maintenance End</th>
                <th style={styles.tableHeaderCell}>Owner</th>
              </tr>
            </thead>
            <tbody>
              {licenses.length === 0 ? (
                <tr><td colSpan={8} style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>No licenses found.</td></tr>
              ) : (
                licenses.map((license) => (
                  <tr 
                    key={license.license_id} 
                    style={styles.tableBodyRow} 
                    onClick={() => handleRowClick(license)}
                    onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#f9fafb'; }}
                    onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    <td style={styles.tableBodyCell}>{license.license_name ?? 'N/A'}</td>
                    <td style={styles.tableBodyCell}>{license.software_name ?? getSoftwareName(license.software_id)}</td>
                    <td style={styles.tableBodyCell}>{license.assigned_to_name ?? '-'}</td>
                    <td style={styles.tableBodyCell}>{license.assigned_to_type ?? '-'}</td>
                    <td style={styles.tableBodyCell}>{license.license_number ?? '-'}</td>
                    <td style={styles.tableBodyCell}>{license.license_type ?? '-'}</td>
                    <td style={styles.tableBodyCell}>{license.maintenance_end ? new Date(license.maintenance_end).toLocaleDateString() : '-'}</td>
                    <td style={styles.tableBodyCell}>{license.owner ?? '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Modals */}
      {selected_license && (
        <EditableDetailsModal
          isOpen={!!selected_license}
          onClose={() => {
            setSelectedLicense(null);
            setError(null); // Clear general error
            // No separate assignment_error to clear here as it's handled by child
          }}
          data={selected_license} // Contains assigned_to_type, assigned_to_name, assigned_to_id
          fields={detailsFields} // These are for editing license properties, not assignment
          onSave={handleUpdateLicense} // This handles updates to license properties
          title={`Edit License: ${selected_license.license_name || selected_license.license_key}`}
        >
          {/* License Assignment Section using the new component */}
          <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #e9ecef' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#343a40', marginBottom: '1rem' }}>
              Manage License Assignment
            </h3>
            <ManageLicenseAssignment
              license_id={selected_license.license_id}
              license_name={selected_license.license_name || selected_license.license_key}
              all_pcs={all_pcs}
              all_vms={all_vms}
              current_assignment_details={selected_license} // The selected_license object itself contains assignment info from the main GET /api/licenses
              on_assign={handleAssignLicenseWrapper}
              on_unassign={handleUnassignLicenseWrapper}
              is_loading={loading} // Use the main list loading state for now, or a more specific one if needed
              error={error}       // Pass the main list error state
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