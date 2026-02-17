import { db } from "./index";
import { sql } from "drizzle-orm";

const TENANT_SCOPED_TABLES = [
  "academic_years",
  "terms",
  "user_profiles",
  "grade_levels",
  "classes",
  "subjects",
  "class_sections",
  "students",
  "guardians",
  "attendance_records",
  "grading_scales",
  "assessments",
  "grades",
  "report_cards",
  "fee_structures",
  "invoices",
  "payments",
  "announcements",
  "message_threads",
  "messages",
] as const;

async function applyRLS() {
  console.log("Applying Row-Level Security policies...");

  // Create the current_tenant_id() function
  await db.execute(sql`
    CREATE OR REPLACE FUNCTION current_tenant_id() RETURNS text AS $$
      SELECT NULLIF(current_setting('app.current_tenant_id', true), '');
    $$ LANGUAGE sql STABLE;
  `);
  console.log("Created current_tenant_id() function");

  for (const table of TENANT_SCOPED_TABLES) {
    console.log(`Applying RLS to ${table}...`);

    // Enable RLS on the table
    await db.execute(sql.raw(`ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY;`));

    // Drop existing policies if any (idempotent)
    await db.execute(sql.raw(`DROP POLICY IF EXISTS "${table}_tenant_select" ON "${table}";`));
    await db.execute(sql.raw(`DROP POLICY IF EXISTS "${table}_tenant_insert" ON "${table}";`));
    await db.execute(sql.raw(`DROP POLICY IF EXISTS "${table}_tenant_update" ON "${table}";`));
    await db.execute(sql.raw(`DROP POLICY IF EXISTS "${table}_tenant_delete" ON "${table}";`));

    // Create SELECT policy
    await db.execute(
      sql.raw(`CREATE POLICY "${table}_tenant_select" ON "${table}" FOR SELECT USING (tenant_id = current_tenant_id());`)
    );

    // Create INSERT policy
    await db.execute(
      sql.raw(`CREATE POLICY "${table}_tenant_insert" ON "${table}" FOR INSERT WITH CHECK (tenant_id = current_tenant_id());`)
    );

    // Create UPDATE policy
    await db.execute(
      sql.raw(`CREATE POLICY "${table}_tenant_update" ON "${table}" FOR UPDATE USING (tenant_id = current_tenant_id()) WITH CHECK (tenant_id = current_tenant_id());`)
    );

    // Create DELETE policy
    await db.execute(
      sql.raw(`CREATE POLICY "${table}_tenant_delete" ON "${table}" FOR DELETE USING (tenant_id = current_tenant_id());`)
    );
  }

  console.log("RLS policies applied successfully!");
  process.exit(0);
}

applyRLS().catch((err) => {
  console.error("RLS setup failed:", err);
  process.exit(1);
});
