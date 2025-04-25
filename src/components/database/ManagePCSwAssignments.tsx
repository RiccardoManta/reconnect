import React, { useState, useMemo } from 'react';
import { Software } from '../../types/database';
import { PlusCircle, XCircle, RefreshCw } from 'lucide-react';

interface ManagePCSwAssignmentsProps {
  pcId: number;
  allSoftware: Software[];
  assignedSoftwareIds: number[];
  onAssign: (softwareId: number) => Promise<void>;
  onUnassign: (softwareId: number) => Promise<void>;
  isLoading: boolean; // Loading state for assign/unassign actions
  error: string | null;   // Error message for assign/unassign actions
}

const ManagePCSwAssignments: React.FC<ManagePCSwAssignmentsProps> = ({
  pcId,
  allSoftware,
  assignedSoftwareIds,
  onAssign,
  onUnassign,
  isLoading,
  error
}) => {
  const [selectedSoftwareToAdd, setSelectedSoftwareToAdd] = useState<string>(''); // Store ID as string for select

  // Memoize calculations for performance
  const assignedSoftwareDetails = useMemo(() => {
    return allSoftware
      .filter(sw => assignedSoftwareIds.includes(sw.softwareId))
      .sort((a, b) => a.softwareName.localeCompare(b.softwareName));
  }, [allSoftware, assignedSoftwareIds]);

  const availableSoftwareOptions = useMemo(() => {
    return allSoftware
      .filter(sw => !assignedSoftwareIds.includes(sw.softwareId))
      .sort((a, b) => a.softwareName.localeCompare(b.softwareName))
      .map(sw => ({ 
        value: String(sw.softwareId), 
        label: `${sw.softwareName}${sw.majorVersion ? ' (' + sw.majorVersion + ')' : ''}` 
      }));
  }, [allSoftware, assignedSoftwareIds]);

  const handleAddSoftware = async () => {
    if (!selectedSoftwareToAdd) return;
    const softwareId = parseInt(selectedSoftwareToAdd, 10);
    if (isNaN(softwareId)) return;
    
    await onAssign(softwareId);
    setSelectedSoftwareToAdd(''); // Reset dropdown after assigning
  };

  return (
    <div>
      {/* Add Software Section */}
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '1rem' }}>
        <select
          value={selectedSoftwareToAdd}
          onChange={(e) => setSelectedSoftwareToAdd(e.target.value)}
          disabled={isLoading}
          style={{
            flexGrow: 1,
            padding: '0.5rem',
            borderRadius: '0.25rem',
            border: '1px solid #d1d5db',
            fontSize: '0.875rem',
          }}
        >
          <option value="">Select software to add...</option>
          {availableSoftwareOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <button
          onClick={handleAddSoftware}
          disabled={isLoading || !selectedSoftwareToAdd}
          style={{
            padding: '0.5rem 0.75rem',
            borderRadius: '0.25rem',
            border: 'none',
            backgroundColor: (isLoading || !selectedSoftwareToAdd) ? '#9ca3af' : '#2563eb',
            color: 'white',
            fontSize: '0.875rem',
            cursor: (isLoading || !selectedSoftwareToAdd) ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem'
          }}
        >
            {isLoading ? <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }}/> : <PlusCircle size={16} />}
             Add
        </button>
      </div>

      {/* Display Error if any */}
      {error && <p style={{ color: 'red', fontSize: '0.875rem' }}>{error}</p>}

      {/* List of Assigned Software */}
      {assignedSoftwareDetails.length === 0 ? (
        <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>No software assigned.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {assignedSoftwareDetails.map(sw => (
            <li 
              key={sw.softwareId} 
              style={{
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                padding: '0.5rem 0', 
                borderBottom: '1px solid #e5e7eb'
              }}
            >
              <span>
                {sw.softwareName}
                {sw.majorVersion && ` (${sw.majorVersion})`}
                {sw.vendor && <span style={{ fontSize: '0.8rem', color: '#6b7280', marginLeft: '0.5rem' }}> - {sw.vendor}</span>}
              </span>
              <button
                onClick={() => onUnassign(sw.softwareId)}
                disabled={isLoading}
                title="Unassign Software"
                style={{
                  background: 'none',
                  border: 'none',
                  color: isLoading ? '#9ca3af' : '#dc2626', 
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  padding: '0.25rem'
                }}
              >
                <XCircle size={18} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ManagePCSwAssignments; 