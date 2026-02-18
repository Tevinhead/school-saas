// packages/db/src/seed-data.ts

export const FIRST_NAMES_MALE = [
  "Aiden", "Kai", "Liam", "Noah", "Oliver", "Lucas", "Ethan", "James", "Benjamin", "Daniel",
  "Arjun", "Wei", "Ravi", "Yusuf", "Takumi", "Sven", "Pierre", "Marco", "Hassan", "Dmitri",
  "Mateo", "Hiroto", "Kwame", "Raj", "Felix", "Ahmad", "Ivan", "Leo", "Oscar", "Hugo",
  "Min-Jun", "Akira", "Santiago", "Carlos", "Andre", "Pavel", "Theo", "Sebastian",
];

export const FIRST_NAMES_FEMALE = [
  "Sofia", "Mia", "Emma", "Ava", "Isabella", "Chloe", "Zara", "Lily", "Hannah", "Sophie",
  "Aisha", "Mei", "Priya", "Fatima", "Sakura", "Ingrid", "Camille", "Giulia", "Amara", "Yuki",
  "Valentina", "Hana", "Adwoa", "Ananya", "Clara", "Layla", "Natasha", "Luna", "Rosa", "Elena",
  "Seo-Yeon", "Noor", "Carmen", "Maria", "Zoe", "Elise", "Aria",
];

export const LAST_NAMES = [
  "Chen", "Martinez", "Tanaka", "Johnson", "Kim", "Williams", "Singh", "Brown", "Lee", "Patel",
  "Nguyen", "Garcia", "Muller", "Ali", "Nakamura", "Anderson", "Sato", "Okonkwo", "Costa", "Johansson",
  "Park", "Smith", "Yamamoto", "O'Brien", "Petrov", "Santos", "Mueller", "Hassan", "Rossi", "Schmidt",
  "Kawaguchi", "Adeyemi", "Hernandez", "Liu", "Ivanov", "Larsson", "Dubois", "Colombo",
  "Watanabe", "Fernandes",
];

export const NATIONALITIES = [
  "Thai", "Japanese", "American", "Korean", "British", "Indian", "German", "French",
  "Italian", "Australian", "Chinese", "Nigerian", "Brazilian", "Russian", "Swedish",
  "Mexican", "Dutch", "Spanish", "Canadian", "South African",
];

export const LANGUAGES = [
  "Thai", "Japanese", "English", "Korean", "English", "Hindi", "German", "French",
  "Italian", "English", "Mandarin", "English", "Portuguese", "Russian", "Swedish",
  "Spanish", "Dutch", "Spanish", "English", "English",
];

export const GUARDIAN_RELATIONSHIPS = ["Father", "Mother", "Guardian", "Grandmother", "Grandfather", "Uncle", "Aunt"];

export const SUBJECT_PRESETS = [
  { name: "Mathematics", code: "MATH", department: "STEM" },
  { name: "English Language", code: "ENG", department: "Languages" },
  { name: "English Literature", code: "ELIT", department: "Languages" },
  { name: "Sciences", code: "SCI", department: "STEM" },
  { name: "Biology", code: "BIO", department: "STEM" },
  { name: "Chemistry", code: "CHEM", department: "STEM" },
  { name: "Physics", code: "PHY", department: "STEM" },
  { name: "History", code: "HIST", department: "Humanities" },
  { name: "Geography", code: "GEO", department: "Humanities" },
  { name: "Art & Design", code: "ART", department: "Arts" },
  { name: "Music", code: "MUS", department: "Arts" },
  { name: "Physical Education", code: "PE", department: "Health" },
  { name: "Computer Science", code: "CS", department: "STEM" },
  { name: "Foreign Language", code: "FL", department: "Languages" },
  { name: "Drama", code: "DRA", department: "Arts" },
  { name: "Design Technology", code: "DT", department: "STEM" },
  { name: "Economics", code: "ECON", department: "Humanities" },
  { name: "Psychology", code: "PSY", department: "Humanities" },
  { name: "Thai Language", code: "THAI", department: "Languages" },
  { name: "Social Studies", code: "SS", department: "Humanities" },
];

export const ANNOUNCEMENT_DATA = [
  { title: "Welcome Back to School!", body: "We are excited to welcome all students and families back for the 2025-2026 academic year. Please review the updated school handbook.", audience: "all" as const, isPublished: true },
  { title: "Parent-Teacher Conference Dates", body: "Parent-teacher conferences will be held on October 15-16. Please sign up for time slots through the school portal.", audience: "parents" as const, isPublished: true },
  { title: "Staff Meeting - Curriculum Planning", body: "All teaching staff are required to attend the curriculum planning meeting on Friday at 3:30 PM in the library.", audience: "teachers" as const, isPublished: true },
  { title: "Sports Day Announcement", body: "Annual Sports Day will be held on November 8th. Students should wear their house colors. Permission slips are due by November 1st.", audience: "all" as const, isPublished: true },
  { title: "Science Fair Registration Open", body: "Registration for the annual Science Fair is now open. Students can sign up individually or in pairs. Deadline: September 30.", audience: "all" as const, isPublished: true },
  { title: "Library Renovation Update", body: "The library renovation is on track. The new multimedia section will be available starting December.", audience: "all" as const, isPublished: false },
  { title: "Holiday Schedule", body: "Please find the updated holiday schedule for the remainder of the academic year attached to this announcement.", audience: "all" as const, isPublished: true },
  { title: "Grade Submission Deadline", body: "Reminder: All midterm grades must be submitted by October 31. Please use the gradebook system.", audience: "teachers" as const, isPublished: true },
];

export const ASSESSMENT_TYPES = [
  { name: "Midterm Exam", type: "exam" as const, maxScore: 100, weight: 25 },
  { name: "Final Exam", type: "exam" as const, maxScore: 100, weight: 30 },
  { name: "Quiz 1", type: "quiz" as const, maxScore: 20, weight: 5 },
  { name: "Quiz 2", type: "quiz" as const, maxScore: 20, weight: 5 },
  { name: "Project 1", type: "project" as const, maxScore: 50, weight: 15 },
  { name: "Homework Portfolio", type: "homework" as const, maxScore: 30, weight: 10 },
  { name: "Class Presentation", type: "project" as const, maxScore: 40, weight: 5 },
  { name: "Research Paper", type: "project" as const, maxScore: 60, weight: 5 },
];

// Helper: pseudo-random with seed for reproducibility
export function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}
