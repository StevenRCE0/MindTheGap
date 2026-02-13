import type { Achievement } from './achievement';

export class AchievementRepository {
	private static readonly DB_NAME = 'mind-the-gap';
	private static readonly DB_VERSION = 1;
	private static readonly STORE_NAME = 'achievements';

	public isAvailable(): boolean {
		return typeof indexedDB !== 'undefined';
	}

	public async getAll(): Promise<Achievement[]> {
		const db = await this.openDb();
		try {
			const transaction = db.transaction(AchievementRepository.STORE_NAME, 'readonly');
			const store = transaction.objectStore(AchievementRepository.STORE_NAME);
			const request = store.getAll() as IDBRequest<Achievement[]>;
			const achievements = await this.requestToPromise(request);
			await this.transactionDone(transaction);

			return achievements.sort((a, b) => {
				return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
			});
		} finally {
			db.close();
		}
	}

	public async getByGuide(guideId: string): Promise<Achievement[]> {
		const achievements = await this.getAll();
		return achievements.filter((achievement) => achievement.guideId === guideId);
	}

	public async getCountsByGuide(): Promise<Record<string, number>> {
		const achievements = await this.getAll();
		return achievements.reduce<Record<string, number>>((counts, achievement) => {
			counts[achievement.guideId] = (counts[achievement.guideId] ?? 0) + 1;
			return counts;
		}, {});
	}

	public async save(achievement: Achievement): Promise<void> {
		const db = await this.openDb();
		try {
			const transaction = db.transaction(AchievementRepository.STORE_NAME, 'readwrite');
			transaction.objectStore(AchievementRepository.STORE_NAME).put(achievement);
			await this.transactionDone(transaction);
		} finally {
			db.close();
		}
	}

	public async remove(id: string): Promise<void> {
		const db = await this.openDb();
		try {
			const transaction = db.transaction(AchievementRepository.STORE_NAME, 'readwrite');
			transaction.objectStore(AchievementRepository.STORE_NAME).delete(id);
			await this.transactionDone(transaction);
		} finally {
			db.close();
		}
	}

	private ensureIndexedDb(): void {
		if (!this.isAvailable()) {
			throw new Error('IndexedDB is not available in this environment');
		}
	}

	private requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
		return new Promise((resolve, reject) => {
			request.onsuccess = () => resolve(request.result);
			request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed'));
		});
	}

	private transactionDone(transaction: IDBTransaction): Promise<void> {
		return new Promise((resolve, reject) => {
			transaction.oncomplete = () => resolve();
			transaction.onerror = () => reject(transaction.error ?? new Error('IndexedDB transaction failed'));
			transaction.onabort = () => reject(transaction.error ?? new Error('IndexedDB transaction aborted'));
		});
	}

	private async openDb(): Promise<IDBDatabase> {
		this.ensureIndexedDb();

		return await new Promise((resolve, reject) => {
			const request = indexedDB.open(
				AchievementRepository.DB_NAME,
				AchievementRepository.DB_VERSION
			);

			request.onupgradeneeded = () => {
				const db = request.result;
				if (!db.objectStoreNames.contains(AchievementRepository.STORE_NAME)) {
					const store = db.createObjectStore(AchievementRepository.STORE_NAME, { keyPath: 'id' });
					store.createIndex('createdAt', 'createdAt', { unique: false });
				}
			};

			request.onsuccess = () => resolve(request.result);
			request.onerror = () => reject(request.error ?? new Error('Failed to open IndexedDB'));
		});
	}
}

export const achievementRepository = new AchievementRepository();
