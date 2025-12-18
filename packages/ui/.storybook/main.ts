import type { StorybookConfig } from '@storybook/react-vite';
import { dirname } from "path"
import { fileURLToPath } from "url"
import tailwindcss from "@tailwindcss/vite"; // <-- Ajoute cet import

function getAbsolutePath(value: string): any {
  return dirname(fileURLToPath(import.meta.resolve(`${value}/package.json`)))
}

const config: StorybookConfig = {
  "stories": [
    "../src/**/*.mdx",
    "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"
  ],
  "addons": [
    getAbsolutePath('@chromatic-com/storybook'),
    getAbsolutePath('@storybook/addon-vitest'),
    getAbsolutePath('@storybook/addon-a11y'),
    getAbsolutePath('@storybook/addon-docs')
  ],
  "framework": getAbsolutePath('@storybook/react-vite'),
  
  // AJOUTE CE BLOC ICI
  viteFinal: async (config) => {
    config.plugins?.push(tailwindcss());
    return config;
  },
};

export default config;