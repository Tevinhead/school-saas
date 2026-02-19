import { db } from "./index";
import { sql as dsql } from "drizzle-orm";
import {
  tenants, academicYears, terms, gradeLevels, subjects, classes,
  classSections, students, classEnrollments, guardians, studentGuardians,
  userProfiles, gradingScales, assessments, grades, attendanceRecords,
  feeStructures, invoices, payments, reportCards, announcements,
  messageThreads, messages, threadParticipants,
  periods, timetableEntries, substitutions,
  applications, applicationInterviews, waitlistEntries,
} from "./schema";
import {
  FIRST_NAMES_MALE, FIRST_NAMES_FEMALE, LAST_NAMES, NATIONALITIES, LANGUAGES,
  GUARDIAN_RELATIONSHIPS, SUBJECT_PRESETS, ANNOUNCEMENT_DATA, ASSESSMENT_TYPES, seededRandom,
} from "./seed-data";

const rand = seededRandom(42);

function pick<T>(arr: T[]): T {
  return arr[Math.floor(rand() * arr.length)];
}

function bellCurve(mean: number, stddev: number, min: number, max: number): number {
  // Box-Muller transform
  const u1 = rand();
  const u2 = rand();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return Math.max(min, Math.min(max, Math.round(mean + z * stddev)));
}

function getWeekdays(start: Date, end: Date): Date[] {
  const days: Date[] = [];
  const d = new Date(start);
  while (d <= end) {
    if (d.getDay() !== 0 && d.getDay() !== 6) {
      days.push(new Date(d));
    }
    d.setDate(d.getDate() + 1);
  }
  return days;
}

async function seed() {
  console.log("Seeding database (enhanced)...\n");

  // --- Tenant ---
  const tenantId = process.env.TENANT_ID || "org_39n7rluabtOAtn1Hvu8d3HM0ThY";
  const existingTenants = await db.select().from(tenants).limit(1);
  if (existingTenants.length > 0) {
    console.log(`Using existing tenant: ${existingTenants[0].name}`);
  } else {
    await db.insert(tenants).values({
      id: tenantId, name: "Raintree International School", slug: "raintree",
      timezone: "Asia/Bangkok", defaultLocale: "en", defaultCurrency: "THB", academicYearStartMonth: "08",
    });
    console.log("Created tenant: Raintree International School");
  }

  // --- User Profiles (5 teachers + 1 admin) ---
  const teacherNames = [
    { first: "Sarah", last: "Thompson", email: "s.thompson@raintree.school" },
    { first: "David", last: "Nakamura", email: "d.nakamura@raintree.school" },
    { first: "Lisa", last: "Williams", email: "l.williams@raintree.school" },
    { first: "Michael", last: "Chen", email: "m.chen@raintree.school" },
    { first: "Ananya", last: "Sharma", email: "a.sharma@raintree.school" },
  ];
  let teacherIds: string[];
  let adminId: string;
  const existingUsers = await db.select().from(userProfiles);
  if (existingUsers.length >= 5) {
    teacherIds = existingUsers.filter(u => u.role === "teacher").map(u => u.id);
    adminId = existingUsers.find(u => u.role === "school_admin")?.id ?? existingUsers[0].id;
    if (teacherIds.length === 0) teacherIds = [existingUsers[0].id];
    console.log(`Using ${existingUsers.length} existing user profiles`);
  } else {
    const [admin] = await db.insert(userProfiles).values({
      tenantId, clerkUserId: "seed_admin", role: "school_admin",
      firstName: "Admin", lastName: "User", email: "admin@raintree.school",
    }).returning();
    adminId = admin.id;

    const insertedTeachers = [];
    for (let i = 0; i < teacherNames.length; i++) {
      const [t] = await db.insert(userProfiles).values({
        tenantId, clerkUserId: `seed_teacher_${i}`, role: "teacher",
        firstName: teacherNames[i].first, lastName: teacherNames[i].last, email: teacherNames[i].email,
      }).returning();
      insertedTeachers.push(t);
    }
    teacherIds = insertedTeachers.map(t => t.id);
    console.log("Created 1 admin + 5 teacher profiles");
  }

  // --- Academic Year ---
  let yearId: string;
  const existingYears = await db.select().from(academicYears).limit(1);
  if (existingYears.length > 0) {
    yearId = existingYears[0].id;
    console.log("Using existing academic year");
  } else {
    const [year] = await db.insert(academicYears).values({
      tenantId, name: "2025-2026", startDate: new Date("2025-08-15"), endDate: new Date("2026-06-30"), isCurrent: true,
    }).returning();
    yearId = year.id;
    console.log("Created academic year: 2025-2026");
  }

  // --- Terms (4 terms) ---
  let termIds: string[];
  const existingTerms = await db.select().from(terms);
  if (existingTerms.length > 0) {
    termIds = existingTerms.map(t => t.id);
    console.log(`Using ${existingTerms.length} existing terms`);
  } else {
    const termData = [
      { name: "Term 1", startDate: new Date("2025-08-15"), endDate: new Date("2025-10-31") },
      { name: "Term 2", startDate: new Date("2025-11-03"), endDate: new Date("2025-12-20") },
      { name: "Term 3", startDate: new Date("2026-01-12"), endDate: new Date("2026-03-27") },
      { name: "Term 4", startDate: new Date("2026-04-13"), endDate: new Date("2026-06-30") },
    ];
    const inserted = await db.insert(terms).values(
      termData.map(t => ({ tenantId, academicYearId: yearId, ...t }))
    ).returning();
    termIds = inserted.map(t => t.id);
    console.log("Created 4 terms");
  }

  // --- Grade Levels ---
  const glNames = ["Grade 7", "Grade 8", "Grade 9", "Grade 10"];
  let gradeLevelIds: string[];
  const existingGl = await db.select().from(gradeLevels);
  if (existingGl.length > 0) {
    gradeLevelIds = existingGl.map(g => g.id);
    console.log(`Using ${existingGl.length} existing grade levels`);
  } else {
    const inserted = await db.insert(gradeLevels).values(
      glNames.map((name, i) => ({ tenantId, name, sortOrder: i + 1, curriculum: "IB MYP" }))
    ).returning();
    gradeLevelIds = inserted.map(g => g.id);
    console.log(`Created ${glNames.length} grade levels`);
  }

  // --- Subjects (first 5 from presets) ---
  const subjectData = SUBJECT_PRESETS.slice(0, 5);
  let subjectIds: string[];
  const existingSubj = await db.select().from(subjects);
  if (existingSubj.length > 0) {
    subjectIds = existingSubj.map(s => s.id);
    console.log(`Using ${existingSubj.length} existing subjects`);
  } else {
    const inserted = await db.insert(subjects).values(
      subjectData.map(s => ({ tenantId, ...s, curriculum: "IB MYP" }))
    ).returning();
    subjectIds = inserted.map(s => s.id);
    console.log(`Created ${subjectData.length} subjects`);
  }

  // --- Classes (2 per grade = 8 total) ---
  let classIds: string[];
  const existingClasses = await db.select().from(classes);
  if (existingClasses.length > 0) {
    classIds = existingClasses.map(c => c.id);
    console.log(`Using ${existingClasses.length} existing classes`);
  } else {
    const classVals = gradeLevelIds.flatMap((glId, i) => [
      { tenantId, gradeLevelId: glId, academicYearId: yearId, name: `${glNames[i]}A`, homeroomTeacherId: teacherIds[i % teacherIds.length] },
      { tenantId, gradeLevelId: glId, academicYearId: yearId, name: `${glNames[i]}B`, homeroomTeacherId: teacherIds[(i + 1) % teacherIds.length] },
    ]);
    const inserted = await db.insert(classes).values(classVals).returning();
    classIds = inserted.map(c => c.id);
    console.log(`Created ${classIds.length} classes`);
  }

  // --- Class Sections (all 5 subjects per class) ---
  let sectionRows: { id: string; classId: string }[];
  const existingSections = await db.select({ id: classSections.id, classId: classSections.classId }).from(classSections);
  if (existingSections.length > 0) {
    sectionRows = existingSections;
    console.log(`Using ${existingSections.length} existing class sections`);
  } else {
    const vals: { tenantId: string; classId: string; subjectId: string; teacherId: string; termId: string }[] = [];
    for (const classId of classIds) {
      for (const subjectId of subjectIds) {
        vals.push({ tenantId, classId, subjectId, teacherId: pick(teacherIds), termId: termIds[0] });
      }
    }
    const inserted = await db.insert(classSections).values(vals).returning();
    sectionRows = inserted.map(s => ({ id: s.id, classId: s.classId }));
    console.log(`Created ${sectionRows.length} class sections`);
  }

  // --- Students (75 total) ---
  let studentIds: string[];
  const existingStudents = await db.select().from(students);
  if (existingStudents.length > 0) {
    studentIds = existingStudents.map(s => s.id);
    console.log(`Using ${existingStudents.length} existing students`);
  } else {
    const studentVals = [];
    for (let i = 0; i < 75; i++) {
      const isMale = rand() > 0.5;
      const first = isMale ? pick(FIRST_NAMES_MALE) : pick(FIRST_NAMES_FEMALE);
      const last = pick(LAST_NAMES);
      const natIdx = i % NATIONALITIES.length;
      const year = 2010 + (i % 4);
      const month = (i % 12) + 1;
      const day = (i % 28) + 1;
      const enrollMonth = i < 50 ? "08" : `${9 + (i % 3)}`.padStart(2, "0");
      studentVals.push({
        tenantId,
        studentNumber: `STU-${String(i + 1).padStart(4, "0")}`,
        firstName: first,
        lastName: last,
        dateOfBirth: new Date(`${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`),
        nationality: NATIONALITIES[natIdx],
        primaryLanguage: LANGUAGES[natIdx],
        enrollmentDate: new Date(`2025-${enrollMonth}-15`),
        status: "active" as const,
      });
    }
    const inserted = await db.insert(students).values(studentVals).returning();
    studentIds = inserted.map(s => s.id);
    console.log(`Created ${studentIds.length} students`);
  }

  // --- Class Enrollments (~9-10 students per class) ---
  const existingEnrollments = await db.select({ id: classEnrollments.id }).from(classEnrollments).limit(1);
  if (existingEnrollments.length > 0) {
    console.log("Using existing enrollments");
  } else {
    const vals: { classId: string; studentId: string }[] = [];
    const studentsPerClass = Math.ceil(studentIds.length / classIds.length);
    for (let ci = 0; ci < classIds.length; ci++) {
      const start = ci * studentsPerClass;
      const end = Math.min(start + studentsPerClass, studentIds.length);
      for (let si = start; si < end; si++) {
        vals.push({ classId: classIds[ci], studentId: studentIds[si] });
      }
    }
    await db.insert(classEnrollments).values(vals);
    console.log(`Enrolled ${vals.length} students (~${studentsPerClass} per class)`);
  }

  // --- Guardians (50+ guardians, 1-2 per student) ---
  const existingGuardians = await db.select({ id: guardians.id }).from(guardians).limit(1);
  if (existingGuardians.length > 0) {
    console.log("Using existing guardians");
  } else {
    let gCount = 0;
    for (let i = 0; i < studentIds.length; i++) {
      const numGuardians = rand() > 0.3 ? 2 : 1;
      for (let g = 0; g < numGuardians; g++) {
        const isFather = g === 0;
        const gFirst = isFather ? pick(FIRST_NAMES_MALE) : pick(FIRST_NAMES_FEMALE);
        const gLast = LAST_NAMES[i % LAST_NAMES.length];
        const [guardian] = await db.insert(guardians).values({
          tenantId,
          firstName: gFirst,
          lastName: gLast,
          relationship: isFather ? "Father" : "Mother",
          phone: `+66-${80 + (i % 10)}-${String(100 + i).padStart(3, "0")}-${String(1000 + gCount).padStart(4, "0")}`,
          email: `${gFirst.toLowerCase()}.${gLast.toLowerCase()}${i}@email.com`,
          isEmergencyContact: g === 0,
        }).returning();
        await db.insert(studentGuardians).values({ studentId: studentIds[i], guardianId: guardian.id });
        gCount++;
      }
    }
    console.log(`Created ${gCount} guardians`);
  }

  // --- Grading Scales ---
  let scaleId: string;
  const existingScales = await db.select().from(gradingScales).limit(1);
  if (existingScales.length > 0) {
    scaleId = existingScales[0].id;
    console.log("Using existing grading scales");
  } else {
    const [scale] = await db.insert(gradingScales).values([
      {
        tenantId, name: "IB (1-7)", type: "numeric",
        scaleDefinition: { min: 1, max: 7, grades: [{ label: "7", min: 90 }, { label: "6", min: 80 }, { label: "5", min: 70 }, { label: "4", min: 55 }, { label: "3", min: 40 }, { label: "2", min: 25 }, { label: "1", min: 0 }] },
        isDefault: true,
      },
      {
        tenantId, name: "Percentage (0-100)", type: "percentage",
        scaleDefinition: { min: 0, max: 100 }, isDefault: false,
      },
    ]).returning();
    scaleId = scale.id;
    console.log("Created 2 grading scales");
  }

  // --- Attendance Records (60+ school days: Aug 15 - Oct 31) ---
  const existingAttendance = await db.select({ id: attendanceRecords.id }).from(attendanceRecords).limit(1);
  if (existingAttendance.length > 0) {
    console.log("Using existing attendance records");
  } else {
    const schoolDays = getWeekdays(new Date("2025-08-15"), new Date("2025-10-31"));
    console.log(`Generating attendance for ${schoolDays.length} school days...`);
    let count = 0;

    // Some students are chronically absent (indices 5, 15, 30)
    const chronicAbsent = new Set([5, 15, 30]);
    const studentsPerClass = Math.ceil(studentIds.length / classIds.length);

    for (const day of schoolDays) {
      const isMonday = day.getDay() === 1;
      const batchVals: {
        tenantId: string; studentId: string; classSectionId: string;
        date: Date; status: "present" | "absent" | "late" | "excused"; period: number; recordedById: string;
      }[] = [];

      for (let ci = 0; ci < classIds.length; ci++) {
        const section = sectionRows.find(s => s.classId === classIds[ci]);
        if (!section) continue;
        const start = ci * studentsPerClass;
        const end = Math.min(start + studentsPerClass, studentIds.length);

        for (let si = start; si < end; si++) {
          let status: "present" | "absent" | "late" | "excused";
          const r = rand();

          if (chronicAbsent.has(si)) {
            status = r < 0.4 ? "absent" : r < 0.5 ? "late" : "present";
          } else if (isMonday) {
            status = r < 0.05 ? "absent" : r < 0.15 ? "late" : "present";
          } else {
            status = r < 0.03 ? "absent" : r < 0.06 ? "late" : r < 0.08 ? "excused" : "present";
          }

          batchVals.push({
            tenantId, studentId: studentIds[si], classSectionId: section.id,
            date: day, status, period: 1, recordedById: pick(teacherIds),
          });
        }
      }
      if (batchVals.length > 0) {
        await db.insert(attendanceRecords).values(batchVals).onConflictDoNothing();
        count += batchVals.length;
      }
    }
    console.log(`Created ${count} attendance records (${schoolDays.length} days)`);
  }

  // --- Assessments & Grades (8 per section, bell-curve) ---
  const existingAssessments = await db.select({ id: assessments.id }).from(assessments).limit(1);
  if (existingAssessments.length > 0) {
    console.log("Using existing assessments");
  } else {
    let assessCount = 0;
    let gradeCount = 0;
    const studentsPerClass = Math.ceil(studentIds.length / classIds.length);

    for (const section of sectionRows) {
      const classIdx = classIds.indexOf(section.classId);
      const studentStart = classIdx * studentsPerClass;
      const studentEnd = Math.min(studentStart + studentsPerClass, studentIds.length);

      for (const aType of ASSESSMENT_TYPES) {
        const [assessment] = await db.insert(assessments).values({
          tenantId, classSectionId: section.id, name: aType.name, type: aType.type,
          gradingScaleId: scaleId, maxScore: aType.maxScore.toString(), weight: aType.weight.toString(),
          dueDate: new Date("2025-11-15"), isPublished: true,
        }).returning();
        assessCount++;

        const gradeVals: {
          tenantId: string; assessmentId: string; studentId: string;
          score: string; letterGrade: string; gradedById: string;
        }[] = [];
        for (let si = studentStart; si < studentEnd; si++) {
          const score = bellCurve(aType.maxScore * 0.72, aType.maxScore * 0.15, 0, aType.maxScore);
          const pct = score / aType.maxScore;
          const lg = pct >= 0.9 ? "7" : pct >= 0.8 ? "6" : pct >= 0.7 ? "5" : pct >= 0.55 ? "4" : pct >= 0.4 ? "3" : pct >= 0.25 ? "2" : "1";
          gradeVals.push({
            tenantId, assessmentId: assessment.id, studentId: studentIds[si],
            score: score.toString(), letterGrade: lg, gradedById: pick(teacherIds),
          });
        }
        await db.insert(grades).values(gradeVals).onConflictDoNothing();
        gradeCount += gradeVals.length;
      }
    }
    console.log(`Created ${assessCount} assessments, ${gradeCount} grades`);
  }

  // --- Fee Structures & Invoices (all 75 students) ---
  const existingFees = await db.select({ id: feeStructures.id }).from(feeStructures).limit(1);
  if (existingFees.length > 0) {
    console.log("Using existing fee structures");
  } else {
    const feeRows = await db.insert(feeStructures).values([
      { tenantId, name: "Tuition Fee", academicYearId: yearId, amount: "450000", currency: "THB", frequency: "annual" },
      { tenantId, name: "Activities Fee", academicYearId: yearId, amount: "25000", currency: "THB", frequency: "semester" },
    ]).returning();
    const tuitionId = feeRows[0].id;
    console.log("Created 2 fee structures");

    let invCount = 0;
    for (let i = 0; i < studentIds.length; i++) {
      const r = rand();
      let status: "paid" | "partial" | "pending" | "overdue";
      let paidAmt: string;

      if (r < 0.30) { status = "paid"; paidAmt = "450000"; }
      else if (r < 0.50) { status = "partial"; paidAmt = `${Math.round(150000 + rand() * 200000)}`; }
      else if (r < 0.80) { status = "pending"; paidAmt = "0"; }
      else { status = "overdue"; paidAmt = "0"; }

      const [inv] = await db.insert(invoices).values({
        tenantId, studentId: studentIds[i], feeStructureId: tuitionId,
        amount: "450000", currency: "THB", dueDate: new Date("2025-10-01"),
        status, paidAmount: paidAmt,
      }).returning();
      invCount++;

      if (status === "paid" || status === "partial") {
        const payDay = new Date("2025-09-01");
        payDay.setDate(payDay.getDate() + Math.floor(rand() * 30));
        await db.insert(payments).values({
          tenantId, invoiceId: inv.id, amount: paidAmt,
          method: pick(["cash", "bank_transfer", "card", "cheque"] as const),
          referenceNumber: `REF-${String(i + 1).padStart(4, "0")}`,
          receivedAt: payDay,
        });
      }
    }
    console.log(`Created ${invCount} invoices with payments`);
  }

  // --- Report Cards (all students for term 1) ---
  const existingRC = await db.select({ id: reportCards.id }).from(reportCards).limit(1);
  if (existingRC.length > 0) {
    console.log("Using existing report cards");
  } else {
    const statuses = ["draft", "submitted", "approved", "published"] as const;
    const teacherComments = [
      "Excellent progress this term. Keep up the great work!",
      "Consistent effort shown. Could improve in class participation.",
      "Strong academic performance. Needs to work on homework completion.",
      "Good improvement over the term. Shows potential in STEM subjects.",
      "Satisfactory progress. More focus needed on assessments.",
    ];
    const rcVals = studentIds.map((sid, i) => ({
      tenantId, studentId: sid, termId: termIds[0],
      status: statuses[i % statuses.length],
      comments: [{ classSectionId: sectionRows[0]?.id ?? "", subjectName: "General", comment: teacherComments[i % teacherComments.length] }],
    }));
    await db.insert(reportCards).values(rcVals);
    console.log(`Created ${rcVals.length} report cards`);
  }

  // --- Announcements ---
  const existingAnn = await db.select({ id: announcements.id }).from(announcements).limit(1);
  if (existingAnn.length > 0) {
    console.log("Using existing announcements");
  } else {
    await db.insert(announcements).values(
      ANNOUNCEMENT_DATA.map(a => ({ tenantId, ...a, authorId: adminId }))
    );
    console.log(`Created ${ANNOUNCEMENT_DATA.length} announcements`);
  }

  // --- Message Threads ---
  const existingThreads = await db.select({ id: messageThreads.id }).from(messageThreads).limit(1);
  if (existingThreads.length > 0) {
    console.log("Using existing message threads");
  } else {
    const threadData = [
      { subject: "Question about Math homework", body: "Hi, my child is having trouble with the calculus homework. Could you provide some extra resources?" },
      { subject: "Absence notification", body: "I wanted to let you know that my child will be absent tomorrow due to a doctor's appointment." },
      { subject: "Sports Day volunteering", body: "I'm interested in volunteering for Sports Day. How can I sign up?" },
    ];
    for (const td of threadData) {
      const [thread] = await db.insert(messageThreads).values({
        tenantId, subject: td.subject,
      }).returning();
      await db.insert(messages).values({
        tenantId, threadId: thread.id, senderId: adminId, body: td.body,
      });
      await db.insert(threadParticipants).values([
        { threadId: thread.id, userId: adminId },
        { threadId: thread.id, userId: teacherIds[0] },
      ]);
    }
    console.log(`Created ${threadData.length} message threads`);
  }

  // --- Periods (10: 8 teaching + 2 breaks) ---
  let periodIds: string[];
  const existingPeriods = await db.select().from(periods).limit(1);
  if (existingPeriods.length > 0) {
    const allPeriods = await db.select().from(periods);
    periodIds = allPeriods.map(p => p.id);
    console.log(`Using ${allPeriods.length} existing periods`);
  } else {
    const periodData = [
      { name: "Period 1", shortName: "P1", sortOrder: 0, startTime: "08:00", endTime: "08:45", isBreak: false },
      { name: "Period 2", shortName: "P2", sortOrder: 1, startTime: "08:50", endTime: "09:35", isBreak: false },
      { name: "Period 3", shortName: "P3", sortOrder: 2, startTime: "09:40", endTime: "10:25", isBreak: false },
      { name: "Morning Break", shortName: "Break", sortOrder: 3, startTime: "10:25", endTime: "10:45", isBreak: true },
      { name: "Period 4", shortName: "P4", sortOrder: 4, startTime: "10:45", endTime: "11:30", isBreak: false },
      { name: "Period 5", shortName: "P5", sortOrder: 5, startTime: "11:35", endTime: "12:20", isBreak: false },
      { name: "Lunch", shortName: "Lunch", sortOrder: 6, startTime: "12:20", endTime: "13:10", isBreak: true },
      { name: "Period 6", shortName: "P6", sortOrder: 7, startTime: "13:10", endTime: "13:55", isBreak: false },
      { name: "Period 7", shortName: "P7", sortOrder: 8, startTime: "14:00", endTime: "14:45", isBreak: false },
      { name: "Period 8", shortName: "P8", sortOrder: 9, startTime: "14:50", endTime: "15:35", isBreak: false },
    ];
    const inserted = await db.insert(periods).values(
      periodData.map(p => ({ tenantId, ...p }))
    ).returning();
    periodIds = inserted.map(p => p.id);
    console.log(`Created ${periodData.length} periods (8 teaching + 2 breaks)`);
  }

  // --- Timetable Entries (all 8 classes × 5 days × 8 teaching periods) ---
  const existingEntries = await db.select({ id: timetableEntries.id }).from(timetableEntries).limit(1);
  if (existingEntries.length > 0) {
    console.log("Using existing timetable entries");
  } else {
    const days = ["monday", "tuesday", "wednesday", "thursday", "friday"];
    const teachingPeriodIds = periodIds.filter((_, i) => {
      // indices 3 and 6 are breaks (Morning Break and Lunch)
      return i !== 3 && i !== 6;
    });
    const rooms = ["A101", "A102", "A103", "B201", "B202", "B203", "C301", "C302"];
    let entryCount = 0;

    for (let ci = 0; ci < classIds.length; ci++) {
      const classId = classIds[ci];
      // Get class sections for this class to find subject/teacher combos
      const classSecs = sectionRows.filter(s => s.classId === classId);

      const entryVals: {
        tenantId: string; termId: string; classId: string; periodId: string;
        dayOfWeek: string; subjectId: string; teacherId: string; room: string;
      }[] = [];

      for (const day of days) {
        for (let pi = 0; pi < teachingPeriodIds.length; pi++) {
          // Round-robin subjects across periods
          const sectionIdx = (pi + days.indexOf(day)) % Math.max(classSecs.length, 1);
          // We need the actual section data to get subjectId and teacherId
          // Since sectionRows only has id and classId, we'll use subjectIds and teacherIds
          const subjectIdx = (pi + days.indexOf(day)) % subjectIds.length;
          const teacherIdx = (pi + ci) % teacherIds.length;

          entryVals.push({
            tenantId,
            termId: termIds[0],
            classId,
            periodId: teachingPeriodIds[pi],
            dayOfWeek: day,
            subjectId: subjectIds[subjectIdx],
            teacherId: teacherIds[teacherIdx],
            room: rooms[(ci + pi) % rooms.length],
          });
        }
      }

      if (entryVals.length > 0) {
        await db.insert(timetableEntries).values(entryVals).onConflictDoNothing();
        entryCount += entryVals.length;
      }
    }
    console.log(`Created ${entryCount} timetable entries`);
  }

  // --- Substitutions (3 sample) ---
  const existingSubs = await db.select({ id: substitutions.id }).from(substitutions).limit(1);
  if (existingSubs.length > 0) {
    console.log("Using existing substitutions");
  } else {
    // Get some timetable entries to create substitutions for
    const someEntries = await db.select().from(timetableEntries).limit(3);
    if (someEntries.length >= 3) {
      const subVals = [
        {
          tenantId,
          timetableEntryId: someEntries[0].id,
          date: new Date("2025-09-15"),
          originalTeacherId: someEntries[0].teacherId,
          substituteTeacherId: teacherIds[(teacherIds.indexOf(someEntries[0].teacherId) + 1) % teacherIds.length],
          reason: "Sick leave",
        },
        {
          tenantId,
          timetableEntryId: someEntries[1].id,
          date: new Date("2025-09-22"),
          originalTeacherId: someEntries[1].teacherId,
          substituteTeacherId: teacherIds[(teacherIds.indexOf(someEntries[1].teacherId) + 2) % teacherIds.length],
          reason: "Conference attendance",
        },
        {
          tenantId,
          timetableEntryId: someEntries[2].id,
          date: new Date("2025-10-01"),
          originalTeacherId: someEntries[2].teacherId,
          substituteTeacherId: teacherIds[(teacherIds.indexOf(someEntries[2].teacherId) + 1) % teacherIds.length],
          reason: "Personal day",
          notes: "Lesson plan left on desk",
        },
      ];
      await db.insert(substitutions).values(subVals);
      console.log("Created 3 sample substitutions");
    }
  }

  // --- Admissions (18 applications across all 7 statuses) ---
  const existingApps = await db.select({ id: applications.id }).from(applications).limit(1);
  if (existingApps.length > 0) {
    console.log("Using existing admissions applications");
  } else {
    type AppStatus = "inquiry" | "applied" | "interviewed" | "accepted" | "enrolled" | "rejected" | "waitlisted";
    const appData: {
      status: AppStatus;
      studentFirstName: string;
      studentLastName: string;
      dateOfBirth: Date;
      gradeLevelIdx: number;
      guardianName: string;
      guardianEmail: string;
      guardianPhone: string;
      notes?: string;
      appliedAt: Date;
    }[] = [
      // inquiry (3) — July 2025
      { status: "inquiry", studentFirstName: "Liam", studentLastName: "Chen", dateOfBirth: new Date("2013-03-12"), gradeLevelIdx: 0, guardianName: "James Chen", guardianEmail: "james.chen@email.com", guardianPhone: "+66-81-234-5670", appliedAt: new Date("2025-07-01T09:00:00Z") },
      { status: "inquiry", studentFirstName: "Sofia", studentLastName: "Martinez", dateOfBirth: new Date("2012-08-22"), gradeLevelIdx: 1, guardianName: "Carlos Martinez", guardianEmail: "carlos.martinez@email.com", guardianPhone: "+66-82-345-6781", appliedAt: new Date("2025-07-03T10:30:00Z") },
      { status: "inquiry", studentFirstName: "Arjun", studentLastName: "Patel", dateOfBirth: new Date("2011-11-05"), gradeLevelIdx: 2, guardianName: "Ravi Patel", guardianEmail: "ravi.patel@email.com", guardianPhone: "+66-83-456-7892", appliedAt: new Date("2025-07-05T14:00:00Z") },
      // applied (4) — mid-July 2025
      { status: "applied", studentFirstName: "Emma", studentLastName: "Williams", dateOfBirth: new Date("2013-01-18"), gradeLevelIdx: 0, guardianName: "Sarah Williams", guardianEmail: "sarah.williams@email.com", guardianPhone: "+66-84-567-8903", appliedAt: new Date("2025-07-10T08:00:00Z") },
      { status: "applied", studentFirstName: "Kai", studentLastName: "Tanaka", dateOfBirth: new Date("2012-05-30"), gradeLevelIdx: 1, guardianName: "Hiroshi Tanaka", guardianEmail: "hiroshi.tanaka@email.com", guardianPhone: "+66-85-678-9014", appliedAt: new Date("2025-07-12T11:00:00Z") },
      { status: "applied", studentFirstName: "Mia", studentLastName: "Kim", dateOfBirth: new Date("2011-09-14"), gradeLevelIdx: 2, guardianName: "Ji-Yeon Kim", guardianEmail: "jiyeon.kim@email.com", guardianPhone: "+66-86-789-0125", appliedAt: new Date("2025-07-15T09:30:00Z") },
      { status: "applied", studentFirstName: "Lucas", studentLastName: "Garcia", dateOfBirth: new Date("2010-12-07"), gradeLevelIdx: 3, guardianName: "Miguel Garcia", guardianEmail: "miguel.garcia@email.com", guardianPhone: "+66-87-890-1236", appliedAt: new Date("2025-07-20T15:00:00Z") },
      // interviewed (3) — Aug 2025
      { status: "interviewed", studentFirstName: "Priya", studentLastName: "Singh", dateOfBirth: new Date("2013-04-25"), gradeLevelIdx: 0, guardianName: "Deepak Singh", guardianEmail: "deepak.singh@email.com", guardianPhone: "+66-88-901-2347", appliedAt: new Date("2025-08-01T10:00:00Z") },
      { status: "interviewed", studentFirstName: "Felix", studentLastName: "Muller", dateOfBirth: new Date("2012-07-19"), gradeLevelIdx: 1, guardianName: "Hans Muller", guardianEmail: "hans.muller@email.com", guardianPhone: "+66-89-012-3458", appliedAt: new Date("2025-08-05T09:00:00Z") },
      { status: "interviewed", studentFirstName: "Aisha", studentLastName: "Hassan", dateOfBirth: new Date("2011-02-28"), gradeLevelIdx: 2, guardianName: "Omar Hassan", guardianEmail: "omar.hassan@email.com", guardianPhone: "+66-80-123-4569", appliedAt: new Date("2025-08-10T13:00:00Z") },
      // accepted (3) — Sep 2025
      { status: "accepted", studentFirstName: "Noah", studentLastName: "Johnson", dateOfBirth: new Date("2013-06-11"), gradeLevelIdx: 0, guardianName: "Mark Johnson", guardianEmail: "mark.johnson@email.com", guardianPhone: "+66-81-234-5680", appliedAt: new Date("2025-09-01T08:00:00Z") },
      { status: "accepted", studentFirstName: "Yuki", studentLastName: "Sato", dateOfBirth: new Date("2012-03-03"), gradeLevelIdx: 1, guardianName: "Kenji Sato", guardianEmail: "kenji.sato@email.com", guardianPhone: "+66-82-345-6791", appliedAt: new Date("2025-09-03T10:00:00Z") },
      { status: "accepted", studentFirstName: "Isabella", studentLastName: "Costa", dateOfBirth: new Date("2011-10-20"), gradeLevelIdx: 2, guardianName: "Paulo Costa", guardianEmail: "paulo.costa@email.com", guardianPhone: "+66-83-456-7802", appliedAt: new Date("2025-09-07T14:00:00Z") },
      // enrolled (2) — Sep 2025
      { status: "enrolled", studentFirstName: "Oliver", studentLastName: "Anderson", dateOfBirth: new Date("2013-02-14"), gradeLevelIdx: 0, guardianName: "Robert Anderson", guardianEmail: "robert.anderson@email.com", guardianPhone: "+66-84-567-8913", appliedAt: new Date("2025-09-10T09:00:00Z") },
      { status: "enrolled", studentFirstName: "Zara", studentLastName: "Ali", dateOfBirth: new Date("2012-11-08"), gradeLevelIdx: 1, guardianName: "Fatima Ali", guardianEmail: "fatima.ali@email.com", guardianPhone: "+66-85-678-9024", appliedAt: new Date("2025-09-12T11:00:00Z") },
      // rejected (1) — Sep 2025
      { status: "rejected", studentFirstName: "Ethan", studentLastName: "Brown", dateOfBirth: new Date("2011-07-16"), gradeLevelIdx: 3, guardianName: "David Brown", guardianEmail: "david.brown@email.com", guardianPhone: "+66-86-789-0135", notes: "Application did not meet entry requirements for Grade 10. Recommended to reapply for the following academic year.", appliedAt: new Date("2025-09-15T08:00:00Z") },
      // waitlisted (2) — Oct 2025
      { status: "waitlisted", studentFirstName: "Hana", studentLastName: "Nakamura", dateOfBirth: new Date("2013-05-09"), gradeLevelIdx: 0, guardianName: "Takeshi Nakamura", guardianEmail: "takeshi.nakamura@email.com", guardianPhone: "+66-87-890-1246", appliedAt: new Date("2025-10-01T10:00:00Z") },
      { status: "waitlisted", studentFirstName: "Marco", studentLastName: "Rossi", dateOfBirth: new Date("2013-08-27"), gradeLevelIdx: 0, guardianName: "Giulia Rossi", guardianEmail: "giulia.rossi@email.com", guardianPhone: "+66-88-901-2357", appliedAt: new Date("2025-10-05T09:00:00Z") },
    ];

    const insertedApps = [];
    for (const app of appData) {
      const [inserted] = await db.insert(applications).values({
        tenantId,
        status: app.status,
        studentFirstName: app.studentFirstName,
        studentLastName: app.studentLastName,
        dateOfBirth: app.dateOfBirth,
        gradeLevelId: gradeLevelIds[app.gradeLevelIdx],
        academicYearId: yearId,
        guardianName: app.guardianName,
        guardianEmail: app.guardianEmail,
        guardianPhone: app.guardianPhone,
        notes: app.notes ?? null,
        appliedAt: app.appliedAt,
      }).returning();
      insertedApps.push({ ...inserted, gradeLevelIdx: app.gradeLevelIdx });
    }
    console.log(`Created ${insertedApps.length} applications`);

    // Interviews for "interviewed" status (indices 7-9)
    const interviewedApps = insertedApps.filter(a => a.status === "interviewed");
    let interviewCount = 0;
    for (const app of interviewedApps) {
      const interviewDate = new Date(app.appliedAt);
      interviewDate.setDate(interviewDate.getDate() + 10);
      await db.insert(applicationInterviews).values({
        applicationId: app.id,
        tenantId,
        scheduledAt: interviewDate,
        interviewedBy: adminId,
        notes: "Interview conducted. Candidate demonstrated solid academic foundation.",
        outcome: "pending",
      });
      interviewCount++;
    }

    // Interviews for "accepted" status with outcome: "accepted" (indices 10-12)
    const acceptedApps = insertedApps.filter(a => a.status === "accepted");
    for (const app of acceptedApps) {
      const interviewDate = new Date(app.appliedAt);
      interviewDate.setDate(interviewDate.getDate() + 7);
      await db.insert(applicationInterviews).values({
        applicationId: app.id,
        tenantId,
        scheduledAt: interviewDate,
        interviewedBy: adminId,
        notes: "Excellent interview. Strong academic record and extracurricular involvement.",
        outcome: "accepted",
      });
      interviewCount++;
    }
    console.log(`Created ${interviewCount} application interviews`);

    // Waitlist entries for "waitlisted" status (rank 1 and 2)
    const waitlistedApps = insertedApps.filter(a => a.status === "waitlisted");
    let waitlistCount = 0;
    for (let i = 0; i < waitlistedApps.length; i++) {
      const app = waitlistedApps[i];
      await db.insert(waitlistEntries).values({
        tenantId,
        applicationId: app.id,
        gradeLevelId: gradeLevelIds[app.gradeLevelIdx],
        rank: i + 1,
      });
      waitlistCount++;
    }
    console.log(`Created ${waitlistCount} waitlist entries`);
  }

  console.log("\n--- Enhanced seed complete! ---");
  console.log(`Tenant ID: ${tenantId}`);
  console.log(`75 students, 8 classes, ${sectionRows.length} class sections`);
  console.log("Full attendance, grades, fees, report cards, communications, timetable populated.");

  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
