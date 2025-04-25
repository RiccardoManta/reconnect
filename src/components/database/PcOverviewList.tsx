'use client';

import React, { useState } from 'react';
import { PcCase, RefreshCw, Plus } from 'lucide-react';
import EditableDetailsModal from '../EditableDetailsModal';
import AddEntryModal from '../AddEntryModal';
import { PcOverview, TestBench, Software, License } from '../../types/database';
import { keysToCamel, keysToSnake } from '../../utils/caseConverter';
import ManagePCSwAssignments from './ManagePCSwAssignments';
import ManagePCLicenseAssignments from './ManagePCLicenseAssignments';

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

// Add type definition for assigned license data (matches API response)
interface AssignedLicenseInfo {
    licenseId: number;
    licenseName: string | null;
    licenseType: string | null;
    softwareName: string;
    majorVersion: string | null;
    assignedOn: string | null; 
}

export default function PcOverviewList() {
  const [pcOverviews, setPcOverviews] = useState<PcOverview[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPc, setSelectedPc] = useState<PcOverview | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [testBenches, setTestBenches] = useState<TestBench[]>([]); // For dropdown

  // State for software relationship management
  const [allSoftware, setAllSoftware] = useState<Software[]>([]);
  const [assignedSoftwareIds, setAssignedSoftwareIds] = useState<number[]>([]);
  const [assignmentLoading, setAssignmentLoading] = useState(false);
  const [assignmentError, setAssignmentError] = useState<string | null>(null);

  // State for license assignment management
  const [assignedLicenses, setAssignedLicenses] = useState<AssignedLicenseInfo[]>([]);
  const [licenseAssignmentLoading, setLicenseAssignmentLoading] = useState(false);
  const [licenseAssignmentError, setLicenseAssignmentError] = useState<string | null>(null);

  const fetchRelatedData = async () => {
    try {
      const [tbResponse, swResponse] = await Promise.all([
        fetch('/api/testbenches'),
        fetch('/api/software') // Fetch all software
      ]);

      if (tbResponse.ok) {
        const tbData = await tbResponse.json();
        setTestBenches(keysToCamel<TestBench[]>(tbData.testBenches || []));
      } else {
        console.error('Failed to fetch test benches for dropdown');
        setTestBenches([]);
      }

      if (swResponse.ok) {
        const swData = await swResponse.json();
        setAllSoftware(keysToCamel<Software[]>(swData.software || [])); // Store all software
      } else {
        console.error('Failed to fetch software for assignment');
        setAllSoftware([]);
      }
    } catch (err) {
      console.error('Error fetching related data (benches/software):', err);
      setTestBenches([]);
      setAllSoftware([]);
    }
  };

  const fetchAssignedSoftware = async (pcId: number) => {
    setAssignmentLoading(true);
    setAssignmentError(null);
    try {
      const response = await fetch(`/api/pcs/${pcId}/software`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch assigned software');
      }
      const data = await response.json();
      const assignments = data.softwareAssignments || [];
      if (!Array.isArray(assignments)) {
        console.error("softwareAssignments received from API is not an array:", assignments);
        setAssignedSoftwareIds([]);
      } else {
        setAssignedSoftwareIds(assignments.map((a: any) => a.software_id));
      }
    } catch (err) {
      console.error(`Error fetching assigned software for PC ${pcId}:`, err);
      setAssignmentError('Failed to load assigned software.');
      setAssignedSoftwareIds([]); // Clear on error
    } finally {
      setAssignmentLoading(false);
    }
  };

  const fetchAssignedLicenses = async (pcId: number) => {
    setLicenseAssignmentLoading(true);
    setLicenseAssignmentError(null);
    try {
      const response = await fetch(`/api/pcs/${pcId}/licenses`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch assigned licenses');
      }
      const data = await response.json();
      const licenses = data.assignedLicenses || [];
      if (!Array.isArray(licenses)) {
        console.error("assignedLicenses received from API is not an array:", licenses);
        setAssignedLicenses([]);
      } else {
        setAssignedLicenses(licenses);
      }      
    } catch (err) {
      console.error(`Error fetching assigned licenses for PC ${pcId}:`, err);
      setLicenseAssignmentError('Failed to load assigned licenses.');
      setAssignedLicenses([]); // Clear on error
    } finally {
      setLicenseAssignmentLoading(false);
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

  const handleRowClick = async (pc: PcOverview) => {
    setSelectedPc(pc);
    await fetchRelatedData();
    if (pc.pcId !== undefined) {
        await fetchAssignedSoftware(pc.pcId);
        await fetchAssignedLicenses(pc.pcId);
    }
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
      const newPc = keysToCamel<PcOverview>(savedData.pc || savedData.pcOverview);
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
      const updatedPc = keysToCamel<PcOverview>(data.pc);

      if (updatedPc) {
        setPcOverviews(prev =>
          prev.map(pc =>
            pc.pcId === updatedPc.pcId ? updatedPc : pc
          )
        );
        setSelectedPc(updatedPc);
      } else {
        console.error("Failed to get updated PC data from API response:", data);
        throw new Error("Failed to process update response from server.");
      }

    } catch (err) {
      console.error("Failed to update PC overview:", err);
      throw err;
    }
  };

  // --- Handlers for Assigning/Unassigning Software --- 
  const handleAssignSoftware = async (softwareId: number) => {
    if (!selectedPc?.pcId) {
      console.error("Cannot assign software: No PC selected.");
      // Optionally set an error state to display to the user
      setAssignmentError("Cannot assign software: No PC selected.");
      return; // Early exit
    }
    setAssignmentLoading(true); // Indicate loading for this action
    setAssignmentError(null);
    try {
      const response = await fetch(`/api/pcs/${selectedPc.pcId}/software`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ software_id: softwareId }), // Send snake_case
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to assign software');
      }

      // Update local state immediately for responsiveness
      setAssignedSoftwareIds(prev => [...prev, softwareId].sort((a, b) => a - b));

    } catch (err) {
      console.error("Failed to assign software:", err);
      const errorMsg = `Error assigning software: ${err instanceof Error ? err.message : String(err)}`;
      setAssignmentError(errorMsg);
      // Re-throw or handle otherwise if the sub-component needs to know about the error
    } finally {
      setAssignmentLoading(false);
    }
  };

  const handleUnassignSoftware = async (softwareId: number) => {
    if (!selectedPc?.pcId) {
      console.error("Cannot unassign software: No PC selected.");
      setAssignmentError("Cannot unassign software: No PC selected.");
      return; // Early exit
    }
    
    // Optional: Confirmation dialog before deleting
    // if (!confirm(`Are you sure you want to remove software ID ${softwareId} from this PC?`)) {
    //   return;
    // }

    setAssignmentLoading(true); // Indicate loading for this action
    setAssignmentError(null);
    try {
      const response = await fetch(`/api/pcs/${selectedPc.pcId}/software/${softwareId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to unassign software');
      }

      // Update local state immediately
      setAssignedSoftwareIds(prev => prev.filter(id => id !== softwareId));

    } catch (err) {
      console.error("Failed to unassign software:", err);
      const errorMsg = `Error unassigning software: ${err instanceof Error ? err.message : String(err)}`;
      setAssignmentError(errorMsg);
      // Re-throw or handle otherwise
    } finally {
      setAssignmentLoading(false);
    }
  };
  // --- End Assignment Handlers ---

  // Define fields using camelCase names
  const addEntryFields: ModalField[] = [
    {
      name: 'benchId',
      label: 'Test Bench (Optional)',
      type: 'select',
      required: false,
      options: [
        { value: '', label: 'None' },
        ...testBenches.map(tb => ({ value: String(tb.benchId), label: tb.hilName }))
      ]
    },
    { name: 'pcName', label: 'PC Name', type: 'text' },
    { name: 'casualName', label: 'Casual Name', type: 'text' },
    { name: 'purchaseYear', label: 'Purchase Year', type: 'number' },
    { name: 'inventoryNumber', label: 'Inventory Number', type: 'text' },
    { name: 'pcRole', label: 'PC Role', type: 'text' },
    { name: 'pcModel', label: 'PC Model', type: 'text' },
    { name: 'specialEquipment', label: 'Special Equipment', type: 'text' },
    { name: 'macAddress', label: 'MAC Address', type: 'text' },
    { name: 'ipAddress', label: 'IP Address', type: 'text' },
    { name: 'pcInfoText', label: 'PC Info Text', type: 'text' },
    { name: 'status', label: 'Status', type: 'text' },
    { name: 'activeUser', label: 'Active User', type: 'text' },
  ];

  const detailsFields: ModalField[] = [
    { name: 'pcId', label: 'PC ID', type: 'number', editable: false },
    {
      name: 'benchId',
      label: 'Test Bench (Optional)',
      type: 'select',
      required: false,
      editable: true,
      options: [
        { value: '', label: 'None' },
        ...testBenches.map(tb => ({ value: String(tb.benchId), label: tb.hilName }))
      ]
    },
    { name: 'pcName', label: 'PC Name', type: 'text', editable: true },
    { name: 'casualName', label: 'Casual Name', type: 'text', editable: true },
    { name: 'purchaseYear', label: 'Purchase Year', type: 'number', editable: true },
    { name: 'inventoryNumber', label: 'Inventory Number', type: 'text', editable: true },
    { name: 'pcRole', label: 'PC Role', type: 'text', editable: true },
    { name: 'pcModel', label: 'PC Model', type: 'text', editable: true },
    { name: 'specialEquipment', label: 'Special Equipment', type: 'text', editable: true },
    { name: 'macAddress', label: 'MAC Address', type: 'text', editable: true },
    { name: 'ipAddress', label: 'IP Address', type: 'text', editable: true },
    { name: 'pcInfoText', label: 'PC Info Text', type: 'text', editable: true },
    { name: 'status', label: 'Status', type: 'text', editable: true },
    { name: 'activeUser', label: 'Active User', type: 'text', editable: true },
  ];

  // Helper object for table styles (optional, keeps JSX cleaner)
  const styles = {
    th: { padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563' } as React.CSSProperties,
    td: { padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827' } as React.CSSProperties,
    tr: { borderBottom: '1px solid #e5e7eb', transition: 'background-color 0.2s', cursor: 'pointer' } as React.CSSProperties,
    tdCenter: { padding: '2rem', textAlign: 'center', color: '#6b7280' } as React.CSSProperties,
  };

  // --- Handlers for Assigning/Unassigning Licenses from PC view ---
  const handleUnassignLicense = async (licenseId: number) => {
    if (!selectedPc?.pcId) {
      setLicenseAssignmentError("Cannot unassign: No PC selected.");
      return;
    }
    // Optional: Confirmation
    // if (!confirm('Are you sure you want to unassign this license from this PC?')) return;

    setLicenseAssignmentLoading(true); // Use the specific loading state for this section
    setLicenseAssignmentError(null);
    try {
        const response = await fetch(`/api/licenses/${licenseId}/assignment`, {
            method: 'DELETE',
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to unassign license');
        }
        // Success! Refetch the licenses for this PC to update the list
        await fetchAssignedLicenses(selectedPc.pcId);
    } catch (err) {
        const errorMsg = `Error unassigning license: ${err instanceof Error ? err.message : String(err)}`;
        console.error(errorMsg);
        setLicenseAssignmentError(errorMsg); // Set the specific error state
    } finally {
        setLicenseAssignmentLoading(false); // Clear the specific loading state
    }
  };
  // --- End License Assignment Handlers ---

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
                  <th style={styles.th}>ID</th>
                  <th style={styles.th}>PC Name</th>
                  <th style={styles.th}>Casual Name</th>
                  <th style={styles.th}>Role</th>
                  <th style={styles.th}>Model</th>
                  <th style={styles.th}>IP Address</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Active User</th>
                  <th style={styles.th}>Test Bench</th>
                </tr>
              </thead>
              <tbody>
                {pcOverviews.length === 0 ? (
                  <tr><td colSpan={9} style={styles.tdCenter}>No PC overviews found</td></tr>
                ) : (
                  pcOverviews.map((pc) => {
                    const benchName = testBenches.find(tb => tb.benchId === pc.benchId)?.hilName || 'N/A';

                    return (
                      <tr key={pc.pcId} style={styles.tr}
                          onClick={() => handleRowClick(pc)}
                          onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#f9fafb'; }}
                          onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
                        <td style={styles.td}>{pc.pcId}</td>
                        <td style={styles.td}>{pc.pcName || '-'}</td>
                        <td style={styles.td}>{pc.casualName || '-'}</td>
                        <td style={styles.td}>{pc.pcRole || '-'}</td>
                        <td style={styles.td}>{pc.pcModel || '-'}</td>
                        <td style={styles.td}>{pc.ipAddress || '-'}</td>
                        <td style={styles.td}>{pc.status || '-'}</td>
                        <td style={styles.td}>{pc.activeUser || '-'}</td>
                        <td style={styles.td}>{benchName}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
      )}

      {selectedPc && (
        <EditableDetailsModal
          isOpen={selectedPc !== null}
          onClose={() => {
            setSelectedPc(null);
            setAssignedSoftwareIds([]);
            setAssignmentError(null);
            setAssignedLicenses([]);
            setLicenseAssignmentError(null);
          }}
          title={`PC Details: ${selectedPc.pcName || selectedPc.casualName || `ID ${selectedPc.pcId}`}`}
          data={selectedPc}
          fields={detailsFields}
          onSave={handleUpdatePc}
        >
          {/* DEBUG: Log state before rendering children */}
          {/* {(() => { // REMOVE
            console.log('[DEBUG] Rendering modal children. States:', {
               selectedPcId: selectedPc?.pcId,
               allSoftwareLength: allSoftware?.length,
               assignedSoftwareIds,
               assignedLicenses,
               isSoftLoading: assignmentLoading,
               isLicLoading: licenseAssignmentLoading,
             });
             return null; // Return null to satisfy ReactNode requirement
          })()} */}

          <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #e5e7eb' }}>
            <h3 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '1.1rem', fontWeight: '600' }}>
              Assigned Software
            </h3>
            {selectedPc?.pcId !== undefined ? (
              <ManagePCSwAssignments
                pcId={selectedPc.pcId}
                allSoftware={allSoftware}
                assignedSoftwareIds={assignedSoftwareIds}
                onAssign={handleAssignSoftware}
                onUnassign={handleUnassignSoftware}
                isLoading={assignmentLoading}
                error={assignmentError}
              />
            ) : (
              <p>Cannot manage software: PC ID is missing.</p>
            )}
          </div>

          <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #e5e7eb' }}>
            <h3 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '1.1rem', fontWeight: '600' }}>
              Assigned Licenses
            </h3>
            <ManagePCLicenseAssignments
              assignedLicenses={assignedLicenses}
              isLoading={licenseAssignmentLoading}
              error={licenseAssignmentError}
              onUnassign={handleUnassignLicense}
            />
          </div>
        </EditableDetailsModal>
      )}

      {isAddModalOpen && (
        <AddEntryModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Add New PC Overview"
          fields={addEntryFields}
          onSave={handleSaveEntry}
        />
      )}
    </div>
  );
} 