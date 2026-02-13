<script lang="ts">
	import { Lightbox } from 'svelte-lightbox';

	let { src, alt = 'Saved achievement', title = '' } = $props<{
		src: string;
		alt?: string;
		title?: string;
	}>();
</script>

<Lightbox description={title} enableClickToClose={true} imagePreset="fullscreen">
	<img alt={alt} class="photo-tile" src={src} />
</Lightbox>

<style>
	.photo-tile {
		width: 100%;
		aspect-ratio: 1 / 1;
		border: 1px solid #e5e7eb;
		border-radius: 0.6rem;
		background: #fcfcfd;
		object-fit: cover;
		cursor: zoom-in;
	}
</style>
