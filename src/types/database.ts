import { RowDataPacket } from 'mysql2/promise';

export interface TestBench extends RowDataPacket {
  bench_id: number;
  hil_name: string;
  pp_number: string | null;
  system_type: string | null;
  bench_type: string | null;
  acquisition_date: string | null;
  usage_period: string | null;
  project_id: number | null;
  location: string | null;
  inventory_number: string | null;
  eplan: string | null;
  project_name?: string | null;
  manufacturer?: string | null;
  bench_generation?: string | null;
  purchase_price?: number | null;
  project_contact?: string | null;
  model_id?: number | null;
  model_name?: string | null;
  platform_name?: string | null;
}

export interface Project extends RowDataPacket {
  project_id: number;
  project_number: string;
  project_name: string;
}

export interface User extends RowDataPacket {
  user_id: number;
  user_name: string;
  company_username?: string | null;
  email: string;
  password_hash: string;
  salt: string;
  user_group_id?: number | null;
  user_group_name?: string | null;
  permission_name?: string | null;
}

// Request body for creating/updating a License
export interface LicenseRequestBody {
  software_id: number;
  license_name?: string | null;
  license_description?: string | null;
  license_number?: string | null;
  dongle_number?: string | null;
  activation_key?: string | null;
  system_id?: string | null;
  license_user?: string | null;
  maintenance_end?: string | null; // Expected format: YYYY-MM-DD
  owner?: string | null;
  license_type?: string | null;
  remarks?: string | null;
}

export interface License extends RowDataPacket {
  license_id: number;
  software_id: number;
  license_name: string | null;
  license_description: string | null;
  license_number: string | null;
  dongle_number: string | null;
  activation_key: string | null;
  system_id: string | null;
  license_user: string | null;
  maintenance_end: string | null;
  owner: string | null;
  license_type: string | null;
  remarks: string | null;
  software_name?: string | null;
  assigned_to_name?: string | null;
  assigned_to_type?: 'pc' | 'vm' | null;
  assigned_pc_name?: string | null;
  assigned_vm_name?: string | null;
}

export interface VmInstance extends RowDataPacket {
  vm_id: number;
  vm_name: string;
  vm_address: string | null;
}

export interface ModelStand extends RowDataPacket {
  model_id: number;
  model_name: string;
  svn_link: string | null;
  features: string | null;
  associated_hil_names?: string | null;
}

// Request body for creating a new ModelStand (POST)
export interface ModelStandRequestBody {
  model_name: string; // Required
  svn_link?: string | null;
  features?: string | null;
  // bench_ids?: number[]; // If linking to test benches is done at creation via an array of IDs
}

// Request body for creating/updating a Wetbench
export interface WetbenchRequestBody {
  wetbench_name: string; // Required
  pp_number?: string | null;
  owner?: string | null;
  system_type?: string | null;
  system_supplier?: string | null;
  linked_bench_id?: number | null;
  actuator_info?: string | null;
  hardware_components?: string | null;
  inventory_number?: string | null;
}

export interface Wetbench extends RowDataPacket {
  wetbench_id: number;
  wetbench_name: string;
  pp_number: string | null;
  owner: string | null;
  system_type: string | null;
  system_supplier: string | null;
  linked_bench_id: number | null;
  actuator_info: string | null;
  hardware_components: string | null;
  inventory_number: string | null;
  hil_name?: string | null;
  created_at?: Date;
  updated_at?: Date;
}

// Request body for creating/updating HIL Technology
export interface HilTechnologyRequestBody {
  bench_id: number; // Required
  fiu_info?: string | null;
  io_info?: string | null;
  can_interface?: string | null;
  power_interface?: string | null;
  possible_tests?: string | null;
  leakage_module?: string | null;
}

export interface HilTechnology extends RowDataPacket {
  tech_id: number;
  bench_id: number;
  fiu_info: string | null;
  io_info: string | null;
  can_interface: string | null;
  power_interface: string | null;
  possible_tests: string | null;
  leakage_module: string | null;
  hil_name?: string | null;
}

// Request body for creating/updating HIL Operation
export interface HilOperationRequestBody {
  bench_id: number; // Required
  possible_tests?: string | null;
  vehicle_datasets?: string | null;
  scenarios?: string | null;
  controldesk_projects?: string | null;
}

export interface HilOperation extends RowDataPacket {
  operation_id: number;
  bench_id: number;
  possible_tests: string | null;
  vehicle_datasets: string | null;
  scenarios: string | null;
  controldesk_projects: string | null;
  hil_name?: string;
}

export interface HardwareGroupType extends RowDataPacket {
  hardware_group_id: number;
  group_name: string;
}

export interface HardwareInstallation extends RowDataPacket {
  install_id: number;
  hardware_group_id: number;
  group_name?: string;
  bench_id: number;
  hil_name?: string;
  description: string | null;
  hardware_number: string | null;
  part_number: string | null;
  software_version: string | null;
  manufacturer: string | null;
  installation_date: string | null;
}

export interface PcOverview extends RowDataPacket {
  pc_id: number;
  bench_id: number | null;
  pc_name: string | null;
  casual_name: string | null;
  purchase_year: number | null;
  inventory_number: string | null;
  pc_role: string | null;
  pc_model: string | null;
  special_equipment: string | null;
  mac_address: string | null;
  ip_address: string | null;
  pc_info_text: string | null;
  status: string | null;
  active_user: string | null;
  hil_name?: string | null;
  platform_name?: string | null;
}

export interface ProjectOverview extends RowDataPacket {
  overview_id: number;
  bench_id: number;
  hil_name?: string;
  platform_id: number | null;
  platform_name?: string | null;
  system_supplier: string | null;
  wetbench_info: string | null;
  actuator_info: string | null;
  hardware: string | null;
  software: string | null;
  model_version: string | null;
  ticket_notes: string | null;
  wetbench_id?: number | null;
  wetbench_name?: string | null;
}

export interface Software extends RowDataPacket {
  software_id: number;
  software_name: string;
  major_version: string | null;
  vendor: string | null;
}

export interface Platform extends RowDataPacket {
  platform_id: number;
  platform_name: string;
}

export interface TestStationModule extends RowDataPacket {
  module_id: number;
  add_on_modules: string | null;
  pedal_actuator: string | null;
}

export interface SimulationModel extends RowDataPacket {
  model_id: number;
  environment_model: string | null;
  driver_model: string | null;
  vehicle_model: string | null;
  base_vehicle_model: string | null;
  brake_system: string | null;
  propulsion_system: string | null;
  suspension_system: string | null;
  steering_system: string | null;
  vertical_dynamics_system: string | null;
  vehicle_control_system: string | null;
  infotainment_system: string | null;
  adas_system: string | null;
  energy_system: string | null;
}

export interface SignalChain extends RowDataPacket {
  chain_id: number;
  io_models: string | null;
  peripheral_hw: string | null;
  wetbench: string | null; // Currently TEXT in DB
  hcu_emulation: string | null;
  epb: string | null;
  buttons: string | null;
  rdz_sensor: string | null;
  test_modules: string | null; // Currently TEXT in DB
  diagnostic_modules: string | null;
}

export interface DutActuatorSignalAcquisition extends RowDataPacket {
  acquisition_id: number;
  epg: string | null;
  measurement: string | null;
  pump_control: string | null;
  valve_currents: string | null;
}

export interface ControlButton extends RowDataPacket {
  button_id: number;
  esc_button: string | null;
  auto_hold_button: string | null;
  epb_button: string | null;
}

export interface PowerSupply extends RowDataPacket {
  supply_id: number;
  power_supply: string | null;
  fiu: string | null;
}

export interface DutDiagnostic extends RowDataPacket {
  diagnostic_id: number;
  odis: string | null;
  internal_dut_values: string | null;
}

export interface HardwareMoveEvent extends RowDataPacket {
  move_id: number;
  install_id: number;
  hardware_description?: string; // From hardware_installations.description
  group_name?: string;           // From hardware_group_types.group_name
  from_bench_id: number | null;
  from_bench_name?: string;       // From test_benches.hil_name
  to_bench_id: number | null;
  to_bench_name?: string;         // From test_benches.hil_name
  event_timestamp: string; // DATETIME as string
  changed_by: string | null;
}

export interface LicenseMoveEvent extends RowDataPacket {
  move_id: number;
  assignment_id: number;
  license_id: number;
  license_name?: string;      // From licenses.license_name
  license_key?: string;       // From licenses.license_number (was license_key)
  from_pc_id?: number | null;
  from_pc_name?: string;       // From pc_overview.pc_name
  to_pc_id?: number | null;
  to_pc_name?: string;         // From pc_overview.pc_name
  from_bench_id?: number | null; // Added from original schema, maps to pc_overview.bench_id if pc is moved
  from_bench_name?: string;    // Name of the bench the PC was on
  to_bench_id?: number | null;   // Added from original schema
  to_bench_name?: string;      // Name of the bench the PC is moved to
  from_vm_id?: number | null;
  from_vm_name?: string;       // From vm_instances.vm_name
  to_vm_id?: number | null;
  to_vm_name?: string;         // From vm_instances.vm_name
  event_timestamp: string;    // DATETIME as string
  changed_by: string | null;
}

// Request body for creating a new VmInstance (POST)
export interface VmInstancePostRequestBody {
  vm_name: string; // Required
  vm_address?: string | null;
}

// Request body for creating/updating a ProjectOverview
export interface ProjectOverviewRequestBody {
  bench_id: number; // Required
  platform_id?: number | string | null; // string for empty form value ''
  platform_name?: string; // Added to allow providing name for getOrCreate logic
  system_supplier?: string | null;
  wetbench_info?: string | null;
  actuator_info?: string | null;
  hardware?: string | null;
  software?: string | null;
  model_version?: string | null;
  ticket_notes?: string | null;
  wetbench_id?: number | string | null; // string for empty form value ''
  overview_id?: number; // For PUT requests, included in body
}

// Request body for creating/updating a Project
export interface ProjectRequestBody {
  project_name: string; 
  project_number: string; 
}

// Request body for creating/updating Software
export interface SoftwareRequestBody {
  software_name: string; // Required
  major_version?: string | null;
  vendor?: string | null;
}

// Request body for creating a new TestBench (POST)
export interface TestBenchPostBody {
    hil_name: string; // Required for POST
    pp_number?: string | null;
    system_type?: string | null;
    bench_type?: string | null;
    acquisition_date?: string | null; // Expecting YYYY-MM-DD
    location?: string | null;
    project_id?: number | null;
    usage_period?: string | null;
    inventory_number?: string | null;
    eplan?: string | null;
    manufacturer?: string | null;
    bench_generation?: string | null;
    purchase_price?: number | string | null; // string for form input, parsed to number
    project_contact?: string | null;
    model_id?: number | null;
}

// Request body for creating a new HardwareInstallation (POST)
export interface HardwareInstallationPostBody {
  hardware_group_id: number;
  bench_id: number;
  description?: string | null;
  hardware_number?: string | null;
  part_number?: string | null;
  software_version?: string | null;
  manufacturer?: string | null;
  installation_date?: string | null; // Expecting YYYY-MM-DD string
}

// Request body for creating a new PcOverview (POST)
export interface PcOverviewPostBody {
    bench_id: number | null;
    pc_name: string;
    casual_name?: string | null;
    purchase_year?: number | null;
    inventory_number?: string | null;
    pc_role?: string | null;
    pc_model?: string | null;
    special_equipment?: string | null;
    mac_address?: string | null;
    ip_address?: string | null;
    pc_info_text?: string | null;
    status?: string | null;
    active_user?: string | null;
} 