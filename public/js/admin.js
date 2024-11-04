// Admin Dashboard Functions
async function handleAddTeacher(event) {
    event.preventDefault();
    
    const name = document.getElementById('teacherName').value;
    const email = document.getElementById('teacherEmail').value;
    const password = document.getElementById('teacherPassword').value;

    try {
        const response = await fetch('/api/teachers', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ name, email, password })
        });

        if (response.ok) {
            alert('Teacher added successfully!');
            document.getElementById('teacherName').value = '';
            document.getElementById('teacherEmail').value = '';
            document.getElementById('teacherPassword').value = '';
            loadTeachersList();
        } else {
            const data = await response.json();
            alert('Failed to add teacher: ' + data.error);
        }
    } catch (error) {
        console.error('Add teacher error:', error);
        alert('Failed to add teacher. Please try again.');
    }
}

async function loadTeachersList() {
    try {
        const response = await fetch('/api/teachers', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        const teachers = await response.json();
        const teachersList = document.getElementById('teachersList');
        
        teachersList.innerHTML = teachers.map(teacher => `
            <div class="teacher-card">
                <h3>${teacher.user.name}</h3>
                <p>${teacher.user.email}</p>
            </div>
        `).join('');
    } catch (error) {
        console.error('Load teachers error:', error);
        alert('Failed to load teachers list.');
    }
}