Schema evolution summary
Structural changes
test_benches
manufacturer, bench_generation, purchase_price, project_contact, model_id
– user_id removed
wetbenches
– platform column removed
test_bench_project_overview
wetbench_id (FK → wetbenches)
New core/lookup tables
model_stands (model catalogue)
hardware_group_types (list of 12 hardware groups)
bench_capabilities (binary yes/no per bench & capability)
Re-designed hardware
Dropped old hardware_installation
Added hardware_installations (generic row per part, FK to group + bench)
Descriptive (stand-alone) tables
test_station_modules, simulation_models, signal_chains,
dut_actuator_signal_acquisition, control_buttons, power_supplies,
dut_diagnostics
Move-history / audit
hardware_move_events (+ trigger: logs bench_id changes in hardware_installations)
license_move_events (+ trigger: logs pc_id / vm_id moves in license_assignments)
Unchanged
All other original entities (permissions, users, projects, PCs/VMs, software, licensing, etc.) remain intact.