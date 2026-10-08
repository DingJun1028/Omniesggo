export default function HtbResearchGrid() {
  const items = [
    { title: '海洋牧場', desc: '多營養層級養殖，提升碳匯與生態平衡。' },
    { title: 'dMRV 平台', desc: '數位監控與驗證，讓減碳數據可追溯。' },
    { title: '畜牧碳資產', desc: '酪農減排追蹤與碳權資產化。' },
    { title: '國際標準鏈結', desc: '產官學合作，強化減碳可信度。' },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {items.map((item) => (
        <div key={item.title} className="bg-white border border-gray-200 rounded-2xl p-3">
          <div className="text-sm font-bold text-htb-charcoal">{item.title}</div>
          <p className="mt-2 text-xs text-gray-600 leading-relaxed">{item.desc}</p>
        </div>
      ))}
    </div>
  );
}
