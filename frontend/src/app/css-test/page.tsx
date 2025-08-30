"use client";

export default function CSSTestPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
          CSS Test Page
        </h1>

        <div className="space-y-6">
          {/* Test Tailwind Classes */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
              Tailwind CSS Test
            </h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-red-500 text-white p-4 rounded-lg">
                Red Box
              </div>
              <div className="bg-green-500 text-white p-4 rounded-lg">
                Green Box
              </div>
              <div className="bg-blue-500 text-white p-4 rounded-lg">
                Blue Box
              </div>
            </div>
          </section>

          {/* Test Glass System */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
              Glass System Test
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="liquid-glass p-6 rounded-xl">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Standard Glass
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  This should have a glass effect with backdrop blur
                </p>
              </div>
              <div className="liquid-glass--prominent p-6 rounded-xl">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Prominent Glass
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  This should have a stronger glass effect
                </p>
              </div>
            </div>
          </section>

          {/* Test CSS Variables */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
              CSS Variables Test
            </h2>
            <div
              className="p-6 rounded-xl border"
              style={{
                backgroundColor: "var(--glass-bg-standard)",
                borderColor: "var(--glass-border-standard)",
                backdropFilter: "blur(var(--glass-blur-lg))",
              }}
            >
              <p className="text-gray-900 dark:text-white">
                This box uses CSS variables directly. If you see this with glass
                styling, CSS variables are working.
              </p>
            </div>
          </section>

          {/* Test Typography */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
              Typography Test
            </h2>
            <div className="space-y-2">
              <p className="text-4xl font-bold">Heading 1 Style</p>
              <p className="text-2xl font-semibold">Heading 2 Style</p>
              <p className="text-lg">Large body text</p>
              <p className="text-base">Regular body text</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Small muted text
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
