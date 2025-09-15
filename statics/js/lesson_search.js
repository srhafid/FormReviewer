document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('lessonSearchInput');
    const lessonDropdown = document.getElementById('lessonDropdown');
    const lessonList = document.getElementById('lessonList');
    const lessonSelector = document.getElementById('lessonSelector');
    let lessons = [];

    // Initialize DatabaseManager
    const dbManager = new DatabaseManager();

    // Function to populate lessons from IndexedDB
    async function populateLessons() {
        try {
            await dbManager.initialize();
            lessons = await dbManager.getAllLessons();
            renderLessons(lessons);
        } catch (error) {
            console.error('Error loading lessons from IndexedDB:', error);
            lessonList.innerHTML = '<li class="px-4 py-2 text-red-600">Error al cargar lecciones</li>';
        }
    }

    // Render lessons in the dropdown
    function renderLessons(lessonArray) {
        lessonList.innerHTML = '';
        if (lessonArray.length === 0) {
            const li = document.createElement('li');
            li.className = 'px-4 py-2 text-gray-500';
            li.textContent = 'No se encontraron lecciones';
            lessonList.appendChild(li);
            return;
        }
        lessonArray.forEach(lesson => {
            const li = document.createElement('li');
            li.className = 'px-4 py-2 text-gray-700 hover:bg-orange-50 cursor-pointer';
            li.textContent = lesson.filename; // Use filename as display text
            li.dataset.value = lesson.id; // Use id as value
            li.addEventListener('click', () => {
                lessonSelector.value = lesson.id; // Store selected lesson ID
                searchInput.value = lesson.filename; // Show selected lesson in input
                lessonDropdown.classList.add('hidden');
                // Trigger change event for compatibility with existing code
                const event = new Event('change');
                lessonSelector.dispatchEvent(event);
            });
            lessonList.appendChild(li);
        });
    }

    // Filter lessons based on search input
    searchInput.addEventListener('input', () => {
        const query = searchInput.value.toLowerCase();
        const filteredLessons = lessons.filter(lesson =>
            lesson.filename.toLowerCase().includes(query)
        );
        renderLessons(filteredLessons);
        lessonDropdown.classList.remove('hidden');
    });

    // Show/hide dropdown on focus/blur
    searchInput.addEventListener('focus', () => {
        lessonDropdown.classList.remove('hidden');
        renderLessons(lessons);
    });

    // Hide dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !lessonDropdown.contains(e.target)) {
            lessonDropdown.classList.add('hidden');
        }
    });

    // Load lessons on initialization
    populateLessons();
});