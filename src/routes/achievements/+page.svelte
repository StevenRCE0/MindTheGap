<script lang="ts">
    import { browser } from "$app/environment";
    import { onMount } from "svelte";
    import html2canvas from "html2canvas";
    import FullscreenPhoto from "$lib/components/FullscreenPhoto.svelte";
    import { londonGuides } from "$lib/guides";
    import type { Guide } from "$lib/model/guide";
    import { achievementRepository } from "$lib/model/achievement-repository";
    import type { Achievement } from "$lib/model/achievement";

    type GuideSection = {
        guideId: string;
        guide?: Guide;
        photos: Achievement[];
    };

    let achievements = $state<Achievement[]>([]);
    let isLoading = $state(true);
    let error = $state("");
    let isDumping = $state(false);
    let posterElement = $state<HTMLElement | null>(null);

    function guideById(guideId: string): Guide | undefined {
        return londonGuides.find((guide) => guide.id === guideId);
    }

    function sortPhotosByLatest(photos: Achievement[]): Achievement[] {
        return [...photos].sort((a, b) => {
            return (
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime()
            );
        });
    }

    const guideSections = $derived.by((): GuideSection[] => {
        const grouped = new Map<string, Achievement[]>();
        for (const achievement of achievements) {
            const current = grouped.get(achievement.guideId) ?? [];
            current.push(achievement);
            grouped.set(achievement.guideId, current);
        }

        const sectionsFromKnownGuides = londonGuides
            .map((guide) => {
                const photos = sortPhotosByLatest(grouped.get(guide.id) ?? []);
                return {
                    guideId: guide.id,
                    guide,
                    photos,
                };
            })
            .filter((section) => section.photos.length > 0);

        const knownGuideIds = new Set(londonGuides.map((guide) => guide.id));
        const sectionsFromUnknownGuides = Array.from(grouped.entries())
            .filter(([guideId]) => !knownGuideIds.has(guideId))
            .map(([guideId, photos]) => {
                return {
                    guideId,
                    guide: undefined,
                    photos: sortPhotosByLatest(photos),
                };
            });

        return [...sectionsFromKnownGuides, ...sectionsFromUnknownGuides];
    });

    const guideCount = $derived(guideSections.length);
    const photoCount = $derived(achievements.length);

    function summaryPeriod(): string {
        if (achievements.length === 0) {
            return "";
        }

        const years = achievements
            .map((achievement) => new Date(achievement.createdAt).getFullYear())
            .filter((year) => Number.isFinite(year))
            .sort((a, b) => a - b);

        const firstYear = years[0];
        const lastYear = years[years.length - 1];
        return firstYear === lastYear
            ? String(firstYear)
            : `${firstYear}-${lastYear}`;
    }

    function firstUpdateDate(): string {
        if (achievements.length === 0) {
            return "";
        }

        const first = achievements
            .map((achievement) => new Date(achievement.createdAt))
            .sort((a, b) => a.getTime() - b.getTime())[0];

        return first.toLocaleDateString("en-GB", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    }

    function hashCode(value: string): number {
        let hash = 0;
        for (let index = 0; index < value.length; index += 1) {
            hash = (hash << 5) - hash + value.charCodeAt(index);
            hash |= 0;
        }
        return Math.abs(hash) + 1;
    }

    function seededRandom(seed: number): () => number {
        let t = seed;
        return () => {
            t += 0x6d2b79f5;
            let r = Math.imul(t ^ (t >>> 15), 1 | t);
            r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
            return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
        };
    }

    function randomBetween(
        rand: () => number,
        min: number,
        max: number,
    ): number {
        return rand() * (max - min) + min;
    }

    function buildShapeStyle(guideId: string): string {
        const rand = seededRandom(hashCode(guideId));
        const p1x = randomBetween(rand, 0, 4);
        const p1y = randomBetween(rand, 0, 3);
        const p2x = randomBetween(rand, 96, 100);
        const p2y = randomBetween(rand, 0, 2);
        const p3x = randomBetween(rand, 96, 100);
        const p3y = randomBetween(rand, 97, 100);
        const p4x = randomBetween(rand, 0, 3);
        const p4y = randomBetween(rand, 97, 100);
        const rotate = randomBetween(rand, -0.8, 0.8);

        return `background:var(--secondary-blue); opacity:0.3;clip-path: polygon(${p1x}% ${p1y}%, ${p2x}% ${p2y}%, ${p3x}% ${p3y}%, ${p4x}% ${p4y}%); transform: rotate(${rotate}deg);`;
    }

    function buildPhotoStyle(photoId: string): string {
        const rand = seededRandom(hashCode(`photo-${photoId}`));
        const rotate = randomBetween(rand, -7, 7).toFixed(2);
        const translateY = randomBetween(rand, -2, 2).toFixed(1);
        return `transform: rotate(${rotate}deg) translateY(${translateY}px);`;
    }

    function sectionWhyItMatters(guide?: Guide): string {
        return (
            guide?.whyItMatters ??
            "Saved guide details are not available, but your photos are preserved."
        );
    }

    function sectionQuickWin(guide?: Guide): string {
        return (
            guide?.quickWin ??
            "Keep adding snapshots while exploring London and building your routine."
        );
    }

    function isStandaloneAppMode(): boolean {
        const standaloneFromMedia =
            window.matchMedia?.("(display-mode: standalone)").matches ?? false;
        const standaloneFromNavigator = (
            navigator as Navigator & { standalone?: boolean }
        ).standalone === true;
        return standaloneFromMedia || standaloneFromNavigator;
    }

    function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
        return new Promise((resolve, reject) => {
            canvas.toBlob((blob) => {
                if (blob) {
                    resolve(blob);
                    return;
                }
                reject(new Error("Canvas export failed"));
            }, "image/png");
        });
    }

    async function tryShareImage(file: File): Promise<boolean> {
        if (!("share" in navigator) || !("canShare" in navigator)) {
            return false;
        }

        try {
            if (!navigator.canShare({ files: [file] })) {
                return false;
            }

            await navigator.share({
                files: [file],
                title: "Mind the Gap Poster",
            });
            return true;
        } catch (shareError) {
            if (
                shareError instanceof DOMException &&
                shareError.name === "AbortError"
            ) {
                return true;
            }
            return false;
        }
    }

    function openImagePreviewTab(imageUrl: string): void {
        const previewWindow = window.open("", "_blank");
        if (!previewWindow) {
            window.location.href = imageUrl;
            return;
        }

        previewWindow.document.write(
            `<html><head><title>Poster Preview</title></head><body style="margin:0;background:#111;display:grid;place-items:center;"><img src="${imageUrl}" style="max-width:100%;height:auto;" alt="Poster preview" /></body></html>`,
        );
        previewWindow.document.close();
    }

    async function waitForPosterImages(node: HTMLElement): Promise<void> {
        const images = Array.from(node.querySelectorAll("img"));

        await Promise.all(
            images.map(async (image) => {
                if (!image.complete) {
                    await new Promise<void>((resolve) => {
                        const done = () => resolve();
                        image.addEventListener("load", done, { once: true });
                        image.addEventListener("error", done, { once: true });
                    });
                }

                if ("decode" in image) {
                    try {
                        await image.decode();
                    } catch {
                        // decode can fail for already-decoded or broken images
                    }
                }
            }),
        );
    }

    function wait(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    async function dumpPosterAsImage(): Promise<void> {
        if (!browser || !posterElement || isDumping) {
            return;
        }

        isDumping = true;
        error = "";

        try {
            if ("fonts" in document) {
                await document.fonts.ready;
            }

            await waitForPosterImages(posterElement);
            await wait(1000);

            const canvas = await html2canvas(posterElement, {
                backgroundColor: "#f5f7ff",
                scale: 2,
                useCORS: true,
                allowTaint: true,
                logging: false,
            });
            const blob = await canvasToBlob(canvas);

            const date = new Date().toISOString().slice(0, 10);
            const extension = "png";
            const filename = `mind-the-gap-review-${date}.${extension}`;
            const file = new File([blob], filename, { type: blob.type });

            const shared = await tryShareImage(file);
            if (shared) {
                return;
            }

            const objectUrl = URL.createObjectURL(blob);
            if (isStandaloneAppMode()) {
                openImagePreviewTab(objectUrl);
                setTimeout(() => URL.revokeObjectURL(objectUrl), 30_000);
                return;
            }

            const anchor = document.createElement("a");
            anchor.href = objectUrl;
            anchor.download = filename;
            document.body.append(anchor);
            anchor.click();
            anchor.remove();
            URL.revokeObjectURL(objectUrl);
        } catch {
            error = "Could not export poster image. Please try again.";
        } finally {
            isDumping = false;
        }
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
    <title>Mind the Gap | Achievements Poster</title>
    <meta
        name="description"
        content="Single yearly-review poster for your London newcomer achievements."
    />
</svelte:head>

<section class="page">
    {#if error}
        <p class="notice">{error}</p>
    {/if}

    {#if isLoading}
        <p class="notice">Loading achievements...</p>
    {:else if guideSections.length === 0}
        <p class="notice">
            No achievements yet. Add photos from a guide to build your poster.
        </p>
    {:else}
        <div class="actions">
            <button
                class="dump-button"
                disabled={isDumping}
                onclick={dumpPosterAsImage}
                type="button"
            >
                {isDumping ? "Generating..." : "Download My Poster"}
            </button>
        </div>

        <article bind:this={posterElement} class="poster">
            <header class="poster-header">
                <p class="poster-kicker">Mind the Gap</p>
                <h1>My London Stories</h1>
                <div class="poster-subtitle">
                    Since {firstUpdateDate()}
                </div>
            </header>

            <ol class="section-list">
                {#each guideSections as section, index (section.guideId)}
                    <li class="section-item">
                        <div
                            aria-hidden="true"
                            class="section-shape"
                            style={buildShapeStyle(section.guideId)}
                        ></div>
                        <div class="section-content">
                            <div class="section-head">
                                <div class="head-main">
                                    <span class="count">
                                        {String(index + 1).padStart(2, "0")}
                                    </span>
                                    <div>
                                        <h2>
                                            {section.guide?.title ??
                                                "Unknown guide"}
                                        </h2>
                                    </div>
                                </div>

                                <div class="head-side">
                                    {#if section.guide}
                                        <span class="difficulty">
                                            {section.guide.difficulty}
                                        </span>
                                        <img
                                            alt={section.guide.iconAlt}
                                            class="icon"
                                            src={section.guide.icon}
                                        />
                                    {/if}
                                </div>
                            </div>

                            <p>{sectionWhyItMatters(section.guide)}</p>

                            <div class="photo-grid">
                                {#each section.photos as achievement (achievement.id)}
                                    <figure
                                        class="photo-item"
                                        style={buildPhotoStyle(achievement.id)}
                                    >
                                        <FullscreenPhoto
                                            alt="Accomplished achievement"
                                            src={achievement.imageDataUrl}
                                            title={new Date(
                                                achievement.createdAt,
                                            ).toLocaleString("en-GB")}
                                        />
                                        <figcaption class="photo-time">
                                            {new Date(
                                                achievement.createdAt,
                                            ).toLocaleString("en-GB")}
                                        </figcaption>
                                    </figure>
                                {/each}
                            </div>
                        </div>
                    </li>
                {/each}
            </ol>
        </article>
    {/if}
</section>

<style>
    .page {
        display: grid;
        gap: 1rem;
    }

    .notice {
        margin: 0;
        border: 1px solid #bfd1ff;
        border-radius: 0.75rem;
        background: #fff;
        color: #1f2937;
        padding: 0.7rem 0.85rem;
    }

    .actions {
        display: flex;
        justify-content: flex-end;
    }

    .dump-button {
        display: inline-block;
        text-decoration: none;
        background: var(--primary-blue);
        border: 1px solid #d1d5db;
        color: #ffffff;
        padding: 0.7rem 1rem;
        border-radius: 999px;
        font: inherit;
        font-size: 0.95rem;
        cursor: pointer;
    }

    .dump-button:disabled {
        opacity: 0.65;
        cursor: progress;
    }

    .poster {
        position: relative;
        overflow: hidden;
        margin: 0 -1rem;
        padding: 1.2rem;
        display: grid;
        gap: 1rem;
        background: #fff;
        border: 1px solid #bed0ff;
    }

    .poster-header {
        position: relative;
        z-index: 1;
        padding: 0.9rem;
        display: grid;
        gap: 0.35rem;
    }

    .poster-kicker {
        margin: 0;
        color: var(--primary-pink);
        font-size: 0.76rem;
        text-transform: uppercase;
        letter-spacing: 0.08em;
    }

    .poster-header h1 {
        margin: 0;
        color: #111827;
    }

    .poster-subtitle {
        margin: 0;
        color: var(--primary-blue);
    }

    .section-list {
        list-style: none;
        margin: 0;
        padding: 0;
        display: grid;
        gap: 1rem;
    }

    .section-item {
        position: relative;
        min-height: 190px;
        isolation: isolate;
    }

    .section-shape {
        position: absolute;
        inset: 0;
        background: #fff;
        z-index: 0;
    }

    .section-content {
        position: relative;
        z-index: 1;
        display: grid;
        gap: 0.5rem;
        padding: 1rem;
        color: #0f172a;
    }

    .section-content p {
        margin: 0;
        line-height: 1.4;
    }

    .section-head {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 0.6rem;
    }

    .head-main {
        display: flex;
        align-items: center;
        gap: 0.55rem;
    }

    .count {
        color: var(--primary-pink);
        font-weight: 600;
        font-size: 2rem;
        line-height: 1;
        min-width: 2.2rem;
    }

    h2 {
        margin: 0;
    }

    .head-side {
        display: grid;
        justify-items: end;
        gap: 0.45rem;
    }

    .difficulty {
        border-radius: 999px;
        font-size: 0.76rem;
        padding: 0.2rem 0.5rem;
        border: 1px solid #bfdbfe;
        background: #eff6ff;
        color: #1d4ed8;
    }

    .icon {
        position: absolute;
        right: 2rem;
        bottom: 0;
        transform: translateX(30%);
        width: 15rem;
        height: 15rem;
        object-fit: contain;
    }

    .photo-grid {
        margin-top: 1.5rem;
        display: grid;
        direction: rtl;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 0.55rem;
    }

    .photo-item {
        margin: 0;
        display: grid;
        gap: 0.32rem;
        transform-origin: center;
    }

    .photo-time {
        margin: 0;
        font-size: 0.74rem;
        color: #475569;
    }

    @media (max-width: 680px) {
        .poster {
            padding: 0.9rem;
        }

        .section-content {
            padding: 0.8rem;
        }
    }
</style>
