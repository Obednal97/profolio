"use client";

import React from "react";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  BarChart3,
  Plus,
} from "lucide-react";
import { GlassCard, ActionCard, PerformanceCard, InfoCard } from "../index";

// Example 1: Glass Material Variants
export function GlassVariantExamples() {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Glass Material Variants</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <GlassCard variant="subtle" padding="lg">
          <h4 className="font-semibold mb-2">Subtle Glass</h4>
          <p className="text-sm opacity-75">
            Light blur effect for background elements
          </p>
        </GlassCard>

        <GlassCard variant="standard" padding="lg">
          <h4 className="font-semibold mb-2">Standard Glass</h4>
          <p className="text-sm opacity-75">
            Default glass material for most components
          </p>
        </GlassCard>

        <GlassCard variant="prominent" padding="lg">
          <h4 className="font-semibold mb-2">Prominent Glass</h4>
          <p className="text-sm opacity-75">
            High-impact glass for modals and CTAs
          </p>
        </GlassCard>
      </div>
    </div>
  );
}

// Example 2: Solid Color Cards
export function SolidColorExamples() {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Solid Color Cards</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <ActionCard
          solidColor="blue"
          icon={<span className="text-2xl">💬</span>}
          title="Basic Modal"
          description="Simple confirmation"
          onClick={() => console.log("Blue clicked")}
        />

        <ActionCard
          solidColor="purple"
          icon={<span className="text-2xl">📝</span>}
          title="Form Modal"
          description="Add asset form"
          onClick={() => console.log("Purple clicked")}
        />

        <ActionCard
          solidColor="green"
          icon={<span className="text-2xl">📊</span>}
          title="Portfolio"
          description="Asset details"
          onClick={() => console.log("Green clicked")}
        />

        <ActionCard
          solidColor="orange"
          icon={<span className="text-2xl">⚙️</span>}
          title="Settings"
          description="Preferences UI"
          onClick={() => console.log("Orange clicked")}
        />
      </div>
    </div>
  );
}

// Example 3: Gradient Cards
export function GradientExamples() {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Gradient Cards</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ActionCard
          gradient="blue-cyan"
          icon={<Plus className="w-6 h-6" />}
          title="Add Asset"
          description="Create new portfolio item"
          onClick={() => console.log("Add asset")}
        />

        <ActionCard
          gradient="purple-pink"
          icon={<BarChart3 className="w-6 h-6" />}
          title="Analytics"
          description="View performance metrics"
          onClick={() => console.log("Analytics")}
        />

        <ActionCard
          gradient="green-emerald"
          icon={<Wallet className="w-6 h-6" />}
          title="Portfolio"
          description="Manage investments"
          onClick={() => console.log("Portfolio")}
        />
      </div>
    </div>
  );
}

// Example 4: Performance-Based Tinting
export function PerformanceExamples() {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Performance-Based Tinting</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <PerformanceCard
          title="Portfolio Value"
          value={45600}
          performance={8.5}
          subtitle="Total Assets"
          icon={<TrendingUp className="w-5 h-5" />}
        />

        <PerformanceCard
          title="Monthly Change"
          value="£2,450"
          performance={-2.3}
          subtitle="This Month"
          icon={<TrendingDown className="w-5 h-5" />}
        />

        <PerformanceCard
          title="Annual Return"
          value="12.4%"
          performance={0}
          subtitle="Year to Date"
          icon={<BarChart3 className="w-5 h-5" />}
          showPercentage={false}
        />
      </div>
    </div>
  );
}

// Example 5: Different Sizes & Padding
export function SizingExamples() {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Sizing & Padding Options</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <GlassCard padding="sm" borderRadius="sm">
          <h4 className="font-semibold">Small</h4>
          <p className="text-sm">Compact layout</p>
        </GlassCard>

        <GlassCard padding="md" borderRadius="md">
          <h4 className="font-semibold">Medium</h4>
          <p className="text-sm">Standard layout</p>
        </GlassCard>

        <GlassCard padding="lg" borderRadius="lg">
          <h4 className="font-semibold">Large</h4>
          <p className="text-sm">Spacious layout</p>
        </GlassCard>

        <GlassCard padding="xl" borderRadius="3xl">
          <h4 className="font-semibold">Extra Large</h4>
          <p className="text-sm">Maximum space</p>
        </GlassCard>
      </div>
    </div>
  );
}

// Example 6: Animation & Interaction Options
export function InteractionExamples() {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Animation & Interaction</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <GlassCard
          clickable
          hoverScale={1.05}
          hoverY={-4}
          animationDelay={0}
          onClick={() => console.log("High hover effect")}
        >
          <h4 className="font-semibold mb-2">High Hover Effect</h4>
          <p className="text-sm">Scale 1.05, Y -4px</p>
        </GlassCard>

        <GlassCard
          clickable
          hoverScale={1.01}
          hoverY={-1}
          animationDelay={0.1}
          onClick={() => console.log("Subtle hover effect")}
        >
          <h4 className="font-semibold mb-2">Subtle Hover Effect</h4>
          <p className="text-sm">Scale 1.01, Y -1px</p>
        </GlassCard>

        <GlassCard
          hoverable={false}
          animate={false}
          onClick={() => console.log("No animation")}
        >
          <h4 className="font-semibold mb-2">No Animation</h4>
          <p className="text-sm">Static card</p>
        </GlassCard>
      </div>
    </div>
  );
}

// Example 7: Info Cards with Different Content
export function InfoCardExamples() {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Info Cards</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <InfoCard
          title="Portfolio Summary"
          content={
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Total Assets:</span>
                <span className="font-semibold">£45,600</span>
              </div>
              <div className="flex justify-between">
                <span>Active Investments:</span>
                <span className="font-semibold">12</span>
              </div>
              <div className="flex justify-between">
                <span>Monthly Return:</span>
                <span className="font-semibold text-green-600">+8.5%</span>
              </div>
            </div>
          }
          footer={
            <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              View Details →
            </button>
          }
          variant="prominent"
        />

        <InfoCard
          title="Market Status"
          content={
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Markets Open</span>
              </div>
              <p className="text-sm">
                FTSE 100: <span className="text-green-600">+0.85%</span>
              </p>
              <p className="text-sm">
                S&P 500: <span className="text-green-600">+1.2%</span>
              </p>
            </div>
          }
          solidColor="blue"
        />
      </div>
    </div>
  );
}

// Main Examples Showcase
export function GlassCardExamples() {
  return (
    <div className="space-y-12 p-8">
      <div>
        <h2 className="text-3xl font-bold mb-4">Glass Card Component System</h2>
        <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
          Comprehensive card components with configurable glass effects,
          performance tinting, solid colors, animations, and responsive
          behavior.
        </p>
      </div>

      <GlassVariantExamples />
      <SolidColorExamples />
      <GradientExamples />
      <PerformanceExamples />
      <SizingExamples />
      <InteractionExamples />
      <InfoCardExamples />

      {/* Usage Examples */}
      <div className="liquid-glass bg-white/12 dark:bg-black/25 backdrop-blur-md p-8 rounded-2xl border border-white/25 dark:border-white/15 shadow-xl">
        <h3 className="text-xl font-semibold mb-6">Usage Examples</h3>

        <div className="space-y-6">
          <div>
            <h4 className="font-semibold mb-3">Basic Glass Card</h4>
            <pre className="text-sm bg-black/20 dark:bg-white/10 p-4 rounded-xl overflow-x-auto">
              <code>{`import { GlassCard } from "@/components/cards";

<GlassCard variant="standard" padding="md">
  <h3>My Card Title</h3>
  <p>Card content goes here...</p>
</GlassCard>`}</code>
            </pre>
          </div>

          <div>
            <h4 className="font-semibold mb-3">Performance Card</h4>
            <pre className="text-sm bg-black/20 dark:bg-white/10 p-4 rounded-xl overflow-x-auto">
              <code>{`import { PerformanceCard } from "@/components/cards";

<PerformanceCard
  title="Portfolio Value"
  value={45600}
  performance={8.5}
  subtitle="Total Assets"
  icon={<TrendingUp />}
/>`}</code>
            </pre>
          </div>

          <div>
            <h4 className="font-semibold mb-3">Action Card with Solid Color</h4>
            <pre className="text-sm bg-black/20 dark:bg-white/10 p-4 rounded-xl overflow-x-auto">
              <code>{`import { ActionCard } from "@/components/cards";

<ActionCard
  solidColor="blue"
  icon={<Plus />}
  title="Add Asset"
  description="Create new portfolio item"
  onClick={() => console.log("Add asset")}
/>`}</code>
            </pre>
          </div>

          <div>
            <h4 className="font-semibold mb-3">Advanced Configuration</h4>
            <pre className="text-sm bg-black/20 dark:bg-white/10 p-4 rounded-xl overflow-x-auto">
              <code>{`<GlassCard
  variant="prominent"
  enablePerformanceTinting
  performance={8.5}
  padding="lg"
  borderRadius="2xl"
  clickable
  hoverScale={1.03}
  hoverY={-3}
  animationDelay={0.1}
  onClick={() => console.log("Clicked")}
>
  <h3>Advanced Card</h3>
  <p>With performance tinting and custom animations</p>
</GlassCard>`}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
