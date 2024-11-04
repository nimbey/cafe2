import { useState, useEffect } from 'react';
import axios from 'axios';
import React from 'react';

interface Teacher {
  id: number;
  name: string;
  email: string;
}

interface TeacherInput {
  name: string;
  email: string;
  password: string;
}

export default function AdminDashboard() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isFetchingTeachers, setIsFetchingTeachers] = useState(false);
  const [isAddingTeacher, setIsAddingTeacher] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newTeacher, setNewTeacher] = useState<TeacherInput>({
    name: '',
    email: '',
    password: ''
  });

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      setIsFetchingTeachers(true);
      setError(null);
      const response = await axios.get<Teacher[]>('/api/teachers');
      setTeachers(response.data);
    } catch (err) {
      setError('Failed to fetch teachers');
      console.error('Fetch teachers error:', err);
    } finally {
      setIsFetchingTeachers(false);
    }
  };

  const handleAddTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsAddingTeacher(true);
      setError(null);
      await axios.post('/api/teachers', newTeacher);
      await fetchTeachers();
      setNewTeacher({ name: '', email: '', password: '' });
    } catch (err) {
      setError('Failed to add teacher');
      console.error('Add teacher error:', err);
    } finally {
      setIsAddingTeacher(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Add New Teacher</h2>
        <form onSubmit={handleAddTeacher} className="space-y-4">
          <input
            type="text"
            placeholder="Name"
            value={newTeacher.name}
            onChange={(e) => setNewTeacher({ ...newTeacher, name: e.target.value })}
            className="block w-full p-2 border rounded"
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={newTeacher.email}
            onChange={(e) => setNewTeacher({ ...newTeacher, email: e.target.value })}
            className="block w-full p-2 border rounded"
            required
          />
          <input type="password" placeholder="Password" value={newTeacher.password} onChange={(e) => setNewTeacher({ ...newTeacher, password: e.target.value })} className="block w-full p-2 border rounded" required/>
          <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50" disabled={isAddingTeacher}>
            {isAddingTeacher ? 'Adding...' : 'Add Teacher'}
          </button>
        </form>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Teachers List</h2>
        {isFetchingTeachers ? <p>Loading...</p> : (
          <div className="grid grid-cols-1 gap-4">
            {teachers.map((teacher) => (
              <div key={teacher.id} className="border p-4 rounded">
                <p className="font-semibold">{teacher.name}</p>
                <p className="text-gray-600">{teacher.email}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
