import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white">
      <nav className="container mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center font-bold text-sm">AI</div>
          <span className="font-semibold text-lg">ReviewPro</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-slate-300 hover:text-white transition-colors">Sign in</Link>
          <Link href="/register" className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            Get started free
          </Link>
        </div>
      </nav>

      <main className="container mx-auto px-6 py-24 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-900/40 border border-blue-700/50 rounded-full px-4 py-1.5 text-sm text-blue-300 mb-8">
          <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></span>
          AI-powered review management
        </div>

        <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
          Reply to every review<br />
          <span className="text-blue-400">in seconds, not hours</span>
        </h1>

        <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto">
          AI Review Response Manager generates unique, professional replies to Google reviews — with built-in risk detection for high-ticket service businesses.
        </p>

        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link href="/register" className="bg-blue-600 hover:bg-blue-700 px-8 py-3.5 rounded-xl text-lg font-semibold transition-colors">
            Start free trial
          </Link>
          <Link href="/login" className="border border-slate-600 hover:border-slate-500 px-8 py-3.5 rounded-xl text-lg font-medium transition-colors">
            Sign in
          </Link>
        </div>

        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {[
            {
              icon: '⚡',
              title: 'AI Draft Generation',
              desc: 'Unique responses in seconds using GPT-4o-mini. No templates — every reply sounds human.',
            },
            {
              icon: '🛡️',
              title: 'Risk Detection',
              desc: 'Automatically flags reviews mentioning legal threats and activates Safe Mode to protect your business.',
            },
            {
              icon: '📊',
              title: 'Response Dashboard',
              desc: 'Track response rate, urgent reviews older than 48h, and monthly review volume at a glance.',
            },
          ].map((feature) => (
            <div key={feature.title} className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 text-left">
              <div className="text-3xl mb-3">{feature.icon}</div>
              <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
