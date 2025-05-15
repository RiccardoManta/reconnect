import React, { useState, useMemo } from 'react';
import { Software } from '../../types/database';
import { PlusCircle, XCircle, RefreshCw } from 'lucide-react';

interface ManagePCSwAssignmentsProps {
  pc_id: number;
  all_software: Software[];
  assigned_software_ids: number[];
  on_assign: (software_id: number) => Promise<void>;
  on_unassign: (software_id: number) => Promise<void>;
  is_loading: boolean; // Loading state for assign/unassign actions
  error: string | null;   // Error message for assign/unassign actions
}

const ManagePCSwAssignments: React.FC<ManagePCSwAssignmentsProps> = ({
  pc_id,
  all_software,
  assigned_software_ids,
  on_assign,
  on_unassign,
  is_loading,
  error
}) => {
  const [selectedSoftwareToAdd, setSelectedSoftwareToAdd] = useState<string>(''); // Store ID as string for select

  // Memoize calculations for performance
  const assignedSoftwareDetails = useMemo(() => {
    return all_software
      .filter(sw => assigned_software_ids.includes(sw.software_id))
      .sort((a, b) => a.software_name.localeCompare(b.software_name));
  }, [all_software, assigned_software_ids]);

  const availableSoftwareOptions = useMemo(() => {
    return all_software
      .filter(sw => !assigned_software_ids.includes(sw.software_id))
      .sort((a, b) => a.software_name.localeCompare(b.software_name))
      .map(sw => ({ 
        value: String(sw.software_id), 
        label: `${sw.software_name}${sw.major_version ? ' (' + sw.major_version + ')' : ''}` 
      }));
  }, [all_software, assigned_software_ids]);

  const handleAddSoftware = async () => {
    if (!selectedSoftwareToAdd) return;
    const software_id = parseInt(selectedSoftwareToAdd, 10);
    if (isNaN(software_id)) return;
    
    await on_assign(software_id);
    setSelectedSoftwareToAdd(''); // Reset dropdown after assigning
  };

  return (
    <div>
      {/* Add Software Section */}
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '1rem' }}>
        <select
          value={selectedSoftwareToAdd}
          onChange={(e) => setSelectedSoftwareToAdd(e.target.value)}
          disabled={is_loading}
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
          disabled={is_loading || !selectedSoftwareToAdd}
          style={{
            padding: '0.5rem 0.75rem',
            borderRadius: '0.25rem',
            border: 'none',
            backgroundColor: (is_loading || !selectedSoftwareToAdd) ? '#9ca3af' : '#2563eb',
            color: 'white',
            fontSize: '0.875rem',
            cursor: (is_loading || !selectedSoftwareToAdd) ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem'
          }}
        >
            {is_loading ? <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }}/> : <PlusCircle size={16} />}
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
              key={sw.software_id}
              style={{
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                padding: '0.5rem 0', 
                borderBottom: '1px solid #e5e7eb'
              }}
            >
              <span>
                {sw.software_name}
                {sw.major_version && ` (${sw.major_version})`}
                {sw.vendor && <span style={{ fontSize: '0.8rem', color: '#6b7280', marginLeft: '0.5rem' }}> - {sw.vendor}</span>}
              </span>
              <button
                onClick={() => on_unassign(sw.software_id)}
                disabled={is_loading}
                title="Unassign Software"
                style={{
                  background: 'none',
                  border: 'none',
                  color: is_loading ? '#9ca3af' : '#dc2626', 
                  cursor: is_loading ? 'not-allowed' : 'pointer',
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