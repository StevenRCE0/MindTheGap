<script lang="ts">
    import { browser } from "$app/environment";
    import { onMount } from "svelte";
    import FullscreenPhoto from "$lib/components/FullscreenPhoto.svelte";
    import { londonGuides } from "$lib/guides";
    import { achievementRepository } from "$lib/model/achievement-repository";
    import type { Achievement } from "$lib/model/achievement";

    let achievements = $state<Achievement[]>([]);
    let isLoading = $state(true);
    let error = $state("");

    function guideById(guideId: string) {
        return londonGuides.find((guide) => guide.id === guideId);
    }

    function completedGuideCount(): number {
        return new Set(achievements.map((achievement) => achievement.guideId)).size;
    }

    function downloadPhoto(imageDataUrl: string, filename: string): void {
        const anchor = document.createElement("a");
        anchor.href = imageDataUrl;
        anchor.download = filename;
        document.body.append(anchor);
        anchor.click();
        anchor.remove();
    }

    function buildFilename(achievement: Achievement): string {
        const date = new Date(achievement.createdAt).toISOString().slice(0, 10);
        return `achievement-${achievement.guideId}-${date}.jpg`;
    }

    onMount(() => {
        if (!browser || !achievementRepository.isAvailable()) {
            isLoading = false;
            return;
        }

        void (async () => {
            try {
                achievements = await achievementRepository.getAll();
            } catch {
                error = "Could not load accomplishments from IndexedDB.";
            } finally {
                isLoading = false;
            }
        })();
    });
</script>

<svelte:head>
    <title>Mind the Gap | Achievements</title>
    <meta
        name="description"
        content="View all accomplished achievements and download your photos."
    />
</svelte:head>

<section class="page">
    <header class="card header">
        <h1>Accomplished achievements</h1>
        <p>Your saved achievement photos across all guides.</p>
        <div class="stats">
            <span class="stat">{achievements.length} photos</span>
            <span class="stat">{completedGuideCount()} guides completed</span>
        </div>
    </header>

    {#if error}
        <p class="error">{error}</p>
    {/if}

    {#if isLoading}
        <p class="loading">Loading achievements...</p>
    {:else if achievements.length === 0}
        <p class="empty">No achievements yet. Add photos from a guide to see them here.</p>
    {:else}
        <section class="achievement-grid">
            {#each achievements as achievement}
                {@const guide = guideById(achievement.guideId)}
                <article class="card achievement-card">
                    <div class="card-head">
                        {#if guide}
                            <img alt={guide.iconAlt} class="icon" src={guide.icon} />
                            <h2>{guide.title}</h2>
                        {:else}
                            <h2>Unknown guide</h2>
                        {/if}
                    </div>

                    <FullscreenPhoto
                        alt="Accomplished achievement"
                        src={achievement.imageDataUrl}
                        title={new Date(achievement.createdAt).toLocaleString("en-GB")}
                    />

                    <p class="time">
                        {new Date(achievement.createdAt).toLocaleString("en-GB")}
                    </p>

                    <button
                        class="download-btn"
                        onclick={() =>
                            downloadPhoto(
                                achievement.imageDataUrl,
                                buildFilename(achievement),
                            )}
                        type="button"
                    >
                        Download picture
                    </button>
                </article>
            {/each}
        </section>
    {/if}
</section>

<style>
    .page {
        display: grid;
        gap: 1rem;
    }

    .card {
        background: rgba(255, 255, 255, 0.95);
        border: 1px solid #e5e7eb;
        border-radius: 0.75rem;
        padding: 1rem;
    }

    .header h1 {
        margin: 0 0 0.4rem;
        color: #0f172a;
    }

    .header p {
        margin: 0;
        color: #334155;
    }

    .stats {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
        margin-top: 0.6rem;
    }

    .stat {
        border: 1px solid #cbd5e1;
        border-radius: 999px;
        background: #f8fafc;
        color: #0f172a;
        padding: 0.2rem 0.55rem;
        font-size: 0.8rem;
    }

    .achievement-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
        gap: 0.9rem;
    }

    .achievement-card {
        display: grid;
        gap: 0.65rem;
    }

    .card-head {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .card-head h2 {
        margin: 0;
        font-size: 1rem;
    }

    .icon {
        width: 38px;
        height: 38px;
        object-fit: contain;
        border-radius: 0.5rem;
        border: 1px solid #e2e8f0;
        background: #ffffff;
        padding: 0.12rem;
    }

    .time {
        margin: 0;
        color: #475569;
        font-size: 0.86rem;
    }

    .download-btn {
        width: fit-content;
        border: 1px solid #94a3b8;
        border-radius: 0.5rem;
        background: #ffffff;
        color: #0f172a;
        padding: 0.45rem 0.65rem;
        font: inherit;
        cursor: pointer;
    }

    .error,
    .loading,
    .empty {
        margin: 0;
        border: 1px solid #e2e8f0;
        border-radius: 0.6rem;
        background: rgba(255, 255, 255, 0.88);
        color: #0f172a;
        padding: 0.65rem 0.8rem;
    }
</style>
