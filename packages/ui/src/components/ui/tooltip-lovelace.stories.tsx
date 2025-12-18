import type { Meta, StoryObj } from '@storybook/react';
import { TooltipLovelace } from './tooltip-lovelace';
import { Info, HelpCircle, AlertCircle, CheckCircle } from 'lucide-react';

const meta: Meta<typeof TooltipLovelace> = {
  title: 'Components/TooltipLovelace',
  component: TooltipLovelace,
  tags: ['autodocs'],
  argTypes: {
    color: {
      control: 'select',
      options: ['violet', 'blue', 'green', 'red', 'gray'],
    },
    title: {
      control: 'text',
    },
    content: {
      control: 'text',
    },
  },
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<typeof TooltipLovelace>;

export const Default: Story = {
  args: {
    title: 'Information',
    content: 'This is helpful information about the element.',
    color: 'violet',
    children: (
      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-gray-100">
        <Info className="h-5 w-5 text-gray-600" />
      </div>
    ),
  },
};

export const Blue: Story = {
  args: {
    title: 'Help',
    content: 'This tooltip provides additional help information.',
    color: 'blue',
    children: (
      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-blue-100">
        <HelpCircle className="h-5 w-5 text-blue-600" />
      </div>
    ),
  },
};

export const Green: Story = {
  args: {
    title: 'Success',
    content: 'The operation completed successfully.',
    color: 'green',
    children: (
      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-green-100">
        <CheckCircle className="h-5 w-5 text-green-600" />
      </div>
    ),
  },
};

export const Red: Story = {
  args: {
    title: 'Warning',
    content: 'Please be aware of this important warning.',
    color: 'red',
    children: (
      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-red-100">
        <AlertCircle className="h-5 w-5 text-red-600" />
      </div>
    ),
  },
};

export const Gray: Story = {
  args: {
    title: 'Note',
    content: 'This is an additional note for context.',
    color: 'gray',
    children: (
      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-gray-100">
        <Info className="h-5 w-5 text-gray-600" />
      </div>
    ),
  },
};

export const LongContent: Story = {
  args: {
    title: 'Detailed Information',
    content: 'This is a longer tooltip content that demonstrates how the tooltip handles multiple lines of text. It should wrap properly and maintain readability.',
    color: 'violet',
    children: (
      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-purple-100">
        <Info className="h-5 w-5 text-purple-600" />
      </div>
    ),
  },
};

export const TextButton: Story = {
  args: {
    title: 'Click Info',
    content: 'This button performs an important action when clicked.',
    color: 'violet',
    children: (
      <button className="rounded-md bg-[#48355E] px-4 py-2 text-white hover:bg-[#48355E]/90">
        Hover me
      </button>
    ),
  },
};

export const MultipleTooltips: Story = {
  render: () => (
    <div className="flex gap-4">
      <TooltipLovelace
        title="First"
        content="This is the first tooltip."
        color="violet"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-purple-100">
          <Info className="h-5 w-5 text-purple-600" />
        </div>
      </TooltipLovelace>
      
      <TooltipLovelace
        title="Second"
        content="This is the second tooltip with a different color."
        color="blue"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-blue-100">
          <HelpCircle className="h-5 w-5 text-blue-600" />
        </div>
      </TooltipLovelace>
      
      <TooltipLovelace
        title="Third"
        content="This is the third tooltip showing success."
        color="green"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-green-100">
          <CheckCircle className="h-5 w-5 text-green-600" />
        </div>
      </TooltipLovelace>
    </div>
  ),
};

export const CardExample: Story = {
  args: {
    title: 'Card Information',
    content: 'This card displays important statistics and metrics for your dashboard.',
    color: 'violet',
    children: (
      <div className="h-14 w-64 rounded-2xl bg-white p-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#48355E]">
            <Info className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Total Users</p>
            <p className="text-lg font-medium text-gray-900">1,234</p>
          </div>
        </div>
      </div>
    ),
  },
};
