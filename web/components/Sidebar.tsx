const sections = [
  { id: 'overview', label: 'Overview' },
  { id: 'participation', label: 'Participation' },
  { id: 'timeline', label: 'Timeline' },
  { id: 'conflicts', label: 'Conflicts' },
  { id: 'heatmap', label: 'Heatmap' },
  { id: 'wordcloud', label: 'Word Cloud' },
  { id: 'extras', label: 'Extras' }
];

export default function Sidebar() {
  return (
    <nav className="hidden md:block w-56 bg-white/5 border-r border-white/10 p-4">
      <ul className="space-y-2 text-sm">
        {sections.map((s) => (
          <li key={s.id}>
            <a href={`#${s.id}`} className="block px-3 py-2 rounded hover:bg-white/10">
              {s.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
