import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import Database from 'better-sqlite3';

const app = express();
const db = new Database('school.db');

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Initialize database tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT UNIQUE,
    password TEXT,
    role TEXT
  );
  
  CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER,
    grade TEXT,
    FOREIGN KEY (userId) REFERENCES users(id)
  );
  
  CREATE TABLE IF NOT EXISTS teachers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER,
    FOREIGN KEY (userId) REFERENCES users(id)
  );
  
  CREATE TABLE IF NOT EXISTS subjects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    teacherId INTEGER,
    FOREIGN KEY (teacherId) REFERENCES teachers(id)
  );
  
  CREATE TABLE IF NOT EXISTS courses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    subjectId INTEGER,
    FOREIGN KEY (subjectId) REFERENCES subjects(id)
  );
  
  CREATE TABLE IF NOT EXISTS classes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    courseId INTEGER,
    teacherId INTEGER,
    day TEXT,
    startTime TEXT,
    endTime TEXT,
    room TEXT,
    FOREIGN KEY (courseId) REFERENCES courses(id),
    FOREIGN KEY (teacherId) REFERENCES teachers(id)
  );
  
  CREATE TABLE IF NOT EXISTS enrollments (
    studentId INTEGER,
    courseId INTEGER,
    PRIMARY KEY (studentId, courseId),
    FOREIGN KEY (studentId) REFERENCES students(id),
    FOREIGN KEY (courseId) REFERENCES courses(id)
  );
`);

// Create admin user if not exists
const adminEmail = 'admin@school.com';
const adminPassword = 'admin123';
const adminExists = db.prepare('SELECT * FROM users WHERE email = ?').get(adminEmail);

if (!adminExists) {
  const hashedPassword = bcrypt.hashSync(adminPassword, 8);
  db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)').run('Admin', adminEmail, hashedPassword, 'ADMIN');
}

const JWT_SECRET = 'your-secret-key'; // In production, use environment variable

// Authentication middleware
const auth = (req, res, next) => {
  try {
    const token = req.header('Authorization').replace('Bearer ', '');
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(decoded.id);
    
    if (!user) throw new Error();
    
    req.user = user;
    next();
  } catch (error) {
    res.status(401).send({ error: 'Please authenticate' });
  }
};

// Auth routes
app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).send({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign({ id: user.id }, JWT_SECRET);
    res.send({ token, role: user.role });
  } catch (error) {
    res.status(400).send(error);
  }
});

app.post('/api/auth/register', (req, res) => {
  try {
    const { name, email, password, grade } = req.body;
    const hashedPassword = bcrypt.hashSync(password, 8);
    
    const result = db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)').run(name, email, hashedPassword, 'STUDENT');
    db.prepare('INSERT INTO students (userId, grade) VALUES (?, ?)').run(result.lastInsertRowid, grade);
    
    res.status(201).send({ message: 'Registration successful' });
  } catch (error) {
    res.status(400).send(error);
  }
});

// Teacher routes
app.get('/api/teachers', auth, (req, res) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).send({ error: 'Not authorized' });
  }
  
  const teachers = db.prepare(`
    SELECT users.*, teachers.id as teacherId 
    FROM users 
    JOIN teachers ON users.id = teachers.userId 
    WHERE users.role = 'TEACHER'
  `).all();
  
  res.send(teachers);
});

app.post('/api/teachers', auth, (req, res) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).send({ error: 'Not authorized' });
  }
  
  try {
    const { name, email, password } = req.body;
    const hashedPassword = bcrypt.hashSync(password, 8);
    
    const result = db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)').run(name, email, hashedPassword, 'TEACHER');
    db.prepare('INSERT INTO teachers (userId) VALUES (?)').run(result.lastInsertRowid);
    
    res.status(201).send({ message: 'Teacher added successfully' });
  } catch (error) {
    res.status(400).send(error);
  }
});

// Schedule routes
app.get('/api/teachers/schedule', auth, (req, res) => {
  if (req.user.role !== 'TEACHER') {
    return res.status(403).send({ error: 'Not authorized' });
  }
  
  const teacher = db.prepare('SELECT * FROM teachers WHERE userId = ?').get(req.user.id);
  const schedule = db.prepare(`
    SELECT classes.*, subjects.name as subjectName
    FROM classes
    JOIN courses ON classes.courseId = courses.id
    JOIN subjects ON courses.subjectId = subjects.id
    WHERE classes.teacherId = ?
  `).all(teacher.id);
  
  res.send(schedule);
});

app.get('/api/students/schedule', auth, (req, res) => {
  if (req.user.role !== 'STUDENT') {
    return res.status(403).send({ error: 'Not authorized' });
  }
  
  const student = db.prepare('SELECT * FROM students WHERE userId = ?').get(req.user.id);
  const schedule = db.prepare(`
    SELECT classes.*, subjects.name as subjectName
    FROM enrollments
    JOIN courses ON enrollments.courseId = courses.id
    JOIN classes ON classes.courseId = courses.id
    JOIN subjects ON courses.subjectId = subjects.id
    WHERE enrollments.studentId = ?
  `).all(student.id);
  
  res.send(schedule);
});

// Course routes
app.get('/api/courses/available', auth, (req, res) => {
  if (req.user.role !== 'STUDENT') {
    return res.status(403).send({ error: 'Not authorized' });
  }
  
  const courses = db.prepare(`
    SELECT courses.*, subjects.name as subjectName, users.name as teacherName
    FROM courses
    JOIN subjects ON courses.subjectId = subjects.id
    JOIN teachers ON subjects.teacherId = teachers.id
    JOIN users ON teachers.userId = users.id
  `).all();
  
  res.send(courses);
});

app.post('/api/students/enroll', auth, (req, res) => {
  if (req.user.role !== 'STUDENT') {
    return res.status(403).send({ error: 'Not authorized' });
  }
  
  try {
    const { courseId } = req.body;
    const student = db.prepare('SELECT * FROM students WHERE userId = ?').get(req.user.id);
    
    db.prepare('INSERT INTO enrollments (studentId, courseId) VALUES (?, ?)').run(student.id, courseId);
    
    res.send({ message: 'Enrolled successfully' });
  } catch (error) {
    res.status(400).send(error);
  }
});

// Add some sample data
function addSampleData() {
  // Add sample subjects
  const subjects = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English'];
  const times = ['09:00', '10:00', '11:00', '13:00', '14:00'];
  const rooms = ['101', '102', '103', '104', '105'];
  
  // Get first teacher (if exists)
  const teacher = db.prepare('SELECT * FROM teachers LIMIT 1').get();
  
  if (teacher) {
    subjects.forEach((subject, index) => {
      // Add subject
      const subjectResult = db.prepare('INSERT INTO subjects (name, teacherId) VALUES (?, ?)').run(subject, teacher.id);
      
      // Add course for the subject
      const courseResult = db.prepare('INSERT INTO courses (subjectId) VALUES (?)').run(subjectResult.lastInsertRowid);
      
      // Add classes for the course
      db.prepare(`
        INSERT INTO classes (courseId, teacherId, day, startTime, endTime, room)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        courseResult.lastInsertRowid,
        teacher.id,
        'Monday',
        times[index],
        times[index + 1] || '15:00',
        rooms[index]
      );
    });
  }
}

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  addSampleData();
});