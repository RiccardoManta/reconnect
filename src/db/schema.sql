/* ---------- core entities ---------- */
CREATE TABLE permissions (
    permission_id   INT PRIMARY KEY AUTO_INCREMENT,
    permission_name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE user_groups (
    user_group_id   INT PRIMARY KEY AUTO_INCREMENT,
    user_group_name VARCHAR(100) NOT NULL UNIQUE,
    permission_id   INT NOT NULL,
    FOREIGN KEY (permission_id) REFERENCES permissions(permission_id)
);

CREATE TABLE platforms (
    platform_id   INT PRIMARY KEY AUTO_INCREMENT,
    platform_name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE users (
    user_id          INT PRIMARY KEY AUTO_INCREMENT,
    user_name        VARCHAR(255) NOT NULL,
    company_username VARCHAR(255),
    email            VARCHAR(255) NOT NULL UNIQUE,
    password_hash    VARCHAR(255) NOT NULL,
    salt             VARCHAR(64)  NOT NULL,
    user_group_id    INT,
    FOREIGN KEY (user_group_id) REFERENCES user_groups(user_group_id) ON DELETE SET NULL
);

/* ---------- projects & benches ---------- */
CREATE TABLE projects (
    project_id     INT PRIMARY KEY AUTO_INCREMENT,
    project_number VARCHAR(50),
    project_name   VARCHAR(255)
);

CREATE TABLE model_stands (
    model_id   INT PRIMARY KEY AUTO_INCREMENT,
    model_name VARCHAR(255) NOT NULL,
    svn_link   VARCHAR(500),
    features   TEXT
);

CREATE TABLE test_benches (
    bench_id          INT PRIMARY KEY AUTO_INCREMENT,
    hil_name          VARCHAR(255) NOT NULL,
    pp_number         VARCHAR(50),
    system_type       VARCHAR(50),
    bench_type        VARCHAR(100),
    acquisition_date  DATE,
    usage_period      VARCHAR(50),
    project_id        INT,
    location          VARCHAR(100),
    inventory_number  VARCHAR(100),
    eplan             VARCHAR(100),
    manufacturer      VARCHAR(255),
    bench_generation  VARCHAR(100),
    purchase_price    DECIMAL(15,2),
    project_contact   VARCHAR(255),
    model_id          INT,
    FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE SET NULL,
    FOREIGN KEY (model_id)  REFERENCES model_stands(model_id) ON DELETE SET NULL
);

CREATE TABLE bench_capabilities (
    bench_id        INT NOT NULL,
    capability_name VARCHAR(255) NOT NULL,
    PRIMARY KEY (bench_id, capability_name),
    FOREIGN KEY (bench_id) REFERENCES test_benches(bench_id) ON DELETE CASCADE
);

CREATE TABLE wetbenches (
    wetbench_id         INT PRIMARY KEY AUTO_INCREMENT,
    wetbench_name       VARCHAR(255) NOT NULL,
    pp_number           VARCHAR(50),
    owner               VARCHAR(100),
    system_type         VARCHAR(50),
    system_supplier     VARCHAR(100),
    linked_bench_id     INT,
    actuator_info       TEXT,
    hardware_components TEXT,
    inventory_number    VARCHAR(100),
    FOREIGN KEY (linked_bench_id) REFERENCES test_benches(bench_id) ON DELETE SET NULL
);

CREATE TABLE test_bench_project_overview (
    overview_id     INT PRIMARY KEY AUTO_INCREMENT,
    bench_id        INT NOT NULL,
    platform_id     INT,
    wetbench_id     INT,
    system_supplier VARCHAR(100),
    wetbench_info   TEXT,
    actuator_info   TEXT,
    hardware        VARCHAR(255),
    software        VARCHAR(255),
    model_version   VARCHAR(50),
    ticket_notes    TEXT,
    FOREIGN KEY (bench_id)    REFERENCES test_benches(bench_id) ON DELETE CASCADE,
    FOREIGN KEY (platform_id) REFERENCES platforms(platform_id) ON DELETE SET NULL,
    FOREIGN KEY (wetbench_id) REFERENCES wetbenches(wetbench_id) ON DELETE SET NULL
);

/* ---------- HIL details ---------- */
CREATE TABLE hil_technology (
    tech_id          INT PRIMARY KEY AUTO_INCREMENT,
    bench_id         INT NOT NULL,
    fiu_info         VARCHAR(255),
    io_info          VARCHAR(255),
    can_interface    VARCHAR(255),
    power_interface  VARCHAR(255),
    possible_tests   TEXT,
    leakage_module   VARCHAR(100),
    FOREIGN KEY (bench_id) REFERENCES test_benches(bench_id) ON DELETE CASCADE
);

CREATE TABLE hil_operation (
    operation_id        INT PRIMARY KEY AUTO_INCREMENT,
    bench_id            INT NOT NULL,
    possible_tests      TEXT,
    vehicle_datasets    TEXT,
    scenarios           TEXT,
    controldesk_projects TEXT,
    FOREIGN KEY (bench_id) REFERENCES test_benches(bench_id) ON DELETE CASCADE
);

/* ---------- hardware groups ---------- */
CREATE TABLE hardware_group_types (
    hardware_group_id INT PRIMARY KEY AUTO_INCREMENT,
    group_name        VARCHAR(100) NOT NULL UNIQUE
);

INSERT INTO hardware_group_types (group_name) VALUES
('Brake Aggregate'),
('Brake Component'),
('Coilpacks'),
('Diagnostic Interface'),
('Pressure Emulation'),
('ECU'),
('EPB Emulation'),
('Measurement Technology'),
('Pump Emulation'),
('Sensor Emulation'),
('Switching Power Supply'),
('Additional Periphery');

CREATE TABLE hardware_installations (
    install_id        INT PRIMARY KEY AUTO_INCREMENT,
    hardware_group_id INT NOT NULL,
    bench_id          INT NOT NULL,
    description       TEXT,
    hardware_number   VARCHAR(100),
    part_number       VARCHAR(100),
    software_version  VARCHAR(100),
    manufacturer      VARCHAR(255),
    installation_date DATE,
    FOREIGN KEY (hardware_group_id) REFERENCES hardware_group_types(hardware_group_id) ON DELETE RESTRICT,
    FOREIGN KEY (bench_id)         REFERENCES test_benches(bench_id) ON DELETE CASCADE
);

/* ---------- physical & virtual machines ---------- */
CREATE TABLE pc_overview (
    pc_id            INT PRIMARY KEY AUTO_INCREMENT,
    bench_id         INT,
    pc_name          VARCHAR(100),
    casual_name      VARCHAR(100),
    purchase_year    INT,
    inventory_number VARCHAR(100),
    pc_role          VARCHAR(100),
    pc_model         VARCHAR(100),
    special_equipment TEXT,
    mac_address      VARCHAR(17),
    ip_address       VARCHAR(45),
    pc_info_text     TEXT,
    status           VARCHAR(50),
    active_user      VARCHAR(100),
    FOREIGN KEY (bench_id) REFERENCES test_benches(bench_id) ON DELETE SET NULL
);

CREATE TABLE vm_instances (
    vm_id      INT PRIMARY KEY AUTO_INCREMENT,
    vm_name    VARCHAR(255) NOT NULL,
    vm_address VARCHAR(255)
);

/* ---------- software catalogue & installs ---------- */
CREATE TABLE software (
    software_id   INT PRIMARY KEY AUTO_INCREMENT,
    software_name VARCHAR(255) NOT NULL,
    major_version VARCHAR(50),
    vendor        VARCHAR(255),
    UNIQUE KEY uk_software_version (software_name, major_version)
);

CREATE TABLE pc_software (
    pc_id       INT NOT NULL,
    software_id INT NOT NULL,
    install_date DATE,
    PRIMARY KEY (pc_id, software_id),
    FOREIGN KEY (pc_id)       REFERENCES pc_overview(pc_id) ON DELETE CASCADE,
    FOREIGN KEY (software_id) REFERENCES software(software_id) ON DELETE CASCADE
);

CREATE TABLE vm_software (
    vm_id       INT NOT NULL,
    software_id INT NOT NULL,
    install_date DATE,
    PRIMARY KEY (vm_id, software_id),
    FOREIGN KEY (vm_id)       REFERENCES vm_instances(vm_id) ON DELETE CASCADE,
    FOREIGN KEY (software_id) REFERENCES software(software_id) ON DELETE CASCADE
);

/* ---------- licensing ---------- */
CREATE TABLE licenses (
    license_id         INT PRIMARY KEY AUTO_INCREMENT,
    software_id        INT NOT NULL,
    license_name       VARCHAR(255),
    license_description TEXT,
    license_number     VARCHAR(255),
    dongle_number      VARCHAR(100),
    activation_key     VARCHAR(255),
    system_id          VARCHAR(255),
    license_user       VARCHAR(100),
    maintenance_end    DATE,
    owner              VARCHAR(100),
    license_type       VARCHAR(50),
    remarks            TEXT,
    FOREIGN KEY (software_id) REFERENCES software(software_id) ON DELETE CASCADE
);

CREATE TABLE license_assignments (
    assignment_id INT PRIMARY KEY AUTO_INCREMENT,
    license_id  INT NOT NULL,
    pc_id       INT,
    vm_id       INT,
    assigned_on DATE,
    FOREIGN KEY (license_id) REFERENCES licenses(license_id) ON DELETE CASCADE,
    FOREIGN KEY (pc_id)      REFERENCES pc_overview(pc_id) ON DELETE CASCADE,
    FOREIGN KEY (vm_id)      REFERENCES vm_instances(vm_id) ON DELETE CASCADE,
    CHECK ((pc_id IS NOT NULL) OR (vm_id IS NOT NULL)),
    UNIQUE KEY uk_license_assignment (license_id, pc_id, vm_id)
);

/* ---------- group-specific platform access ---------- */
CREATE TABLE group_platform_access (
    user_group_id INT NOT NULL,
    platform_id   INT NOT NULL,
    PRIMARY KEY (user_group_id, platform_id),
    FOREIGN KEY (user_group_id) REFERENCES user_groups(user_group_id) ON DELETE CASCADE,
    FOREIGN KEY (platform_id)   REFERENCES platforms(platform_id) ON DELETE CASCADE
);

/* ---------- standalone descriptive tables ------------------------------ */
CREATE TABLE test_station_modules (
    module_id      INT PRIMARY KEY AUTO_INCREMENT,
    add_on_modules TEXT,
    pedal_actuator TEXT
);

CREATE TABLE simulation_models (
    model_id                 INT PRIMARY KEY AUTO_INCREMENT,
    environment_model        TEXT,
    driver_model             TEXT,
    vehicle_model            TEXT,
    base_vehicle_model       TEXT,
    brake_system             TEXT,
    propulsion_system        TEXT,
    suspension_system        TEXT,
    steering_system          TEXT,
    vertical_dynamics_system TEXT,
    vehicle_control_system   TEXT,
    infotainment_system      TEXT,
    adas_system              TEXT,
    energy_system            TEXT
);

CREATE TABLE signal_chains (
    chain_id           INT PRIMARY KEY AUTO_INCREMENT,
    io_models          TEXT,
    peripheral_hw      TEXT,
    wetbench           TEXT,
    hcu_emulation      TEXT,
    epb                TEXT,
    buttons            TEXT,
    rdz_sensor         TEXT,
    test_modules       TEXT,
    diagnostic_modules TEXT
);

CREATE TABLE dut_actuator_signal_acquisition (
    acquisition_id   INT PRIMARY KEY AUTO_INCREMENT,
    epg              TEXT,
    measurement      TEXT,
    pump_control     TEXT,
    valve_currents   TEXT
);

CREATE TABLE control_buttons (
    button_id        INT PRIMARY KEY AUTO_INCREMENT,
    esc_button       TEXT,
    auto_hold_button TEXT,
    epb_button       TEXT
);

CREATE TABLE power_supplies (
    supply_id    INT PRIMARY KEY AUTO_INCREMENT,
    power_supply TEXT,
    fiu          TEXT
);

CREATE TABLE dut_diagnostics (
    diagnostic_id       INT PRIMARY KEY AUTO_INCREMENT,
    odis                TEXT,
    internal_dut_values TEXT
);

/* ---------- move-history tables --------------------------------------- */
CREATE TABLE hardware_move_events (
    move_id         INT PRIMARY KEY AUTO_INCREMENT,
    install_id      INT NOT NULL,
    from_bench_id   INT,
    to_bench_id     INT,
    event_timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    changed_by      VARCHAR(100),
    FOREIGN KEY (install_id)    REFERENCES hardware_installations(install_id) ON DELETE CASCADE,
    FOREIGN KEY (from_bench_id) REFERENCES test_benches(bench_id)            ON DELETE SET NULL,
    FOREIGN KEY (to_bench_id)   REFERENCES test_benches(bench_id)            ON DELETE SET NULL
);

CREATE TABLE license_move_events (
    move_id         INT PRIMARY KEY AUTO_INCREMENT,
    assignment_id   INT NOT NULL,
    license_id      INT NOT NULL,
    from_pc_id      INT,
    to_pc_id        INT,
    from_vm_id      INT,
    to_vm_id        INT,
    event_timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    changed_by      VARCHAR(100),
    FOREIGN KEY (assignment_id) REFERENCES license_assignments(assignment_id) ON DELETE CASCADE,
    FOREIGN KEY (license_id)    REFERENCES licenses(license_id)              ON DELETE CASCADE,
    FOREIGN KEY (from_pc_id)    REFERENCES pc_overview(pc_id)                ON DELETE SET NULL,
    FOREIGN KEY (to_pc_id)      REFERENCES pc_overview(pc_id)                ON DELETE SET NULL,
    FOREIGN KEY (from_vm_id)    REFERENCES vm_instances(vm_id)               ON DELETE SET NULL,
    FOREIGN KEY (to_vm_id)      REFERENCES vm_instances(vm_id)               ON DELETE SET NULL
);

/* ---------- triggers: record only desired moves ----------------------- */
DELIMITER $$

CREATE TRIGGER trg_hw_move
BEFORE UPDATE ON hardware_installations
FOR EACH ROW
BEGIN
  IF OLD.bench_id <> NEW.bench_id THEN
    INSERT INTO hardware_move_events
          (install_id, from_bench_id, to_bench_id)
    VALUES (OLD.install_id, OLD.bench_id, NEW.bench_id);
  END IF;
END$$

CREATE TRIGGER trg_lic_move
BEFORE UPDATE ON license_assignments
FOR EACH ROW
BEGIN
  IF (OLD.pc_id <> NEW.pc_id) OR (OLD.vm_id <> NEW.vm_id) THEN
    INSERT INTO license_move_events
          (assignment_id, license_id,
           from_pc_id, to_pc_id, from_vm_id, to_vm_id)
    VALUES (OLD.assignment_id, OLD.license_id,
            OLD.pc_id, NEW.pc_id, OLD.vm_id, NEW.vm_id);
  END IF;
END$$

DELIMITER ;
