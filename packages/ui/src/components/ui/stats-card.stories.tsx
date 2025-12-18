import type { Meta, StoryObj } from '@storybook/react';
import { StatsCard } from './stats-card';
import { Users, DollarSign, ShoppingCart, TrendingUp, TrendingDown } from 'lucide-react';

const meta: Meta<typeof StatsCard> = {
  title: 'Components/StatsCard',
  component: StatsCard,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'elevated', 'outlined'],
    },
    title: {
      control: 'text',
    },
    value: {
      control: 'text',
    },
    tooltipContent: {
      control: 'text',
    },
  },
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<typeof StatsCard>;

export const Default: Story = {
  args: {
    title: 'Total Users',
    value: '12,345',
    icon: <Users />,
  },
};

export const WithPositiveTrend: Story = {
  args: {
    title: 'Revenue',
    value: '$45,678',
    trend: {
      label: '+12.5%',
      isPositive: true,
    },
    icon: <DollarSign />,
  },
};

export const WithNegativeTrend: Story = {
  args: {
    title: 'Orders',
    value: '892',
    trend: {
      label: '-3.2%',
      isPositive: false,
    },
    icon: <ShoppingCart />,
  },
};

export const WithTooltip: Story = {
  args: {
    title: 'Conversion Rate',
    value: '3.4%',
    tooltipContent: 'Percentage of visitors who complete a purchase',
    icon: <TrendingUp />,
  },
};

export const Elevated: Story = {
  args: {
    title: 'Active Sessions',
    value: '1,234',
    variant: 'elevated',
    icon: <Users />,
    trend: {
      label: '+8.1%',
      isPositive: true,
    },
  },
};

export const Outlined: Story = {
  args: {
    title: 'Bounce Rate',
    value: '42.3%',
    variant: 'outlined',
    icon: <TrendingDown />,
    trend: {
      label: '-2.4%',
      isPositive: true,
    },
    tooltipContent: 'Percentage of visitors who leave after viewing one page',
  },
};

export const LargeValue: Story = {
  args: {
    title: 'Total Revenue',
    value: '$1,234,567',
    trend: {
      label: '+18.7%',
      isPositive: true,
    },
    icon: <DollarSign />,
    tooltipContent: 'Total revenue generated this quarter',
  },
};

export const NoIcon: Story = {
  args: {
    title: 'Page Views',
    value: '98,765',
    trend: {
      label: '+5.3%',
      isPositive: true,
    },
  },
};

export const GridExample: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl">
      <StatsCard
        title="Total Users"
        value="12,345"
        icon={<Users />}
        trend={{ label: '+12.5%', isPositive: true }}
      />
      <StatsCard
        title="Revenue"
        value="$45,678"
        icon={<DollarSign />}
        trend={{ label: '+8.3%', isPositive: true }}
        tooltipContent="Total revenue this month"
      />
      <StatsCard
        title="Orders"
        value="892"
        icon={<ShoppingCart />}
        trend={{ label: '-3.2%', isPositive: false }}
      />
      <StatsCard
        title="Conversion Rate"
        value="3.4%"
        icon={<TrendingUp />}
        variant="elevated"
        tooltipContent="Percentage of visitors who convert"
      />
      <StatsCard
        title="Bounce Rate"
        value="42.3%"
        icon={<TrendingDown />}
        variant="outlined"
        trend={{ label: '-2.4%', isPositive: true }}
      />
      <StatsCard
        title="Active Sessions"
        value="1,234"
        icon={<Users />}
        trend={{ label: '+5.7%', isPositive: true }}
      />
    </div>
  ),
  parameters: {
    layout: 'fullscreen',
  },
};
