import { db } from "./index";
import { sql as dsql } from "drizzle-orm";
import {
  tenants,
  academicYears,
  terms,
  gradeLevels,
  subjects,
  classes,
  classSections,
  students,
  classEnrollments,
  guardians,
  studentGuardians,
  userProfiles,
  gradingScales,
  assessments,
  grades,
  attendanceRecords,
  feeStructures,
  invoices,
  payments,
  reportCards,
} from "./schema";

async function seed() {
  console.log("Seeding database...\n");

  // --- Tenant ---
  // Use TENANT_ID env var or default to Clerk org ID
  const tenantId = process.env.TENANT_ID || "org_39n7rluabtOAtn1Hvu8d3HM0ThY";
  const existingTenants = await db.select().from(tenants).limit(1);
  if (existingTenants.length > 0) {
    console.log(`Using existing tenant: ${existingTenants[0].name} (${existingTenants[0].id})`);
  } else {
    const [tenant] = await db
      .insert(tenants)
      .values({
        id: tenantId,
        name: "Raintree International School",
        slug: "raintree",
        timezone: "Asia/Bangkok",
        defaultLocale: "en",
        defaultCurrency: "THB",
        academicYearStartMonth: "08",
      })
      .returning();
    console.log(`Created tenant: ${tenant.name} (${tenantId})`);
  }

  // --- User Profile (for teacher/recorded_by references) ---
  let teacherId: string;
  const existingUsers = await db.select().from(userProfiles).limit(1);
  if (existingUsers.length > 0) {
    teacherId = existingUsers[0].id;
    console.log(`Using existing user profile`);
  } else {
    const [teacher] = await db
      .insert(userProfiles)
      .values({
        tenantId,
        clerkUserId: "seed_teacher",
        role: "teacher",
        firstName: "Demo",
        lastName: "Teacher",
        email: "teacher@raintree.school",
      })
      .returning();
    teacherId = teacher.id;
    console.log(`Created demo teacher profile`);
  }

  // --- Academic Year ---
  let yearId: string;
  const existingYears = await db.select().from(academicYears).limit(1);
  if (existingYears.length > 0) {
    yearId = existingYears[0].id;
    console.log(`Using existing academic year`);
  } else {
    const [year] = await db
      .insert(academicYears)
      .values({
        tenantId,
        name: "2025-2026",
        startDate: new Date("2025-08-15"),
        endDate: new Date("2026-06-30"),
        isCurrent: true,
      })
      .returning();
    yearId = year.id;
    console.log(`Created academic year: 2025-2026`);
  }

  // --- Terms ---
  let term1Id: string;
  const existingTerms = await db.select().from(terms).limit(2);
  if (existingTerms.length > 0) {
    term1Id = existingTerms[0].id;
    console.log(`Using ${existingTerms.length} existing terms`);
  } else {
    const insertedTerms = await db
      .insert(terms)
      .values([
        { tenantId, academicYearId: yearId, name: "Semester 1", startDate: new Date("2025-08-15"), endDate: new Date("2025-12-20") },
        { tenantId, academicYearId: yearId, name: "Semester 2", startDate: new Date("2026-01-12"), endDate: new Date("2026-06-30") },
      ])
      .returning();
    term1Id = insertedTerms[0].id;
    console.log(`Created 2 terms`);
  }

  // --- Grade Levels ---
  const glNames = ["Grade 7", "Grade 8", "Grade 9", "Grade 10"];
  let gradeLevelIds: string[];
  const existingGl = await db.select().from(gradeLevels);
  if (existingGl.length > 0) {
    gradeLevelIds = existingGl.map((g) => g.id);
    console.log(`Using ${existingGl.length} existing grade levels`);
  } else {
    const inserted = await db
      .insert(gradeLevels)
      .values(glNames.map((name, i) => ({ tenantId, name, sortOrder: i + 1, curriculum: "IB MYP" })))
      .returning();
    gradeLevelIds = inserted.map((g) => g.id);
    console.log(`Created ${glNames.length} grade levels`);
  }

  // --- Subjects ---
  const subjectData = [
    { name: "Mathematics", code: "MATH", department: "STEM" },
    { name: "English Language", code: "ENG", department: "Languages" },
    { name: "Science", code: "SCI", department: "STEM" },
    { name: "History", code: "HIST", department: "Humanities" },
    { name: "Art", code: "ART", department: "Arts" },
  ];
  let subjectIds: string[];
  const existingSubj = await db.select().from(subjects);
  if (existingSubj.length > 0) {
    subjectIds = existingSubj.map((s) => s.id);
    console.log(`Using ${existingSubj.length} existing subjects`);
  } else {
    const inserted = await db
      .insert(subjects)
      .values(subjectData.map((s) => ({ tenantId, ...s, curriculum: "IB MYP" })))
      .returning();
    subjectIds = inserted.map((s) => s.id);
    console.log(`Created ${subjectData.length} subjects`);
  }

  // --- Classes (one per grade level) ---
  let classIds: string[];
  const existingClasses = await db.select().from(classes);
  if (existingClasses.length > 0) {
    classIds = existingClasses.map((c) => c.id);
    console.log(`Using ${existingClasses.length} existing classes`);
  } else {
    const inserted = await db
      .insert(classes)
      .values(
        gradeLevelIds.map((glId, i) => ({
          tenantId,
          gradeLevelId: glId,
          academicYearId: yearId,
          name: `${glNames[i] ?? `Grade ${i + 7}`}A`,
          homeroomTeacherId: teacherId,
        }))
      )
      .returning();
    classIds = inserted.map((c) => c.id);
    console.log(`Created ${classIds.length} classes`);
  }

  // --- Class Sections (3 subjects per class) ---
  let sectionRows: { id: string; classId: string }[];
  const existingSections = await db.select({ id: classSections.id, classId: classSections.classId }).from(classSections);
  if (existingSections.length > 0) {
    sectionRows = existingSections;
    console.log(`Using ${existingSections.length} existing class sections`);
  } else {
    const vals: { tenantId: string; classId: string; subjectId: string; teacherId: string; termId: string }[] = [];
    for (const classId of classIds) {
      for (let si = 0; si < Math.min(3, subjectIds.length); si++) {
        vals.push({ tenantId, classId, subjectId: subjectIds[si], teacherId, termId: term1Id });
      }
    }
    const inserted = await db.insert(classSections).values(vals).returning();
    sectionRows = inserted.map((s) => ({ id: s.id, classId: s.classId }));
    console.log(`Created ${sectionRows.length} class sections`);
  }

  // --- Students (20 total) ---
  const studentNames = [
    { first: "Aiden", last: "Chen" }, { first: "Sofia", last: "Martinez" },
    { first: "Kai", last: "Tanaka" }, { first: "Mia", last: "Johnson" },
    { first: "Liam", last: "Kim" }, { first: "Emma", last: "Williams" },
    { first: "Noah", last: "Singh" }, { first: "Ava", last: "Brown" },
    { first: "Oliver", last: "Lee" }, { first: "Isabella", last: "Patel" },
    { first: "Lucas", last: "Nguyen" }, { first: "Chloe", last: "Garcia" },
    { first: "Ethan", last: "Muller" }, { first: "Zara", last: "Ali" },
    { first: "James", last: "Nakamura" }, { first: "Lily", last: "Anderson" },
    { first: "Benjamin", last: "Sato" }, { first: "Hannah", last: "Okonkwo" },
    { first: "Daniel", last: "Costa" }, { first: "Sophie", last: "Johansson" },
  ];
  let studentIds: string[];
  const existingStudents = await db.select().from(students);
  if (existingStudents.length > 0) {
    studentIds = existingStudents.map((s) => s.id);
    console.log(`Using ${existingStudents.length} existing students`);
  } else {
    const nationalities = ["Thai", "Japanese", "American", "Korean", "British"];
    const languages = ["Thai", "Japanese", "English", "Korean", "English"];
    const inserted = await db
      .insert(students)
      .values(
        studentNames.map((s, i) => ({
          tenantId,
          studentNumber: `STU-${String(i + 1).padStart(4, "0")}`,
          firstName: s.first,
          lastName: s.last,
          dateOfBirth: new Date(`${2010 + (i % 4)}-${String((i % 12) + 1).padStart(2, "0")}-${String((i % 28) + 1).padStart(2, "0")}`),
          nationality: nationalities[i % 5],
          primaryLanguage: languages[i % 5],
          enrollmentDate: new Date("2025-08-15"),
          status: "active" as const,
        }))
      )
      .returning();
    studentIds = inserted.map((s) => s.id);
    console.log(`Created ${studentIds.length} students`);
  }

  // --- Class Enrollments (5 students per class) ---
  const existingEnrollments = await db.select({ id: classEnrollments.id }).from(classEnrollments).limit(1);
  if (existingEnrollments.length > 0) {
    console.log(`Using existing enrollments`);
  } else {
    const vals: { classId: string; studentId: string }[] = [];
    for (let ci = 0; ci < classIds.length; ci++) {
      const start = ci * 5;
      const end = Math.min(start + 5, studentIds.length);
      for (let si = start; si < end; si++) {
        vals.push({ classId: classIds[ci], studentId: studentIds[si] });
      }
    }
    await db.insert(classEnrollments).values(vals);
    console.log(`Enrolled students (5 per class, ${vals.length} total)`);
  }

  // --- Guardians (5 guardians for first 5 students) ---
  const existingGuardians = await db.select({ id: guardians.id }).from(guardians).limit(1);
  if (existingGuardians.length > 0) {
    console.log(`Using existing guardians`);
  } else {
    const gData = [
      { firstName: "Wei", lastName: "Chen", relationship: "Father", phone: "+66-81-234-5678", email: "wei.chen@email.com" },
      { firstName: "Maria", lastName: "Martinez", relationship: "Mother", phone: "+66-82-345-6789", email: "maria.m@email.com" },
      { firstName: "Yuki", lastName: "Tanaka", relationship: "Mother", phone: "+66-83-456-7890", email: "yuki.t@email.com" },
      { firstName: "Robert", lastName: "Johnson", relationship: "Father", phone: "+66-84-567-8901", email: "robert.j@email.com" },
      { firstName: "Ji-Hye", lastName: "Kim", relationship: "Mother", phone: "+66-85-678-9012", email: "jihye.k@email.com" },
    ];
    for (let i = 0; i < gData.length; i++) {
      const [g] = await db
        .insert(guardians)
        .values({ tenantId, ...gData[i], isEmergencyContact: true })
        .returning();
      await db.insert(studentGuardians).values({ studentId: studentIds[i], guardianId: g.id });
    }
    console.log(`Created 5 guardians`);
  }

  // --- Grading Scales ---
  let scaleId: string;
  const existingScales = await db.select().from(gradingScales).limit(1);
  if (existingScales.length > 0) {
    scaleId = existingScales[0].id;
    console.log(`Using existing grading scale`);
  } else {
    const [scale] = await db
      .insert(gradingScales)
      .values([
        {
          tenantId,
          name: "IB (1-7)",
          type: "numeric",
          scaleDefinition: { min: 1, max: 7, grades: [{ label: "7", min: 90 }, { label: "6", min: 80 }, { label: "5", min: 70 }, { label: "4", min: 55 }, { label: "3", min: 40 }, { label: "2", min: 25 }, { label: "1", min: 0 }] },
          isDefault: true,
        },
        {
          tenantId,
          name: "Percentage (0-100)",
          type: "percentage",
          scaleDefinition: { min: 0, max: 100 },
          isDefault: false,
        },
      ])
      .returning();
    scaleId = scale.id;
    console.log(`Created 2 grading scales`);
  }

  // --- Attendance Records (last 5 weekdays) ---
  const existingAttendance = await db.select({ id: attendanceRecords.id }).from(attendanceRecords).limit(1);
  if (existingAttendance.length > 0) {
    console.log(`Using existing attendance records`);
  } else {
    const statusPool = ["present", "present", "present", "present", "absent", "late", "excused", "present", "present", "present"] as const;
    const schoolDays: Date[] = [];
    const d = new Date();
    while (schoolDays.length < 5) {
      d.setDate(d.getDate() - 1);
      if (d.getDay() !== 0 && d.getDay() !== 6) schoolDays.push(new Date(d));
    }

    let count = 0;
    for (const day of schoolDays) {
      for (let ci = 0; ci < classIds.length; ci++) {
        const section = sectionRows.find((s) => s.classId === classIds[ci]);
        if (!section) continue;
        const start = ci * 5;
        const end = Math.min(start + 5, studentIds.length);
        const vals: {
          tenantId: string;
          studentId: string;
          classSectionId: string;
          date: Date;
          status: "present" | "absent" | "late" | "excused";
          period: number;
          recordedById: string;
        }[] = [];
        for (let si = start; si < end; si++) {
          vals.push({
            tenantId,
            studentId: studentIds[si],
            classSectionId: section.id,
            date: day,
            status: statusPool[(si + schoolDays.indexOf(day)) % statusPool.length],
            period: 1,
            recordedById: teacherId,
          });
        }
        await db.insert(attendanceRecords).values(vals).onConflictDoNothing();
        count += vals.length;
      }
    }
    console.log(`Created ${count} attendance records (5 days)`);
  }

  // --- Assessments & Grades ---
  const existingAssessments = await db.select({ id: assessments.id }).from(assessments).limit(1);
  if (existingAssessments.length > 0) {
    console.log(`Using existing assessments`);
  } else {
    const types = [
      { name: "Midterm Exam", type: "exam" as const, maxScore: 100, weight: 40 },
      { name: "Project 1", type: "project" as const, maxScore: 50, weight: 30 },
      { name: "Quiz 1", type: "quiz" as const, maxScore: 20, weight: 15 },
    ];
    let assessCount = 0;
    let gradeCount = 0;

    for (const section of sectionRows) {
      const classIdx = classIds.indexOf(section.classId);
      const studentStart = classIdx * 5;
      const studentEnd = Math.min(studentStart + 5, studentIds.length);

      for (const t of types) {
        const [assessment] = await db
          .insert(assessments)
          .values({
            tenantId,
            classSectionId: section.id,
            name: t.name,
            type: t.type,
            gradingScaleId: scaleId,
            maxScore: t.maxScore.toString(),
            weight: t.weight.toString(),
            dueDate: new Date("2025-11-15"),
            isPublished: true,
          })
          .returning();
        assessCount++;

        const gradeVals: {
          tenantId: string;
          assessmentId: string;
          studentId: string;
          score: string;
          letterGrade: string;
          gradedById: string;
        }[] = [];
        for (let si = studentStart; si < studentEnd; si++) {
          const score = Math.round(55 + Math.random() * 40);
          const pct = score / t.maxScore;
          const lg = pct >= 0.9 ? "7" : pct >= 0.8 ? "6" : pct >= 0.7 ? "5" : pct >= 0.55 ? "4" : "3";
          gradeVals.push({
            tenantId,
            assessmentId: assessment.id,
            studentId: studentIds[si],
            score: score.toString(),
            letterGrade: lg,
            gradedById: teacherId,
          });
        }
        await db.insert(grades).values(gradeVals).onConflictDoNothing();
        gradeCount += gradeVals.length;
      }
    }
    console.log(`Created ${assessCount} assessments, ${gradeCount} grades`);
  }

  // --- Fee Structures & Invoices ---
  const existingFees = await db.select({ id: feeStructures.id }).from(feeStructures).limit(1);
  if (existingFees.length > 0) {
    console.log(`Using existing fee structures`);
  } else {
    const [tuition] = await db
      .insert(feeStructures)
      .values([
        { tenantId, name: "Tuition Fee", academicYearId: yearId, amount: "450000", currency: "THB", frequency: "annual" },
        { tenantId, name: "Activities Fee", academicYearId: yearId, amount: "25000", currency: "THB", frequency: "semester" },
      ])
      .returning();
    console.log(`Created 2 fee structures`);

    // Invoices for first 10 students
    let invCount = 0;
    for (let i = 0; i < Math.min(10, studentIds.length); i++) {
      const isPaid = i < 3;
      const isPartial = i >= 3 && i < 6;
      const paidAmt = isPaid ? "450000" : isPartial ? `${150000 * (1 + (i % 2))}` : "0";
      const status = isPaid ? "paid" : isPartial ? "partial" : "pending";

      const [inv] = await db
        .insert(invoices)
        .values({
          tenantId,
          studentId: studentIds[i],
          feeStructureId: tuition.id,
          amount: "450000",
          currency: "THB",
          dueDate: new Date("2025-10-01"),
          status,
          paidAmount: paidAmt,
        })
        .returning();
      invCount++;

      if (isPaid || isPartial) {
        await db.insert(payments).values({
          tenantId,
          invoiceId: inv.id,
          amount: paidAmt,
          method: "bank_transfer",
          referenceNumber: `REF-${String(i + 1).padStart(4, "0")}`,
          receivedAt: new Date("2025-09-20"),
        });
      }
    }
    console.log(`Created ${invCount} invoices with payments`);
  }

  // --- Report Cards ---
  const existingRC = await db.select({ id: reportCards.id }).from(reportCards).limit(1);
  if (existingRC.length > 0) {
    console.log(`Using existing report cards`);
  } else {
    const rcStatuses = ["draft", "draft", "submitted", "submitted", "approved", "published"] as const;
    const vals = rcStatuses.map((status, i) => ({
      tenantId,
      studentId: studentIds[i],
      termId: term1Id,
      status,
    }));
    await db.insert(reportCards).values(vals);
    console.log(`Created ${vals.length} report cards`);
  }

  console.log("\n--- Seed complete! ---");
  console.log(`Tenant ID: ${tenantId}`);
  console.log(`20 students, 4 classes, 12 class sections`);
  console.log(`Attendance, grades, fee invoices, report cards all populated.`);;

  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
