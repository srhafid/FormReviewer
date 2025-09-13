class DatabaseManager {
    constructor() {
        this.db = null;
        this.dbName = 'QuizDatabase';
        this.version = 1;
        this.storeName = 'lessons';
    }

    async initialize() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onupgradeneeded = (event) => {
                this.db = event.target.result;
                if (!this.db.objectStoreNames.contains(this.storeName)) {
                    this.db.createObjectStore(this.storeName, { keyPath: 'id', autoIncrement: true });
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
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
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
                console.error('Error saving to IndexedDB:', event.target.error);
                reject(event.target.error);
            };
        });
    }

    async getAllLessons() {
        if (!this.db) throw new Error('Database not initialized');

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
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
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
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
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const deleteRequest = store.delete(parseInt(lessonId));

            deleteRequest.onsuccess = () => {
                resolve();
            };

            deleteRequest.onerror = (event) => {
                console.error('Error deleting from IndexedDB:', event.target.error);
                reject(event.target.error);
            };
        });
    }

    async clearAllLessons() {
        if (!this.db) throw new Error('Database not initialized');

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const clearRequest = store.clear();

            clearRequest.onsuccess = () => {
                resolve();
            };

            clearRequest.onerror = (event) => {
                console.error('Error clearing IndexedDB:', event.target.error);
                reject(event.target.error);
            };
        });
    }

    async exportDatabase() {
        try {
            const lessons = await this.getAllLessons();
            const exportData = {
                version: 1,
                lessons: lessons
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
            if (!importData.lessons || !Array.isArray(importData.lessons)) {
                throw new Error('Formato de archivo inválido.');
            }

            const existingLessons = await this.getAllLessons();
            const existingIds = new Set(existingLessons.map(lesson => lesson.id));
            const existingFilenames = new Set(existingLessons.map(lesson => lesson.filename));

            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([this.storeName], 'readwrite');
                const store = transaction.objectStore(this.storeName);

                let importedCount = 0;
                importData.lessons.forEach(lesson => {
                    if (!existingIds.has(lesson.id) && !existingFilenames.has(lesson.filename)) {
                        store.add(lesson);
                        importedCount++;
                    }
                });

                transaction.oncomplete = () => {
                    resolve(importedCount);
                };

                transaction.onerror = (event) => {
                    console.error('Error importing to IndexedDB:', event.target.error);
                    reject(event.target.error);
                };
            });
        } catch (error) {
            throw error;
        }
    }
}
