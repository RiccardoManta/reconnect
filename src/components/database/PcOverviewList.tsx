'use client';

import React, { useState, useEffect, CSSProperties } from 'react';
import { PcCase as Cpu, RefreshCw, PlusCircle } from 'lucide-react';
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
        setAssignedLicenses(keysToCamel<AssignedLicenseInfo[]>(licenses));
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
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/pcs');
      if (!response.ok) {
        throw new Error('Failed to fetch PC overviews');
      }
      const data = await response.json();
      setPcOverviews(keysToCamel<PcOverview[]>(data.pcs || []));
    } catch (err) {
      setError('Error loading PC overviews: ' + (err instanceof Error ? err.message : String(err)));
      console.error('Error fetching PC overviews:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    const loadInitialData = async () => {
      await fetchData(); // Fetch main PC list
      await fetchRelatedData(); // Fetch related benches and software
    };
    loadInitialData();
  }, []);

  const handleAddClick = () => {
    setIsAddModalOpen(true);
  };

  const handleRowClick = async (pc: PcOverview) => {
    setSelectedPc(pc);
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
      const updatedPc = keysToCamel<PcOverview>(data.pc || data.pcOverview);

      if (updatedPc) {
        setPcOverviews(prev =>
          prev.map(pc =>
            pc.pcId === updatedPc.pcId ? updatedPc : pc
          )
        );
        if (selectedPc?.pcId === updatedPc.pcId) {
             setSelectedPc(updatedPc);
        }
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
      setAssignmentError("Cannot assign software: No PC selected.");
      return;
    }
    setAssignmentLoading(true);
    setAssignmentError(null);
    try {
      const response = await fetch(`/api/pcs/${selectedPc.pcId}/software`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ softwareId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to assign software');
      }

      setAssignedSoftwareIds(prev => [...prev, softwareId]);

    } catch (err) {
      console.error("Failed to assign software:", err);
      const errorMsg = `Error assigning software: ${err instanceof Error ? err.message : String(err)}`;
      setAssignmentError(errorMsg);
    } finally {
      setAssignmentLoading(false);
    }
  };

  const handleUnassignSoftware = async (softwareId: number) => {
    if (!selectedPc?.pcId) {
      console.error("Cannot unassign software: No PC selected.");
      setAssignmentError("Cannot unassign software: No PC selected.");
      return;
    }
    
    setAssignmentLoading(true);
    setAssignmentError(null);
    try {
      const response = await fetch(`/api/pcs/${selectedPc.pcId}/software/${softwareId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to unassign software');
      }

      setAssignedSoftwareIds(prev => prev.filter(id => id !== softwareId));

    } catch (err) {
      console.error("Failed to unassign software:", err);
      const errorMsg = `Error unassigning software: ${err instanceof Error ? err.message : String(err)}`;
      setAssignmentError(errorMsg);
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
    assignmentSection: {
        marginTop: '1.5rem',
        paddingTop: '1.5rem',
        borderTop: '1px solid #e5e7eb',
    },
    assignmentTitle: {
        fontSize: '1rem',
        fontWeight: 600,
        color: '#111827',
        marginBottom: '1rem',
    },
    assignmentList: {
        maxHeight: '200px',
        overflowY: 'auto',
        border: '1px solid #e5e7eb',
        borderRadius: '0.375rem',
        padding: '0.5rem',
    },
    assignmentItem: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0.5rem 0.75rem',
        fontSize: '0.875rem',
        borderBottom: '1px solid #f3f4f6',
    },
    assignmentItemLast: {
        borderBottom: 'none',
    },
    assignmentDetails: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.1rem'
    },
    assignmentTextMuted: {
        fontSize: '0.75rem',
        color: '#6b7280',
    }
  };

  // --- Handlers for Assigning/Unassigning Licenses from PC view ---
  const handleUnassignLicense = async (licenseId: number) => {
    if (!selectedPc?.pcId) {
      setLicenseAssignmentError("Cannot unassign: No PC selected.");
      return;
    }
    setLicenseAssignmentLoading(true);
    setLicenseAssignmentError(null);
    try {
        const response = await fetch(`/api/pcs/${selectedPc.pcId}/licenses/${licenseId}`, {
            method: 'DELETE',
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to unassign license');
        }
        await fetchAssignedLicenses(selectedPc.pcId);
    } catch (err) {
        const errorMsg = `Error unassigning license: ${err instanceof Error ? err.message : String(err)}`;
        console.error(errorMsg);
        setLicenseAssignmentError(errorMsg);
    } finally {
        setLicenseAssignmentLoading(false);
    }
  };
  // --- End License Assignment Handlers ---

  const getBenchName = (id: number | null | undefined): string => {
    if (id === undefined || id === null) return 'N/A';
    // Add loading check
    if (testBenches.length === 0 && loading) return 'Loading...';
    return testBenches.find(tb => tb.benchId === id)?.hilName || 'N/A';
  };

  return (
    <div>
      {/* Page Header */}
      <div style={styles.headerContainer}>
        <div style={styles.headerTitleContainer}>
          <Cpu size={28} style={styles.headerIcon} />
          <h1 style={styles.headerTitle}>PC Overview {pcOverviews.length > 0 ? `(${pcOverviews.length})` : ''}</h1>
        </div>
        <button
          onClick={handleAddClick}
          style={styles.addButton}
          title="Add new PC overview"
        >
          <PlusCircle size={18} style={{ marginRight: '0.5rem' }} />
          Add PC
        </button>
      </div>

      {/* Table Container */}
      <div style={styles.tableContainer}>
        {loading ? (
          <div style={styles.loadingContainer}>
            <RefreshCw size={24} style={styles.loadingSpinner} />
            <p style={{ margin: 0 }}>Loading PC overviews...</p>
            <style jsx>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : error ? (
          <div style={styles.errorContainer}><p>{error}</p></div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr style={styles.tableHeaderRow}>
                <th style={styles.tableHeaderCell}>ID</th>
                <th style={styles.tableHeaderCell}>Name</th>
                <th style={styles.tableHeaderCell}>Casual Name</th>
                <th style={styles.tableHeaderCell}>Inventory Nr.</th>
                <th style={styles.tableHeaderCell}>Role</th>
                <th style={styles.tableHeaderCell}>Model</th>
                <th style={styles.tableHeaderCell}>IP Address</th>
                <th style={styles.tableHeaderCell}>Status</th>
                <th style={styles.tableHeaderCell}>Active User</th>
                <th style={styles.tableHeaderCell}>Linked Bench</th>
              </tr>
            </thead>
            <tbody>
              {pcOverviews.length === 0 ? (
                <tr><td colSpan={10} style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>No PC overviews found</td></tr>
              ) : (
                pcOverviews.map((pc) => {
                  const linkedBenchName = getBenchName(pc.benchId);
                  return (
                    <tr key={pc.pcId}
                      style={styles.tableBodyRow}
                      onClick={() => handleRowClick(pc)}
                      onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#f9fafb'; }}
                      onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                    >
                      <td style={styles.tableBodyCell}>{pc.pcId}</td>
                      <td style={styles.tableBodyCell}>{pc.pcName || '-'}</td>
                      <td style={styles.tableBodyCell}>{pc.casualName || '-'}</td>
                      <td style={styles.tableBodyCell}>{pc.inventoryNumber || '-'}</td>
                      <td style={styles.tableBodyCell}>{pc.pcRole || '-'}</td>
                      <td style={styles.tableBodyCell}>{pc.pcModel || '-'}</td>
                      <td style={styles.tableBodyCell}>{pc.ipAddress || '-'}</td>
                      <td style={styles.tableBodyCell}>{pc.status || '-'}</td>
                      <td style={styles.tableBodyCell}>{pc.activeUser || '-'}</td>
                      <td style={styles.tableBodyCell}>{linkedBenchName}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Modals: Pass assignment state and handlers */} 
      {selectedPc && (
        <EditableDetailsModal
          isOpen={selectedPc !== null}
          onClose={() => setSelectedPc(null)}
          title={`PC Details: ${selectedPc.pcName || selectedPc.casualName || `ID: ${selectedPc.pcId}`}`}
          data={selectedPc}
          fields={detailsFields}
          onSave={handleUpdatePc}
        >
          {/* Add Software Assignment Section */} 
          <div style={styles.assignmentSection}>
            <ManagePCSwAssignments
                pcId={selectedPc.pcId!}
                allSoftware={allSoftware}
                assignedSoftwareIds={assignedSoftwareIds}
                onAssign={handleAssignSoftware}
                onUnassign={handleUnassignSoftware}
                isLoading={assignmentLoading}
                error={assignmentError}
            />
          </div>
          {/* Add License Assignment Section */}
           <div style={styles.assignmentSection}>
             <ManagePCLicenseAssignments
                 assignedLicenses={assignedLicenses}
                 onUnassign={handleUnassignLicense}
                 isLoading={licenseAssignmentLoading}
                 error={licenseAssignmentError}
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