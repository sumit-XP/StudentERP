import pool from "./src/config/db.js";

async function seedGrades() {
  try {
    // 1. Get a student
    const studentRes = await pool.query("SELECT id, class_id, school_id FROM students LIMIT 1");
    if (studentRes.rows.length === 0) {
      console.log("No students found. Run other seeders first.");
      process.exit(1);
    }
    const student = studentRes.rows[0];

    // 2. Make sure subjects exist for this class
    const subjectsRes = await pool.query("SELECT id FROM subjects WHERE class_id = $1 LIMIT 5", [student.class_id]);
    
    let subjectIds = subjectsRes.rows.map(r => r.id);
    
    // If no subjects found for this class, just get any subjects
    if (subjectIds.length === 0) {
      const anySubjects = await pool.query("SELECT id FROM subjects LIMIT 5");
      subjectIds = anySubjects.rows.map(r => r.id);
    }
    
    if (subjectIds.length === 0) {
      // create some subjects
      const sub1 = await pool.query("INSERT INTO subjects (name, code, class_id, school_id) VALUES ('Mathematics', 'MATH101', $1, $2) RETURNING id", [student.class_id, student.school_id]);
      const sub2 = await pool.query("INSERT INTO subjects (name, code, class_id, school_id) VALUES ('Science', 'SCI101', $1, $2) RETURNING id", [student.class_id, student.school_id]);
      const sub3 = await pool.query("INSERT INTO subjects (name, code, class_id, school_id) VALUES ('English', 'ENG101', $1, $2) RETURNING id", [student.class_id, student.school_id]);
      subjectIds = [sub1.rows[0].id, sub2.rows[0].id, sub3.rows[0].id];
    }

    // 3. Get academic year
    const ayRes = await pool.query("SELECT id FROM academic_years WHERE school_id = $1 AND is_current = true LIMIT 1", [student.school_id]);
    let ayId = ayRes.rows.length > 0 ? ayRes.rows[0].id : null;

    // 4. Get a teacher/admin for entered_by
    const userRes = await pool.query("SELECT id FROM users WHERE school_id = $1 LIMIT 1", [student.school_id]);
    const userId = userRes.rows[0].id;

    console.log("Seeding grades for student ID:", student.id);

    // Delete existing grades for this student to avoid duplicates
    await pool.query("DELETE FROM grades WHERE student_id = $1", [student.id]);

    // Insert new grades
    for (const sid of subjectIds) {
      const maxMarks = 100;
      const marksObtained = Math.floor(Math.random() * 40) + 60; // 60 to 100
      let gradeLetter = 'A';
      if (marksObtained < 70) gradeLetter = 'C';
      else if (marksObtained < 80) gradeLetter = 'B';
      else if (marksObtained >= 90) gradeLetter = 'A+';

      await pool.query(
        `INSERT INTO grades (student_id, subject_id, class_id, exam_type, exam_name, marks_obtained, max_marks, grade_letter, exam_date, academic_year_id, entered_by)
         VALUES ($1, $2, $3, 'final', 'Year End Exams', $4, $5, $6, CURRENT_DATE, $7, $8)`,
        [student.id, sid, student.class_id, marksObtained, maxMarks, gradeLetter, ayId, userId]
      );
    }

    console.log("Grades successfully seeded for testing!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding grades:", error);
    process.exit(1);
  }
}

seedGrades();
