<script lang="ts">
    import GuidePhotoLogger from "$lib/components/GuidePhotoLogger.svelte";
    import type { PageData } from "./$types";

    let { data } = $props<{ data: PageData }>();
</script>

<svelte:head>
    <title>Mind the Gap | {data.guide.title}</title>
    <meta name="description" content={data.guide.whyItMatters} />
</svelte:head>

<section class="card">
    <div class="badge">Difficulty: {data.guide.difficulty}</div>
    <div class="title-row">
        <!-- <img
            alt={data.guide.iconAlt}
            class="guide-icon"
            src={data.guide.icon}
        /> -->
        <h1>{data.guide.title}</h1>
    </div>
    <p>{data.guide.whyItMatters}</p>
    <p><strong>Quick win:</strong> {data.guide.quickWin}</p>
    <ul>
        {#each data.guide.checklist as item}
            <li>{item}</li>
        {/each}
    </ul>
</section>

<GuidePhotoLogger guideId={data.guide.id} guideTitle={data.guide.title} />

<style>
    .card {
        background: #ffffff;
        border: 1px solid #e5e7eb;
        border-radius: 0.75rem;
        padding: 1rem;
        margin-bottom: 1rem;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
    }

    h1 {
        margin: 0 0 0.5rem;
    }

    .title-row {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        margin-bottom: 0.4rem;
    }

    /*.guide-icon {
        position: absolute;
        right: 2rem;
        transform: translateX(30%);
        height: 250px;
        object-fit: contain;
    }*/

    p,
    li {
        line-height: 1.5;
    }

    ul {
        padding-left: 1.2rem;
        margin-bottom: 0;
    }

    .badge {
        display: inline-block;
        background: #eff6ff;
        border: 1px solid #bfdbfe;
        color: #1d4ed8;
        padding: 0.2rem 0.55rem;
        border-radius: 999px;
        font-size: 0.8rem;
        margin: 0.5rem 0;
    }
</style>
