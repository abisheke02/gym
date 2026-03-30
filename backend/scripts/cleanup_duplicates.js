const { Pool } = require('pg');
const config = require('../src/config');

const fixDuplicates = async () => {
  const pool = new Pool({
    host: config.db.host,
    port: config.db.port,
    database: config.db.database,
    user: config.db.user,
    password: config.db.password,
  });

  try {
    console.log('Starting cleanup of duplicate data...');

    // Tables to check for duplicates based on name
    const tables = [
      { name: 'branches', refTables: ['leads', 'members', 'users', 'payments', 'expenses'] },
      { name: 'plans', refTables: ['members'] },
      { name: 'lead_sources', refTables: ['leads'] }
    ];

    for (const table of tables) {
      console.log(`Processing table: ${table.name}`);

      // Get duplicates
      const dupsResult = await pool.query(`
        SELECT name, array_agg(id ORDER BY created_at ASC) as ids
        FROM ${table.name}
        GROUP BY name
        HAVING COUNT(*) > 1
      `);

      for (const row of dupsResult.rows) {
        const { name, ids } = row;
        const canonicalId = ids[0];
        const duplicateIds = ids.slice(1);

        console.log(`  Merging ${duplicateIds.length} duplicates for "${name}" into canonical ID ${canonicalId}`);

        // Update referencing tables
        for (const refTable of table.refTables) {
          const colName = table.name === 'lead_sources' ? 'source_id' : (table.name === 'branches' ? 'branch_id' : 'plan_id');
          
          await pool.query(`
            UPDATE ${refTable}
            SET ${colName} = $1
            WHERE ${colName} = ANY($2)
          `, [canonicalId, duplicateIds]);
        }

        // Delete duplicates
        await pool.query(`
          DELETE FROM ${table.name}
          WHERE id = ANY($1)
        `, [duplicateIds]);
      }

      // Add unique constraint if not exists
      console.log(`  Adding unique constraint to ${table.name}(name)`);
      try {
        await pool.query(`
          ALTER TABLE ${table.name} ADD CONSTRAINT ${table.name}_name_unique UNIQUE (name)
        `);
      } catch (err) {
        if (err.code === '42P16') {
          console.log(`  Unique constraint already exists on ${table.name}`);
        } else {
          console.error(`  Error adding unique constraint to ${table.name}:`, err.message);
        }
      }
    }

    console.log('✅ Cleanup complete!');
  } catch (error) {
    console.error('❌ Data cleanup error:', error);
  } finally {
    await pool.end();
  }
};

fixDuplicates();
