'use client';

import React, { useState, useMemo } from 'react';
// Removed License import as all_licenses is removed
import { XCircle, RefreshCw, Ban } from 'lucide-react';

// Use the same interface defined in PcOverviewList (now snake_case)
interface AssignedLicenseInfo {
    license_id: number;
    license_name: string | null;
    license_type: string | null;
    software_name: string;
    major_version: string | null;
    assigned_on: string | null; 
}

interface ManagePCLicenseAssignmentsProps {
  pc_id: number; 
  assigned_licenses: AssignedLicenseInfo[];
  // on_assign removed
  on_unassign: (license_id: number) => Promise<void>; 
  is_loading: boolean; 
  error: string | null;  
  isReadOnly?: boolean;
}

export default function ManagePCLicenseAssignments({
  pc_id,
  // all_licenses removed
  assigned_licenses,
  // on_assign removed
  on_unassign,
  is_loading, 
  error,      
  isReadOnly
}: ManagePCLicenseAssignmentsProps) {

  // Removed selectedLicenseToAdd state
  const [actionLoading, setActionLoading] = useState<boolean>(false); 
  const [actionError, setActionError] = useState<string | null>(null);  

  const assignedLicenseIds = useMemo(() => {
    return assigned_licenses.map(l => l.license_id);
  }, [assigned_licenses]);

  // Removed availableLicenseOptions
  // Removed handleAssignLicense

  const handleUnassignClick = async (license_id: number) => {
    if (isReadOnly) return;
    setActionLoading(true);
    setActionError(null);
    try {
      await on_unassign(license_id);
      // Parent should refetch assigned_licenses
    } catch (err) {
      console.error("Unassign license failed:", err);
      setActionError(err instanceof Error ? err.message : 'Failed to unassign license');
    } finally {
      setActionLoading(false);
    }
  };

  // Display parent loading or error if present (e.g., initial load of assigned items)
  if (is_loading && !actionLoading) return <p>Loading assigned licenses...</p>; // Show parent loading if no action is active
  if (error && !actionError) return <p style={{ color: 'red' }}>Error: {error}</p>; 

  return (
    <div>
      {/* Add License Section REMOVED */}

      {/* Display Action Error if any (only for unassign now) */}
      {actionError && <p style={{ color: 'red', fontSize: '0.875rem', marginTop: '0.5rem' }}>{actionError}</p>}

      {/* List of Assigned Licenses */}
      {assigned_licenses.length === 0 && !actionError ? (
        <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>No licenses currently assigned to this PC.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, maxHeight: '150px', overflowY: 'auto' }}>
          {assigned_licenses.map((license) => (
            <li 
              key={license.license_id}
              style={{
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: '0.5rem 0.25rem', 
                borderBottom: '1px solid #e5e7eb',
                fontSize: '0.875rem' 
              }}
            >
              <div>
                <span style={{ fontWeight: '500' }}>{license.software_name || 'Unknown Software'}{license.major_version ? ` (${license.major_version})` : ''}</span>
                <span style={{ color: '#6b7280' }}> - {license.license_name || `ID: ${license.license_id}`} ({license.license_type || 'N/A'})</span>
                {license.assigned_on && 
                  <span style={{ color: '#6b7280', fontSize: '0.8rem', marginLeft: '0.5rem' }}>
                    (Assigned: {new Date(license.assigned_on).toLocaleDateString()})
                  </span>
                }
              </div>
              <button
                onClick={() => handleUnassignClick(license.license_id)}
                disabled={actionLoading || isReadOnly}
                title={isReadOnly ? "Read-only: Cannot unassign license" : "Unassign License"}
                style={{
                  background: 'none',
                  border: 'none',
                  color: (actionLoading || isReadOnly) ? '#9ca3af' : '#dc2626', 
                  cursor: (actionLoading || isReadOnly) ? 'not-allowed' : 'pointer',
                  padding: '0.25rem'
                }}
              >
                {isReadOnly ? <Ban size={18} /> : 
                  (actionLoading && assignedLicenseIds.includes(license.license_id) ? 
                    <RefreshCw size={18} style={{ animation: 'spin 1s linear infinite' }} /> : 
                    <XCircle size={18} />
                  )
                }
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
} 