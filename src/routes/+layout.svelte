<script lang="ts">
    import { browser } from "$app/environment";
    import { onNavigate } from "$app/navigation";
    import favicon from "$lib/assets/favicon.svg";
    import { onMount } from "svelte";
    import "$lib/styles/fonts.css";
    import "$lib/styles/palette.css";

    let { children } = $props();
    let isOnline = $state(true);

    if (browser) {
        onNavigate((navigation) => {
            const doc = document as Document & {
                startViewTransition?: (
                    callback: () => Promise<void> | void,
                ) => void;
            };

            if (!doc.startViewTransition) {
                return;
            }

            return new Promise<void>((resolve) => {
                doc.startViewTransition!(async () => {
                    resolve();
                    await navigation.complete;
                });
            });
        });
    }

    onMount(() => {
        if (!browser) {
            return;
        }

        isOnline = navigator.onLine;
        const updateOnlineStatus = () => (isOnline = navigator.onLine);
        window.addEventListener("online", updateOnlineStatus);
        window.addEventListener("offline", updateOnlineStatus);

        return () => {
            window.removeEventListener("online", updateOnlineStatus);
            window.removeEventListener("offline", updateOnlineStatus);
        };
    });
</script>

<svelte:head>
    <link rel="icon" href={favicon} />
    <link rel="manifest" href="/manifest.webmanifest" />
    <meta name="theme-color" content="#415fff" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
</svelte:head>

<div class="app-shell">
    <header class="topbar">
        <a class="brand" href="/"
            >Mind the <span style="letter-spacing: 0.25rem;">Gap</span></a
        >
        {#if !isOnline}
            <p class="offline-banner">Are you in the tube?</p>
        {/if}
        <nav>
            <a href="/">Guides</a>
            <a href="/achievements">Achievements</a>
        </nav>
    </header>
    <main>{@render children()}</main>
</div>

<style>
    :global(*) {
        box-sizing: border-box;
    }

    :global(body) {
        margin: 0;
        font-family: var(--font-text);
        background: var(--primary-blue);
        color: #1f2937;
    }

    :global(a) {
        color: var(--primary-blue);
    }

    :global(h1),
    :global(h2),
    :global(h3),
    :global(h4),
    :global(h5),
    :global(h6) {
        letter-spacing: 0.01em;
    }

    .app-shell {
        min-height: 100vh;
    }

    .topbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 1.25rem 1.25rem;
        /*background: #ffffff;*/
        flex-wrap: wrap;
        gap: 0.6rem;
        view-transition-name: head;
    }

    .brand {
        font-family: var(--font-brand);
        font-weight: 700;
        font-size: 24pt;
        text-decoration: none;
        color: var(--secondary-pink);
    }

    nav {
        display: flex;
        gap: 0.9rem;
    }

    nav a {
        text-decoration: none;
        font-size: 2rem;
        color: var(--secondary-pink);
        text-decoration: underline;
    }

    .offline-banner {
        margin: 0;
        padding: 0.25rem 0.55rem;
        border-radius: 999px;
        border: 1px solid #fcd34d;
        background: #fef3c7;
        color: #92400e;
        font-size: 0.85rem;
    }

    main {
        max-width: 980px;
        margin: 0 auto;
        padding: 1.25rem 1rem 2rem;
    }

    :global(::view-transition-old(root)) {
        animation: route-fade-out 140ms ease-out both;
    }

    :global(::view-transition-new(root)) {
        animation: route-slide-up-in 220ms ease-out both;
    }

    @keyframes fade-in {
        from {
            opacity: 0;
        }
    }

    @keyframes fade-out {
        to {
            opacity: 0;
        }
    }

    @keyframes slide-from-right {
        from {
            transform: translateX(30px) rotate(5deg);
            transform-origin: top;
        }
    }

    @keyframes slide-to-left {
        to {
            transform: translateX(-30px) rotate(5deg);
            transform-origin: top;
        }
    }

    :root::view-transition-old(root) {
        animation:
            90ms cubic-bezier(0.4, 0, 1, 1) both fade-out,
            300ms cubic-bezier(0.4, 0, 0.2, 1) both slide-to-left;
    }

    :root::view-transition-new(root) {
        animation:
            210ms cubic-bezier(0, 0, 0.2, 1) 90ms both fade-in,
            300ms cubic-bezier(0.4, 0, 0.2, 1) both slide-from-right;
    }

    @media (prefers-reduced-motion: reduce) {
        :global(::view-transition-old(root)),
        :global(::view-transition-new(root)) {
            animation-duration: 1ms;
        }
    }

    @media (max-width: 640px) {
        .topbar {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.55rem;
        }
    }
</style>
