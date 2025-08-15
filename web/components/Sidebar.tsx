const sections = [
  { id: 'overview', label: 'Overview' },
  { id: 'participation', label: 'Participation' },
  { id: 'timeline', label: 'Timeline' },
  { id: 'conflicts', label: 'Conflicts' },
  { id: 'heatmap', label: 'Heatmap' },
  { id: 'daily', label: 'Daily Themes' },
  { id: 'wordcloud', label: 'Word Cloud' },
  { id: 'extras', label: 'Extras' }
];

export default function Sidebar() {
  return (
    <nav className="hidden md:block w-56 bg-sub-alt border-r border-sub p-4 text-text">
      <ul className="space-y-2 text-sm">
        {sections.map((s) => (
          <li key={s.id}>
            <a href={`#${s.id}`} className="block px-3 py-2 rounded hover:bg-sub">
              {s.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
