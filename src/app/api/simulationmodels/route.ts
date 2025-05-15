import { NextResponse } from 'next/server';
import { query } from '@/db/dbUtils';
import { SimulationModel } from '@/types/database';

export async function GET() {
  try {
    const simulationModels = await query<SimulationModel[]>(
      `SELECT 
         model_id AS modelId,
         environment_model AS environmentModel,
         driver_model AS driverModel,
         vehicle_model AS vehicleModel,
         base_vehicle_model AS baseVehicleModel,
         brake_system AS brakeSystem,
         propulsion_system AS propulsionSystem,
         suspension_system AS suspensionSystem,
         steering_system AS steeringSystem,
         vertical_dynamics_system AS verticalDynamicsSystem,
         vehicle_control_system AS vehicleControlSystem,
         infotainment_system AS infotainmentSystem,
         adas_system AS adasSystem,
         energy_system AS energySystem
       FROM simulation_models
       ORDER BY model_id`
    );
    
    return NextResponse.json({ simulationModels: simulationModels || [] });
  } catch (error) {
    console.error('Failed to fetch simulation models:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({ error: 'Failed to fetch simulation models', details: errorMessage }, { status: 500 });
  }
} 