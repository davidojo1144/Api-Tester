export default function Header() {
  return (
    <div className="flex items-center gap-3.5 mb-8">
      <div className="w-[42px] h-[42px] bg-gradient-to-br from-accent to-purple-500 rounded-[10px] flex items-center justify-center text-xl shadow-[0_4px_20px_var(--color-accent-glow)]">
        ⚡
      </div>
      <div>
        <h1 className="text-[22px] font-bold bg-gradient-to-br from-text-primary to-accent bg-clip-text text-transparent">
          API Tester
        </h1>
        <p className="text-[13px] text-text-secondary">Test your endpoints with ease</p>
      </div>
    </div>
  )
}
