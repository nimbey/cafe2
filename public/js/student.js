// Student Dashboard Functions
async function loadStudentData() {
    try {
        const [scheduleRes, coursesRes] = await Promise.all([
            fetch('/api/students/schedule', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            }),
            fetch('/api/courses/available', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            })
        ]);

        const schedule = await scheduleRes.json();
        const courses = await coursesRes.json();

        displaySchedule(schedule);
        displayAvailableCourses(courses);
    } catch (error) {
        console.error('Load student data error:', error);
        alert('Failed to load student data.');
    }
}

function displaySchedule(schedule) {
    const scheduleGrid = document.getElementById('studentSchedule');
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    
    scheduleGrid.innerHTML = days.map(day => `
        <div class="schedule-day">
            <h3>${day}</h3>
            ${schedule
                .filter(classItem => classItem.day === day)
                .map(classItem => `
                    <div class="schedule-item">
                        <p class="subject">${classItem.course.subject.name}</p>
                        <p class="time">${classItem.startTime} - ${classItem.endTime}</p>
                        <p class="room">Room ${classItem.room}</p>
                    </div>
                `).join('')}
        </div>
    `).join('');
}

function displayAvailableCourses(courses) {
    const coursesGrid = document.getElementById('availableCourses');
    
    coursesGrid.innerHTML = courses.map(course => `
        <div class="course-card">
            <h3>${course.subject.name}</h3>
            <p>Teacher: ${course.teacher.user.name}</p>
            <button onclick="enrollCourse(${course.id})" class="btn-primary">
                Enroll
            </button>
        </div>
    `).join('');
}

async function enrollCourse(courseId) {
    try {
        const response = await fetch('/api/students/enroll', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ courseId })
        });

        if (response.ok) {
            alert('Successfully enrolled in course!');
            loadStudentData();
        } else {
            const data = await response.json();
            alert('Failed to enroll: ' + data.error);
        }
    } catch (error) {
        console.error('Enroll error:', error);
        alert('Failed to enroll in course.');
    }
}