export default function AboutPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <h1 className="text-4xl font-bold">About Zenya AI</h1>
      <p className="mt-4 text-gray-700">We help dropshippers and one-product sellers launch trustworthy, high-converting themes with AI-powered copy, image selection, and color systems.</p>
      <div className="mt-8 grid md:grid-cols-2 gap-6">
        <div className="rounded-xl border border-gray-200 p-6 bg-white">
          <div className="font-semibold">Mission</div>
          <p className="mt-2 text-gray-600">Make professional store design and credible content accessible to everyone.</p>
        </div>
        <div className="rounded-xl border border-gray-200 p-6 bg-white">
          <div className="font-semibold">Values</div>
          <p className="mt-2 text-gray-600">Trust, clarity, conversion — with ethical use of AI.</p>
        </div>
      </div>
    </main>
  )
}
