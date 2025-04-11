import React from 'react';
import { Plus } from 'lucide-react';

interface AddServerCardProps {
  onClick: () => void;
}

export default function AddServerCard({ onClick }: AddServerCardProps) {
  return (
    <button 
      onClick={onClick}
      className="add-server-card"
    >
      <Plus className="h-12 w-12 add-icon" stroke="currentColor" strokeWidth={1.5} />
      <span className="add-text">Add New Server</span>
    </button>
  );
} 