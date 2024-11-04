// Authentication Functions
async function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();
        
        if (response.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('role', data.role);
            
            showDashboard(data.role);
        } else {
            alert('Login failed: ' + data.error);
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('Login failed. Please try again.');
    }
}

async function handleRegistration(event) {
    event.preventDefault();
    
    const name = document.getElementById('regName').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    const grade = document.getElementById('grade').value;

    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, email, password, grade })
        });

        const data = await response.json();
        
        if (response.ok) {
            alert('Registration successful! Please login.');
            showLogin();
        } else {
            alert('Registration failed: ' + data.error);
        }
    } catch (error) {
        console.error('Registration error:', error);
        alert('Registration failed. Please try again.');
    }
}

function showLogin() {
    document.getElementById('loginForm').classList.remove('hidden');
    document.getElementById('registrationForm').classList.add('hidden');
    document.getElementById('adminDashboard').classList.add('hidden');
    document.getElementById('teacherDashboard').classList.add('hidden');
    document.getElementById('studentDashboard').classList.add('hidden');
}

function showRegistration() {
    document.getElementById('loginForm').classList.add('hidden');
    document.getElementById('registrationForm').classList.remove('hidden');
    document.getElementById('adminDashboard').classList.add('hidden');
    document.getElementById('teacherDashboard').classList.add('hidden');
    document.getElementById('studentDashboard').classList.add('hidden');
}

function showDashboard(role) {
    document.getElementById('loginForm').classList.add('hidden');
    document.getElementById('registrationForm').classList.add('hidden');
    
    switch (role) {
        case 'ADMIN':
            document.getElementById('adminDashboard').classList.remove('hidden');
            loadTeachersList();
            break;
        case 'TEACHER':
            document.getElementById('teacherDashboard').classList.remove('hidden');
            loadTeacherSchedule();
            break;
        case 'STUDENT':
            document.getElementById('studentDashboard').classList.remove('hidden');
            loadStudentData();
            break;
    }
}