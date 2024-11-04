import { useState, useEffect } from 'react';
import axios from 'axios';
import React from 'react';

// Define interfaces for the data structure
interface Subject {
  name: string;
}

interface Teacher {
  name: string;
}

interface Course {
  id: number;
  subject: Subject;
  teacher: Teacher;
}

interface ClassSchedule {
  id: number;
  day: string;
  startTime: string;
  endTime: string;
  room: string;
  course: Course;
}

export default function StudentDashboard() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [schedule, setSchedule] = useState<ClassSchedule[]>([]);
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [coursesRes, scheduleRes, availableRes] = await Promise.all([
        axios.get<Course[]>('/api/students/courses'),
        axios.get<ClassSchedule[]>('/api/students/schedule'),
        axios.get<Course[]>('/api/courses/available')
      ]);

      setCourses(coursesRes.data);
      setSchedule(scheduleRes.data);
      setAvailableCourses(availableRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const enrollCourse = async (courseId: number) => {
    try {
      await axios.post('/api/students/enroll', { courseId });
      fetchData();
    } catch (error) {
      console.error("Error enrolling in course:", error);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Student Dashboard</h1>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">My Schedule</h2>
        <div className="grid grid-cols-5 gap-4">
          {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((day) => (
            <div key={day} className="border rounded p-4">
              <h3 className="font-semibold mb-4">{day}</h3>
              {schedule
                .filter((classItem) => classItem.day === day)
                .map((classItem) => (
                  <div key={classItem.id} className="mb-2 p-2 bg-gray-100 rounded">
                    <p className="font-medium">{classItem.course.subject.name}</p>
                    <p className="text-sm text-gray-600">
                      {classItem.startTime} - {classItem.endTime}
                    </p>
                    <p className="text-sm text-gray-600">Room {classItem.room}</p>
                  </div>
                ))}
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Available Courses</h2>
        <div className="grid grid-cols-3 gap-4">
          {availableCourses.map((course) => (
            <div key={course.id} className="border p-4 rounded">
              <p className="font-semibold">{course.subject.name}</p>
              <p className="text-gray-600">Teacher: {course.teacher.name}</p>
              <button
                onClick={() => enrollCourse(course.id)}
                className="mt-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Enroll
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
