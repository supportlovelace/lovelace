import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './button';
// Importe une icône si tu en as (ex: Lucide React), sinon on utilise un emoji pour l'exemple
import { Rocket } from "lucide-react"

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'secondary', 'destructive', 'outline', 'ghost', 'glass'],
    },
    size: {
      control: 'select',
      options: ['default', 'sm', 'lg', 'icon'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: {
    children: 'Primary Action',
    variant: 'default',
  },
};

export const Secondary: Story = {
  args: {
    children: 'Secondary Action',
    variant: 'secondary',
  },
};

export const Destructive: Story = {
  args: {
    children: 'Delete Item',
    variant: 'destructive',
  },
};

export const Outline: Story = {
  args: {
    children: 'Outline Style',
    variant: 'outline',
  },
};

export const Ghost: Story = {
  args: {
    children: 'Ghost Button',
    variant: 'ghost',
  },
};

export const Glass: Story = {
  args: {
    children: 'Glass Effect',
    variant: 'glass',
  },
  parameters: {
    // Petit tips : mets un fond coloré dans Storybook pour voir l'effet Glass
    backgrounds: { default: 'dark' },
  },
};

export const Small: Story = {
  args: {
    children: 'Small Button',
    size: 'sm',
  },
};

export const IconOnly: Story = {
  args: {
    // On passe le JSX de l'icône ici
    children: <Rocket className="size-5" />, 
    size: 'icon',
    variant: 'default',
    'aria-label': 'Launch Rocket', // Très important pour l'accessibilité
  },
};