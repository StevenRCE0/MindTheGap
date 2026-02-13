<script lang="ts">
    import shotImage from "$lib/assets/Shot.png";
</script>

<svelte:head>
    <title>Mind the App</title>
    <meta
        name="description"
        content="Download page for Mind the Gap app. Stay tuned for release."
    />
</svelte:head>

<section class="download-page">
    <article class="card">
        <img alt="App preview shot" class="preview" src={shotImage} />
        <h1>Mind the Gap App</h1>
        <button class="status-button" disabled type="button">Stay tuned</button>
    </article>
</section>

<style>
    .download-page {
        display: grid;
    }

    .card {
        background: #ffffff;
        border: 1px solid #d9def2;
        border-radius: 1rem;
        padding: 1rem;
        display: grid;
        gap: 0.6rem;
    }

    h1 {
        margin: 2rem auto;
        color: #0f172a;
    }

    .status-button {
        width: fit-content;
        margin: 1rem auto;
        border: 1px solid #d1d5db;
        border-radius: 999px;
        padding: 0.45rem 0.85rem;
        background: #e5e7eb;
        color: #6b7280;
        font: inherit;
        font-weight: 600;
        cursor: not-allowed;
        opacity: 0.95;
    }

    p {
        margin: 0;
    }

    .preview {
        width: 100%;
        max-width: 760px;
        border-radius: 0.75rem;
        border: 1px solid #d9def2;
        object-fit: cover;
    }
</style>
