<script lang="ts">
    import { browser } from "$app/environment";
    import { onMount } from "svelte";
    import { achievementRepository } from "$lib/model/achievement-repository";
    import { londonGuides } from "$lib/guides";

    type CardShape = {
        id: number;
        top: number;
        left: number;
        rotate: number;
        opacity: number;
        color: string;
        clipPath: string;
    };

    let completionByGuide = $state<Record<string, number>>({});

    function isFinished(guideId: string): boolean {
        return (completionByGuide[guideId] ?? 0) > 0;
    }

    function hashCode(value: string): number {
        let hash = 0;
        for (let i = 0; i < value.length; i += 1) {
            hash = (hash << 5) - hash + value.charCodeAt(i);
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

    function buildCardShapes(guideId: string): CardShape[] {
        const rand = seededRandom(hashCode(guideId));
        const colors = ["#fff"];

        return Array.from({ length: 1 }, (_, id) => {
            const p1x = randomBetween(rand, 0, 5);
            const p1y = randomBetween(rand, 0, 5);
            const p2x = randomBetween(rand, 95, 100);
            const p2y = randomBetween(rand, 0, 2);
            const p3x = randomBetween(rand, 95, 100);
            const p3y = randomBetween(rand, 95, 100);
            const p4x = randomBetween(rand, 0, 3);
            const p4y = randomBetween(rand, 97, 100);

            return {
                id,
                top: randomBetween(rand, 1, 0),
                left: randomBetween(rand, 2, 0),
                rotate: randomBetween(rand, -0.5, 0.5),
                opacity: randomBetween(rand, 1, 0.9),
                color: colors[
                    (id + Math.floor(rand() * colors.length)) % colors.length
                ],
                clipPath: `polygon(${p1x}% ${p1y}%, ${p2x}% ${p2y}%, ${p3x}% ${p3y}%, ${p4x}% ${p4y}%)`,
            };
        });
    }

    onMount(() => {
        if (!browser || !achievementRepository.isAvailable()) {
            return;
        }

        void (async () => {
            try {
                completionByGuide =
                    await achievementRepository.getCountsByGuide();
            } catch {
                completionByGuide = {};
            }
        })();
    });
</script>

<svelte:head>
    <title>Mind the Gap | Home</title>
    <meta
        name="description"
        content="Choose a London newcomer guide, read it, and log your achievement photos."
    />
</svelte:head>

<section class="home">
    <div class="content">
        <section class="intro">
            <h1>Choose a guide</h1>
            <p>Read the guide, then log a photo achievement.</p>
        </section>

        <ol class="guide-list">
            {#each londonGuides as guide, index}
                <li class="guide-item">
                    <article class="guide-row">
                        <div aria-hidden="true" class="card-shapes">
                            {#each buildCardShapes(guide.id) as shape (shape.id)}
                                <span
                                    class="card-shape"
                                    style={`top:${shape.top}%;left:${shape.left}%;width:100%;height:100%;transform:rotate(${shape.rotate}deg);opacity:${shape.opacity};background:${shape.color};clip-path:${shape.clipPath};`}
                                ></span>
                            {/each}
                        </div>

                        <div class="card-content">
                            <img
                                alt={guide.iconAlt}
                                class="guide-icon"
                                src={guide.icon}
                            />
                            <div class="head">
                                <div class="count">
                                    {String(index + 1).padStart(2, "0")}
                                </div>
                                <h2>{guide.title}</h2>
                                <div class="badges">
                                    <span
                                        class={`${isFinished(guide.id) ? "finished" : "pending"}`}
                                    >
                                        {isFinished(guide.id)
                                            ? "Finished"
                                            : "Not finished"}
                                    </span>
                                    <span class="badge difficulty"
                                        >{guide.difficulty}</span
                                    >
                                </div>
                            </div>

                            <p>{guide.whyItMatters}</p>
                            <p><strong>Quick win:</strong> {guide.quickWin}</p>

                            <div class="actions">
                                <a class="button" href={`/guide/${guide.id}`}
                                    >Open guide</a
                                >
                            </div>
                        </div>
                    </article>
                </li>
            {/each}
        </ol>
    </div>
</section>

<style>
    .home {
        position: relative;
        overflow: hidden;
        border-radius: 1.2rem;
        padding: 1rem;
    }

    .intro {
        margin-bottom: 0.9rem;
    }

    .intro h1 {
        margin: 0;
        color: #ffffff;
    }

    .intro p {
        margin: 0.3rem 0 0;
        color: var(--secondary-blue);
        font-size: 1.2rem;
    }

    .guide-list {
        list-style: none;
        margin: 0;
        padding: 0;
        display: grid;
        gap: 2rem;
    }

    .guide-item {
        margin: 0;
    }

    .guide-row {
        position: relative;
        background: transparent;
        border: none;
        box-shadow: none;
        min-height: 168px;
        isolation: isolate;
    }

    .card-shapes {
        position: absolute;
        inset: 0;
        pointer-events: none;
        z-index: 0;
    }

    .card-shape {
        position: absolute;
        filter: blur(0.3px);
    }

    .card-content {
        position: relative;
        z-index: 1;
        display: grid;
        gap: 0.55rem;
        padding: 3rem;
        color: #0f172a;

        p {
            padding-left: 1em;
        }
    }

    .head {
        display: flex;
        align-items: center;
        gap: 0.55rem;
    }

    .guide-icon {
        bottom: 0;
        right: 2rem;
        transform: translateX(30%);
        position: absolute;
        height: 10rem;
        width: auto;
        object-fit: cover;
        overflow: visible;
    }

    .count {
        margin-left: -2rem;
        color: var(--primary-pink);
        font-weight: 600;
        font-size: 32pt;
    }

    h2 {
        margin: 0;
    }

    p {
        margin: 0;
        line-height: 1.5;
    }

    .badges {
        display: flex;
        margin-left: 1rem;
        gap: 0.4rem;
        flex-wrap: wrap;
    }

    .badge {
        border-radius: 999px;
        font-size: 0.78rem;
        padding: 0.2rem 0.5rem;
        border: 1px solid #d1d5db;
        background: rgba(243, 244, 246, 0.82);
        backdrop-filter: blur(1px);
    }

    .finished {
        position: absolute;
        top: -1rem;
        right: 0.5rem;
        display: blcok;
        font-size: 48pt;
        transform: rotate(-4deg);
        font-family: var(--font-special);
        color: var(--primary-pink);
    }

    .pending {
        display: none;
        color: #374151;
    }

    .badge.difficulty {
        background: #eff6ff;
        border-color: #bfdbfe;
        color: #1d4ed8;
    }

    .actions {
        margin-top: 0.2rem;
    }

    .button {
        margin-top: 0.5rem;
        display: inline-block;
        text-decoration: none;
        background: var(--primary-blue);
        border: 1px solid #d1d5db;
        color: #fff;
        padding: 0.75rem 1rem;
        border-radius: 999px;
        font-size: 0.94rem;
    }
</style>
