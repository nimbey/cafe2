async function loadTeacherSchedule() {
    try {
        const response = await fetch('/api/teachers/schedule', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        const schedule = await response.json();
        const scheduleGrid = document.getElementById('teacherSchedule');
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
    } catch (error) {
        console.error('Load schedule error:', error);
        alert('Failed to load schedule.');
    }
}