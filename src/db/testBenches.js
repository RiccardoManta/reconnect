const db = require('./dbUtils');

// Get all test benches with basic info
function getAllTestBenches() {
  try {
    console.log('Getting all test benches...');
    const sql = `
      SELECT t.*, u.user_name, p.project_name 
      FROM test_benches t
      LEFT JOIN users u ON t.user_id = u.user_id
      LEFT JOIN projects p ON t.project_id = p.project_id
      ORDER BY t.bench_id
    `;
    console.log('SQL query:', sql);
    return db.query(sql);
  } catch (error) {
    console.error('Error in getAllTestBenches:', error);
    throw error;
  }
}

// Get a test bench by ID with all related info
function getTestBenchById(benchId) {
  // Get basic test bench info
  const benchSql = `
    SELECT t.*, u.user_name, p.project_name 
    FROM test_benches t
    LEFT JOIN users u ON t.user_id = u.user_id
    LEFT JOIN projects p ON t.project_id = p.project_id
    WHERE t.bench_id = ?
  `;
  const bench = db.queryOne(benchSql, [benchId]);
  
  if (!bench) {
    return null;
  }
  
  // Get project overview
  const overviewSql = `
    SELECT * FROM test_bench_project_overview
    WHERE bench_id = ?
  `;
  bench.overview = db.queryOne(overviewSql, [benchId]);
  
  // Get HIL technology details
  const techSql = `
    SELECT * FROM hil_technology
    WHERE bench_id = ?
  `;
  bench.technology = db.queryOne(techSql, [benchId]);
  
  // Get HIL operation details
  const operationSql = `
    SELECT * FROM hil_operation
    WHERE bench_id = ?
  `;
  bench.operation = db.queryOne(operationSql, [benchId]);
  
  // Get hardware installation details
  const hardwareSql = `
    SELECT * FROM hardware_installation
    WHERE bench_id = ?
  `;
  bench.hardware = db.queryOne(hardwareSql, [benchId]);
  
  // Get PC overview
  const pcSql = `
    SELECT * FROM pc_overview
    WHERE bench_id = ?
  `;
  bench.pcs = db.query(pcSql, [benchId]);
  
  // Get linked wetbenches
  const wetbenchSql = `
    SELECT * FROM wetbenches
    WHERE linked_bench_id = ?
  `;
  bench.wetbenches = db.query(wetbenchSql, [benchId]);
  
  return bench;
}

// Add a new test bench
function addTestBench(benchData) {
  const sql = `
    INSERT INTO test_benches (
      hil_name, pp_number, system_type, bench_type, 
      acquisition_date, usage_period, user_id, project_id, 
      location, inventory_number, eplan
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  const params = [
    benchData.hil_name,
    benchData.pp_number,
    benchData.system_type,
    benchData.bench_type,
    benchData.acquisition_date,
    benchData.usage_period,
    benchData.user_id,
    benchData.project_id,
    benchData.location,
    benchData.inventory_number,
    benchData.eplan
  ];
  
  return db.insert(sql, params);
}

// Update a test bench
function updateTestBench(benchId, benchData) {
  const sql = `
    UPDATE test_benches SET
      hil_name = ?,
      pp_number = ?,
      system_type = ?,
      bench_type = ?,
      acquisition_date = ?,
      usage_period = ?,
      user_id = ?,
      project_id = ?,
      location = ?,
      inventory_number = ?,
      eplan = ?
    WHERE bench_id = ?
  `;
  
  const params = [
    benchData.hil_name,
    benchData.pp_number,
    benchData.system_type,
    benchData.bench_type,
    benchData.acquisition_date,
    benchData.usage_period,
    benchData.user_id,
    benchData.project_id,
    benchData.location,
    benchData.inventory_number,
    benchData.eplan,
    benchId
  ];
  
  return db.update(sql, params);
}

// Delete a test bench
function deleteTestBench(benchId) {
  // Use a transaction to delete the test bench and its related records
  return db.transaction(database => {
    // Delete related records first
    database.prepare('DELETE FROM test_bench_project_overview WHERE bench_id = ?').run(benchId);
    database.prepare('DELETE FROM hil_technology WHERE bench_id = ?').run(benchId);
    database.prepare('DELETE FROM hil_operation WHERE bench_id = ?').run(benchId);
    database.prepare('DELETE FROM hardware_installation WHERE bench_id = ?').run(benchId);
    database.prepare('DELETE FROM pc_overview WHERE bench_id = ?').run(benchId);
    
    // Update linked wetbenches
    database.prepare('UPDATE wetbenches SET linked_bench_id = NULL WHERE linked_bench_id = ?').run(benchId);
    
    // Finally delete the test bench
    const result = database.prepare('DELETE FROM test_benches WHERE bench_id = ?').run(benchId);
    return result.changes; // Return number of affected rows
  });
}

module.exports = {
  getAllTestBenches,
  getTestBenchById,
  addTestBench,
  updateTestBench,
  deleteTestBench
}; 