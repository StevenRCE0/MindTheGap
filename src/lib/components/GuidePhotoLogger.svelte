<script lang="ts">
    import { browser } from "$app/environment";
    import { onMount } from "svelte";
    import FullscreenPhoto from "$lib/components/FullscreenPhoto.svelte";
    import { achievementRepository } from "$lib/model/achievement-repository";
    import type { Achievement } from "$lib/model/achievement";

    let { guideId } = $props<{ guideId: string; guideTitle: string }>();

    let achievements = $state<Achievement[]>([]);
    let isLoading = $state(true);
    let error = $state("");
    let dbAvailable = $state(true);

    function fileToDataUrl(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                if (typeof reader.result === "string") {
                    resolve(reader.result);
                    return;
                }
                reject(new Error("Failed to read selected image"));
            };
            reader.onerror = () =>
                reject(
                    reader.error ?? new Error("Failed to read selected image"),
                );
            reader.readAsDataURL(file);
        });
    }

    async function loadAchievements(): Promise<void> {
        if (!browser || !dbAvailable) {
            isLoading = false;
            return;
        }

        try {
            achievements = await achievementRepository.getByGuide(guideId);
        } catch {
            dbAvailable = false;
            error = "Could not open IndexedDB.";
        } finally {
            isLoading = false;
        }
    }

    async function handleUpload(event: Event): Promise<void> {
        const input = event.currentTarget as HTMLInputElement;
        const file = input.files?.[0];
        if (!file) {
            return;
        }

        error = "";
        if (!dbAvailable) {
            error = "IndexedDB is unavailable in this browser.";
            return;
        }

        try {
            const imageDataUrl = await fileToDataUrl(file);
            const id =
                browser && "randomUUID" in crypto
                    ? crypto.randomUUID()
                    : `${Date.now()}`;
            const achievement: Achievement = {
                id,
                guideId,
                imageDataUrl,
                createdAt: new Date().toISOString(),
            };

            await achievementRepository.save(achievement);
            await loadAchievements();
        } catch {
            error = "Could not save photo. Try again.";
        } finally {
            input.value = "";
        }
    }

    async function handleDelete(
        achievementId: string,
        event: MouseEvent,
    ): Promise<void> {
        event.preventDefault();
        event.stopPropagation();
        error = "";

        try {
            await achievementRepository.remove(achievementId);
            achievements = achievements.filter(
                (achievement) => achievement.id !== achievementId,
            );
        } catch {
            error = "Could not delete photo. Try again.";
        }
    }

    onMount(() => {
        if (!browser) {
            return;
        }

        dbAvailable = achievementRepository.isAvailable();
        void loadAchievements();
    });
</script>

<section class="card">
    <h2>Photos</h2>
    {#if error}
        <p class="error">{error}</p>
    {/if}
    {#if isLoading}
        <p>Loading saved photos...</p>
    {:else}
        <div class="photo-grid">
            {#each achievements as achievement}
                <div class="tile-wrap">
                    <FullscreenPhoto
                        alt="Saved achievement"
                        src={achievement.imageDataUrl}
                        title={new Date(achievement.createdAt).toLocaleString(
                            "en-GB",
                        )}
                    />
                    <button
                        aria-label="Delete photo"
                        class="delete-btn"
                        onclick={(event) => handleDelete(achievement.id, event)}
                        type="button"
                    >
                        —
                    </button>
                </div>
            {/each}

            <label class="add-tile" for={`upload-${guideId}`}>
                <span>+</span>
            </label>

            <input
                accept="image/*"
                capture="environment"
                class="hidden-input"
                id={`upload-${guideId}`}
                onchange={handleUpload}
                type="file"
            />
        </div>
    {/if}
</section>

<style>
    .card {
        background: #ffffff;
        border: 1px solid #e5e7eb;
        border-radius: 0.75rem;
        padding: 1rem;
        margin-bottom: 1rem;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
    }

    h2 {
        margin: 0 0 0.5rem;
    }

    .photo-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
        gap: 0.8rem;
    }

    .add-tile {
        width: 100%;
        aspect-ratio: 1 / 1;
        border: 1px solid #e5e7eb;
        border-radius: 0.6rem;
        background: #fcfcfd;
    }

    .add-tile {
        display: grid;
        place-items: center;
        cursor: pointer;
        background: #f9fafb;
    }

    .add-tile span {
        font-size: 2rem;
        line-height: 1;
        color: #4b5563;
    }

    .tile-wrap {
        position: relative;
    }

    .delete-btn {
        position: absolute;
        top: 0.75rem;
        right: 0.75rem;
        width: 2rem;
        height: 2rem;
        font-weight: 900;
        border: 1px solid rgba(0, 0, 0, 0.12);
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.95);
        line-height: 1;
        cursor: pointer;
        z-index: 2;
    }

    .hidden-input {
        display: none;
    }

    .error {
        background: #f3f4f6;
        border: 1px solid #e5e7eb;
        padding: 0.55rem;
        border-radius: 0.5rem;
    }
</style>
