'use client';

import React, { useState, useEffect, CSSProperties } from 'react';
import { HardwareMoveEvent } from '@/types/database';
import { RefreshCw, AlertTriangle, Wrench } from 'lucide-react'; // Added Wrench icon

const styles: { [key: string]: CSSProperties } = {
  container: { backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', padding: '1.5rem' },
  headerContainer: { display: 'flex', alignItems: 'center', marginBottom: '1.5rem' },
  headerIcon: { color: '#0F3460', marginRight: '1rem' },
  headerTitle: { fontSize: '1.75rem', fontWeight: 'bold', color: '#0F3460', margin: 0 },
  tableContainer: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse' },
  tableHeaderRow: { borderBottom: '1px solid #e5e7eb', backgroundColor: '#f9fafb' },
  tableHeaderCell: { padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: 600, color: '#4b5563' },
  tableBodyRow: { borderBottom: '1px solid #e5e7eb' },
  tableBodyCell: { padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827' },
  loadingContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem', color: '#6b7280' },
  loadingSpinner: { animation: 'spin 1s linear infinite', marginBottom: '0.5rem' },
  errorContainer: { textAlign: 'center', padding: '1rem', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: '0.5rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  noDataCell: { padding: '2rem', textAlign: 'center', color: '#6b7280' },
};

export default function HardwareMoveEventList() {
  const [hardwareMoves, setHardwareMoves] = useState<HardwareMoveEvent[]>([]);
  const [loadingHardware, setLoadingHardware] = useState(true);
  const [errorHardware, setErrorHardware] = useState<string | null>(null);

  useEffect(() => {
    const fetchHardwareMoves = async () => {
      setLoadingHardware(true);
      setErrorHardware(null);
      try {
        const response = await fetch('/api/hardwaremoveevents');
        if (!response.ok) throw new Error('Failed to fetch hardware move events');
        const data = await response.json();
        setHardwareMoves(data.hardware_move_events || []);
      } catch (err) {
        setErrorHardware(err instanceof Error ? err.message : String(err));
      } finally {
        setLoadingHardware(false);
      }
    };
    fetchHardwareMoves();
  }, []);

  const renderLoading = () => (
    <div style={styles.loadingContainer}>
      <RefreshCw size={24} style={styles.loadingSpinner} />
      <p style={{ margin: 0 }}>Loading hardware move history...</p>
      <style jsx global>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  const renderError = (errorMsg: string) => (
    <div style={styles.errorContainer}>
      <AlertTriangle size={20} style={{ marginRight: '0.5rem' }} />
      <p>{errorMsg}</p>
    </div>
  );
  
  return (
    <div style={styles.container}>
        <div style={styles.headerContainer}>
            <Wrench size={28} style={styles.headerIcon} />
            <h1 style={styles.headerTitle}>Hardware Move History</h1>
        </div>
        {loadingHardware ? renderLoading() : errorHardware ? renderError(errorHardware) : (
          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.tableHeaderRow}>
                  {/* Removed Event ID */}
                  <th style={styles.tableHeaderCell}>Hardware</th>
                  <th style={styles.tableHeaderCell}>Group</th>
                  <th style={styles.tableHeaderCell}>From Bench</th>
                  <th style={styles.tableHeaderCell}>To Bench</th>
                  <th style={styles.tableHeaderCell}>Moved On</th>
                  {/* <th style={styles.tableHeaderCell}>Moved By</th> */}
                </tr>
              </thead>
              <tbody>
                {hardwareMoves.length === 0 ? (
                  <tr><td colSpan={5} style={styles.noDataCell}>No hardware move events found.</td></tr>
                ) : (
                  hardwareMoves.map((event) => (
                    <tr key={event.move_id} style={styles.tableBodyRow}>
                      {/* Removed Event ID data cell */}
                      <td style={styles.tableBodyCell}>{event.hardware_description || event.install_id || 'N/A'}</td>
                      <td style={styles.tableBodyCell}>{event.group_name || 'N/A'}</td>
                      <td style={styles.tableBodyCell}>{event.from_bench_name || 'Source N/A'}</td>
                      <td style={styles.tableBodyCell}>{event.to_bench_name || 'Destination N/A'}</td>
                      <td style={styles.tableBodyCell}>{event.event_timestamp ? new Date(event.event_timestamp).toLocaleString() : '-'}</td>
                      {/* <td style={styles.tableBodyCell}>{event.changed_by || '-'}</td> */}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
  );
} 