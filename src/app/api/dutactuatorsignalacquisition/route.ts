import { NextResponse } from 'next/server';
import { query } from '@/db/dbUtils';
import { DutActuatorSignalAcquisition } from '@/types/database';

export async function GET() {
  try {
    const acquisitions = await query<DutActuatorSignalAcquisition[]>(
      `SELECT 
         acquisition_id AS acquisitionId,
         epg,
         measurement,
         pump_control AS pumpControl,
         valve_currents AS valveCurrents
       FROM dut_actuator_signal_acquisition
       ORDER BY acquisition_id`
    );
    
    return NextResponse.json({ dutActuatorSignalAcquisitions: acquisitions || [] });
  } catch (error) {
    console.error('Failed to fetch DUT actuator signal acquisitions:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({ error: 'Failed to fetch DUT actuator signal acquisitions', details: errorMessage }, { status: 500 });
  }
} 