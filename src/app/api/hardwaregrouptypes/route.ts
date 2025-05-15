import { NextResponse } from 'next/server';
import { query } from '@/db/dbUtils'; 
import { HardwareGroupType } from '@/types/database';

export async function GET() {
  try {
    const hardwareGroupTypes = await query<HardwareGroupType[]>(
      `SELECT 
         hardware_group_id, 
         group_name 
       FROM hardware_group_types 
       ORDER BY group_name`
    );
    
    return NextResponse.json({ hardware_group_types: hardwareGroupTypes || [] });
  } catch (error) {
    console.error('Failed to fetch hardware group types:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({ error: 'Failed to fetch hardware group types', details: errorMessage }, { status: 500 });
  }
} 