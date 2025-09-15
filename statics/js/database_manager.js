class DatabaseManager {
    constructor() {
        this.db = null;
        this.dbName = 'QuizDatabase';
        this.version = 2; // Updated version for new progress store
        this.lessonStoreName = 'lessons';
        this.progressStoreName = 'progress';
    }

    async initialize() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onupgradeneeded = (event) => {
                this.db = event.target.result;
                // Create lessons store if it doesn't exist
                if (!this.db.objectStoreNames.contains(this.lessonStoreName)) {
                    this.db.createObjectStore(this.lessonStoreName, { keyPath: 'id', autoIncrement: true });
                }
                // Create progress store if it doesn't exist
                if (!this.db.objectStoreNames.contains(this.progressStoreName)) {
                    this.db.createObjectStore(this.progressStoreName, { keyPath: 'id', autoIncrement: true });
                }
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                resolve(this.db);
            };

            request.onerror = (event) => {
                console.error('Error opening IndexedDB:', event.target.error);
                reject(event.target.error);
            };
        });
    }

    async saveLesson(lessonData, filename) {
        if (!this.db) throw new Error('Database not initialized');

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.lessonStoreName], 'readwrite');
            const store = transaction.objectStore(this.lessonStoreName);
            const lesson = {
                id: Date.now(),
                filename: filename,
                data: lessonData,
                source: 'db'
            };

            const addRequest = store.add(lesson);

            addRequest.onsuccess = () => {
                resolve(lesson);
            };

            addRequest.onerror = (event) => {
                console.error('Error saving lesson to IndexedDB:', event.target.error);
                reject(event.target.error);
            };
        });
    }

    async getAllLessons() {
        if (!this.db) throw new Error('Database not initialized');

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.lessonStoreName], 'readonly');
            const store = transaction.objectStore(this.lessonStoreName);
            const request = store.getAll();

            request.onsuccess = (event) => {
                resolve(event.target.result);
            };

            request.onerror = (event) => {
                reject(event.target.error);
            };
        });
    }

    async getLesson(lessonId) {
        if (!this.db) throw new Error('Database not initialized');

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.lessonStoreName], 'readonly');
            const store = transaction.objectStore(this.lessonStoreName);
            const request = store.get(parseInt(lessonId));

            request.onsuccess = (event) => {
                resolve(event.target.result);
            };

            request.onerror = (event) => {
                reject(event.target.error);
            };
        });
    }

    async deleteLesson(lessonId) {
        if (!this.db) throw new Error('Database not initialized');

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.lessonStoreName], 'readwrite');
            const store = transaction.objectStore(this.lessonStoreName);
            const deleteRequest = store.delete(parseInt(lessonId));

            deleteRequest.onsuccess = () => {
                resolve();
            };

            deleteRequest.onerror = (event) => {
                console.error('Error deleting lesson from IndexedDB:', event.target.error);
                reject(event.target.error);
            };
        });
    }

    async clearAllLessons() {
        if (!this.db) throw new Error('Database not initialized');

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.lessonStoreName, this.progressStoreName], 'readwrite');
            const lessonStore = transaction.objectStore(this.lessonStoreName);
            const progressStore = transaction.objectStore(this.progressStoreName);
            lessonStore.clear();
            progressStore.clear();

            transaction.oncomplete = () => {
                resolve();
            };

            transaction.onerror = (event) => {
                console.error('Error clearing IndexedDB:', event.target.error);
                reject(event.target.error);
            };
        });
    }

    async saveProgress(progressData) {
        if (!this.db) throw new Error('Database not initialized');

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.progressStoreName], 'readwrite');
            const store = transaction.objectStore(this.progressStoreName);
            const progress = {
                id: Date.now(),
                ...progressData
            };

            const addRequest = store.add(progress);

            addRequest.onsuccess = () => {
                resolve(progress);
            };

            addRequest.onerror = (event) => {
                console.error('Error saving progress to IndexedDB:', event.target.error);
                reject(event.target.error);
            };
        });
    }

    async getAllProgress() {
        if (!this.db) throw new Error('Database not initialized');

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.progressStoreName], 'readonly');
            const store = transaction.objectStore(this.progressStoreName);
            const request = store.getAll();

            request.onsuccess = (event) => {
                resolve(event.target.result);
            };

            request.onerror = (event) => {
                reject(event.target.error);
            };
        });
    }

    async exportDatabase() {
        try {
            const lessons = await this.getAllLessons();
            const progress = await this.getAllProgress();
            const exportData = {
                version: this.version,
                lessons: lessons,
                progress: progress
            };
            const jsonString = JSON.stringify(exportData, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = 'quiz_database_export.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            return true;
        } catch (error) {
            console.error('Error exporting database:', error);
            throw error;
        }
    }

    async importDatabase(importData) {
        try {
            if (!importData || (!importData.lessons && !importData.progress)) {
                throw new Error('Formato de archivo inválido.');
            }

            const existingLessons = await this.getAllLessons();
            const existingIds = new Set(existingLessons.map(lesson => lesson.id));
            const existingFilenames = new Set(existingLessons.map(lesson => lesson.filename));
            const existingProgressIds = new Set((await this.getAllProgress()).map(p => p.id));

            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([this.lessonStoreName, this.progressStoreName], 'readwrite');
                const lessonStore = transaction.objectStore(this.lessonStoreName);
                const progressStore = transaction.objectStore(this.progressStoreName);

                let importedCount = 0;

                // Import lessons
                if (importData.lessons && Array.isArray(importData.lessons)) {
                    importData.lessons.forEach(lesson => {
                        if (!existingIds.has(lesson.id) && !existingFilenames.has(lesson.filename)) {
                            lessonStore.add(lesson);
                            importedCount++;
                        }
                    });
                }

                // Import progress
                if (importData.progress && Array.isArray(importData.progress)) {
                    importData.progress.forEach(progress => {
                        if (!existingProgressIds.has(progress.id)) {
                            progressStore.add(progress);
                            importedCount++;
                        }
                    });
                }

                transaction.oncomplete = () => {
                    resolve(importedCount);
                };

                transaction.onerror = (event) => {
                    console.error('Error importing to IndexedDB:', event.target.error);
                    reject(event.target.error);
                };
            });
        } catch (error) {
            console.error('Error importing database:', error);
            throw error;
        }
    }
}