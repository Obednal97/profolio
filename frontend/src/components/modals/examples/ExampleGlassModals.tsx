"use client";

import React, { useState } from "react";
import {
  GlassModal,
  GlassModalContent,
  GlassModalHeader,
  GlassModalBody,
  GlassModalFooter,
  GlassButton,
  GlassInput,
} from "../index";

// Example 1: Basic Confirmation Modal
export function ExampleBasicModal() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <GlassButton onClick={() => setIsOpen(true)} variant="primary">
        Open Basic Modal
      </GlassButton>

      <GlassModal isOpen={isOpen} onClose={() => setIsOpen(false)} size="sm">
        <GlassModalContent>
          <GlassModalHeader
            title="Confirm Action"
            onClose={() => setIsOpen(false)}
          />
          <GlassModalBody>
            <p>Are you sure you want to proceed with this action?</p>
          </GlassModalBody>
          <GlassModalFooter>
            <GlassButton variant="primary">Confirm</GlassButton>
            <GlassButton onClick={() => setIsOpen(false)}>Cancel</GlassButton>
          </GlassModalFooter>
        </GlassModalContent>
      </GlassModal>
    </>
  );
}

// Example 2: Form Modal
export function ExampleFormModal() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <GlassButton onClick={() => setIsOpen(true)} variant="success">
        Add New Asset
      </GlassButton>

      <GlassModal isOpen={isOpen} onClose={() => setIsOpen(false)} size="md">
        <GlassModalContent>
          <GlassModalHeader
            title="Add New Asset"
            onClose={() => setIsOpen(false)}
          />
          <GlassModalBody>
            <div className="space-y-4">
              <GlassInput label="Asset Symbol" placeholder="AAPL" type="text" />
              <GlassInput label="Quantity" placeholder="100" type="number" />
              <GlassInput
                label="Purchase Price"
                placeholder="150.00"
                type="number"
                step="0.01"
              />
            </div>
          </GlassModalBody>
          <GlassModalFooter>
            <GlassButton variant="success">Add Asset</GlassButton>
            <GlassButton onClick={() => setIsOpen(false)}>Cancel</GlassButton>
          </GlassModalFooter>
        </GlassModalContent>
      </GlassModal>
    </>
  );
}

// Example 3: Large Content Modal
export function ExampleLargeModal() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <GlassButton onClick={() => setIsOpen(true)} variant="primary">
        Portfolio Details
      </GlassButton>

      <GlassModal isOpen={isOpen} onClose={() => setIsOpen(false)} size="lg">
        <GlassModalContent>
          <GlassModalHeader
            title="Apple Inc. (AAPL)"
            onClose={() => setIsOpen(false)}
          />
          <GlassModalBody>
            <div className="space-y-6">
              {/* Performance Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="liquid-glass bg-gradient-to-br from-green-500/15 to-emerald-500/15 border-green-500/30 backdrop-blur-md p-6 rounded-2xl border shadow-xl">
                  <h4 className="font-semibold text-green-600 mb-2">
                    Current Value
                  </h4>
                  <p className="text-2xl font-bold text-green-600">£12,500</p>
                  <p className="text-sm text-green-600">+£2,500 (+25.0%)</p>
                </div>

                <div className="liquid-glass bg-white/12 dark:bg-black/25 backdrop-blur-md p-6 rounded-2xl border border-white/25 dark:border-white/15 shadow-xl">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                    Shares Owned
                  </h4>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    100
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    @ £125.00 each
                  </p>
                </div>
              </div>

              {/* Chart Placeholder */}
              <div className="liquid-glass bg-white/12 dark:bg-black/25 backdrop-blur-md p-6 rounded-2xl border border-white/25 dark:border-white/15 shadow-xl">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
                  Performance Chart
                </h4>
                <div className="h-32 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl flex items-center justify-center">
                  <span className="text-gray-600 dark:text-gray-400">
                    📈 Chart Visualization
                  </span>
                </div>
              </div>
            </div>
          </GlassModalBody>
          <GlassModalFooter>
            <GlassButton variant="primary">Buy More</GlassButton>
            <GlassButton variant="danger">Sell</GlassButton>
            <GlassButton onClick={() => setIsOpen(false)}>Close</GlassButton>
          </GlassModalFooter>
        </GlassModalContent>
      </GlassModal>
    </>
  );
}

// Example Showcase Component
export function GlassModalExamples() {
  return (
    <div className="space-y-8 p-8">
      <div>
        <h2 className="text-2xl font-bold mb-4">Glass Modal Examples</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Ready-to-use glass modal components with Apple&apos;s Liquid Glass
          design.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="text-center">
          <h3 className="font-semibold mb-3">Basic Modal</h3>
          <ExampleBasicModal />
        </div>

        <div className="text-center">
          <h3 className="font-semibold mb-3">Form Modal</h3>
          <ExampleFormModal />
        </div>

        <div className="text-center">
          <h3 className="font-semibold mb-3">Large Modal</h3>
          <ExampleLargeModal />
        </div>
      </div>

      {/* Usage Code Example */}
      <div className="liquid-glass bg-white/12 dark:bg-black/25 backdrop-blur-md p-6 rounded-2xl border border-white/25 dark:border-white/15 shadow-xl">
        <h3 className="font-semibold mb-4">Usage Example</h3>
        <pre className="text-sm bg-black/20 dark:bg-white/10 p-4 rounded-xl overflow-x-auto">
          <code>{`import {
  GlassModal,
  GlassModalContent,
  GlassModalHeader,
  GlassModalBody,
  GlassModalFooter,
  GlassButton,
} from "@/components/modals";

function MyModal() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <GlassModal isOpen={isOpen} onClose={() => setIsOpen(false)}>
      <GlassModalContent>
        <GlassModalHeader title="My Modal" onClose={() => setIsOpen(false)} />
        <GlassModalBody>
          <p>Modal content goes here...</p>
        </GlassModalBody>
        <GlassModalFooter>
          <GlassButton variant="primary">Save</GlassButton>
          <GlassButton onClick={() => setIsOpen(false)}>Cancel</GlassButton>
        </GlassModalFooter>
      </GlassModalContent>
    </GlassModal>
  );
}`}</code>
        </pre>
      </div>
    </div>
  );
}
