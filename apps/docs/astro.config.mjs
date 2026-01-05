// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import mermaid from 'astro-mermaid';

// https://astro.build/config
export default defineConfig({
	integrations: [
		mermaid(),
		starlight({
			title: 'Lovelace Docs',
			customCss: ['./src/styles.css'],
			social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/antoineanastasio/lovelace' }],
			sidebar: [
				{
					label: 'Guides',
					items: [
						{ label: 'Introduction', slug: 'introduction' },
						{ label: 'Onboarding Configuration', slug: 'guides/onboarding' },
						{ label: 'Workflow Lifecycle', slug: 'guides/onboarding-workflow' },
						{ label: 'Kestra Integration', slug: 'guides/kestra-integration' },
						{ label: 'Ingestion Architecture', slug: 'guides/ingestion-architecture' },
						{ label: 'Example Guide', slug: 'guides/example' },
					],
				},
				{
					label: 'Components',
					autogenerate: { directory: 'components' },
				},
				{
					label: 'Reference',
					autogenerate: { directory: 'reference' },
				},
			],
		}),
		react(),
	],
	vite: {
		plugins: [tailwindcss()],
	},
});
