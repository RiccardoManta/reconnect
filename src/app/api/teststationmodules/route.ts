import { NextResponse } from 'next/server';
import { query } from '@/db/dbUtils';
import { TestStationModule } from '@/types/database';

export async function GET() {
  try {
    const testStationModules = await query<TestStationModule[]>(
      `SELECT 
         module_id AS moduleId,
         add_on_modules AS addOnModules,
         pedal_actuator AS pedalActuator
       FROM test_station_modules
       ORDER BY module_id`
    );
    
    return NextResponse.json({ testStationModules: testStationModules || [] });
  } catch (error) {
    console.error('Failed to fetch test station modules:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({ error: 'Failed to fetch test station modules', details: errorMessage }, { status: 500 });
  }
} 