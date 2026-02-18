import { db } from "./index";
import { sql } from "drizzle-orm";
import { tenants, students, attendanceRecords, invoices } from "./schema";
import { eq } from "drizzle-orm";

/**
 * RLS Audit Script
 *
 * Tests that Row-Level Security policies correctly isolate tenant data.
 * Creates two test tenants, seeds data in tenant A, then verifies
 * that queries from tenant B context cannot access tenant A's data.
 */
async function rlsAudit() {
  console.log("=== RLS Security Audit ===\n");

  const tenantA = "rls_test_tenant_a_" + Date.now();
  const tenantB = "rls_test_tenant_b_" + Date.now();
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, message: string) {
    if (condition) {
      console.log(`  PASS: ${message}`);
      passed++;
    } else {
      console.log(`  FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // Setup: Create test tenants
    console.log("Setting up test tenants...");
    await db.insert(tenants).values([
      { id: tenantA, name: "Test Tenant A", slug: `test-a-${Date.now()}`, timezone: "UTC", defaultLocale: "en", defaultCurrency: "USD", academicYearStartMonth: "09" },
      { id: tenantB, name: "Test Tenant B", slug: `test-b-${Date.now()}`, timezone: "UTC", defaultLocale: "en", defaultCurrency: "USD", academicYearStartMonth: "09" },
    ]);

    // Seed data in tenant A
    console.log("Seeding test data in Tenant A...\n");
    await db.execute(sql`SELECT set_config('app.current_tenant_id', ${tenantA}, true)`);

    await db.insert(students).values({
      tenantId: tenantA,
      studentNumber: "RLS-TEST-001",
      firstName: "Test",
      lastName: "Student",
      dateOfBirth: new Date("2010-01-01"),
      enrollmentDate: new Date("2025-01-01"),
      status: "active",
    });

    // Test 1: Tenant A can see its own data
    console.log("Test 1: Tenant A can see its own data");
    await db.execute(sql`SELECT set_config('app.current_tenant_id', ${tenantA}, true)`);
    const tenantAStudents = await db.select().from(students).where(eq(students.tenantId, tenantA));
    assert(tenantAStudents.length > 0, "Tenant A can query its own students");

    // Test 2: Tenant B cannot see Tenant A's data
    console.log("\nTest 2: Tenant B cannot see Tenant A's data");
    await db.execute(sql`SELECT set_config('app.current_tenant_id', ${tenantB}, true)`);

    // With RLS, even without WHERE clause, tenant B should not see tenant A's data
    const tenantBQuery = await db.execute(
      sql`SELECT * FROM students WHERE tenant_id = ${tenantA}`
    );
    assert(
      (tenantBQuery as any).length === 0 || (tenantBQuery as any).rows?.length === 0,
      "Tenant B SELECT on Tenant A students returns 0 rows"
    );

    // Test 3: Tenant B cannot UPDATE Tenant A's data
    console.log("\nTest 3: Tenant B cannot modify Tenant A's data");
    await db.execute(sql`SELECT set_config('app.current_tenant_id', ${tenantB}, true)`);
    const updateResult = await db.execute(
      sql`UPDATE students SET first_name = 'Hacked' WHERE tenant_id = ${tenantA}`
    );
    // Verify original data is untouched
    await db.execute(sql`SELECT set_config('app.current_tenant_id', ${tenantA}, true)`);
    const afterUpdate = await db.select().from(students).where(eq(students.tenantId, tenantA));
    assert(
      afterUpdate.every(s => s.firstName !== "Hacked"),
      "Tenant A's student data was not modified by Tenant B"
    );

    // Test 4: Tenant B cannot DELETE Tenant A's data
    console.log("\nTest 4: Tenant B cannot delete Tenant A's data");
    await db.execute(sql`SELECT set_config('app.current_tenant_id', ${tenantB}, true)`);
    await db.execute(sql`DELETE FROM students WHERE tenant_id = ${tenantA}`);
    await db.execute(sql`SELECT set_config('app.current_tenant_id', ${tenantA}, true)`);
    const afterDelete = await db.select().from(students).where(eq(students.tenantId, tenantA));
    assert(afterDelete.length > 0, "Tenant A's students were not deleted by Tenant B");

    // Test 5: INSERT with mismatched tenant_id
    console.log("\nTest 5: INSERT with mismatched tenant_id is blocked");
    await db.execute(sql`SELECT set_config('app.current_tenant_id', ${tenantB}, true)`);
    let insertBlocked = false;
    try {
      await db.execute(
        sql`INSERT INTO students (id, tenant_id, student_number, first_name, last_name, date_of_birth, enrollment_date, status)
            VALUES (gen_random_uuid(), ${tenantA}, 'RLS-HACK-001', 'Hacker', 'Student', '2010-01-01', '2025-01-01', 'active')`
      );
    } catch {
      insertBlocked = true;
    }
    // Check if the insert succeeded anyway (RLS might silently filter it or throw)
    await db.execute(sql`SELECT set_config('app.current_tenant_id', ${tenantA}, true)`);
    const hackerStudents = await db.select().from(students).where(eq(students.studentNumber, "RLS-HACK-001"));
    assert(
      insertBlocked || hackerStudents.length === 0,
      "INSERT with mismatched tenant_id was blocked or had no effect"
    );

  } finally {
    // Cleanup
    console.log("\nCleaning up test data...");
    await db.execute(sql`DELETE FROM students WHERE tenant_id IN (${tenantA}, ${tenantB})`);
    await db.execute(sql`DELETE FROM tenants WHERE id IN (${tenantA}, ${tenantB})`);
  }

  console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);

  if (failed > 0) {
    console.log("\nWARNING: Some RLS tests failed! Review your RLS policies.");
    process.exit(1);
  } else {
    console.log("\nAll RLS tests passed. Tenant isolation is working correctly.");
    process.exit(0);
  }
}

rlsAudit().catch((err) => {
  console.error("RLS audit failed:", err);
  process.exit(1);
});
