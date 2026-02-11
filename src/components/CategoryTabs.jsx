import { useState } from 'react';

function CategoryTabs({ tabs }) {
  const [active, setActive] = useState(() => tabs[0]?.id ?? null);
  if (!tabs.length) {
    return null;
  }

  const activeId = tabs.some((tab) => tab.id === active) ? active : tabs[0].id;

  return (
    <div className="tabs">
      <div className="tabbar" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className="tabbtn"
            type="button"
            role="tab"
            data-tab={tab.id}
            aria-selected={activeId === tab.id ? 'true' : 'false'}
            onClick={() => setActive(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="tabpanels">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`tabpanel${activeId === tab.id ? ' is-active' : ''}`}
            data-panel={tab.id}
          >
            <p>{typeof tab.content === 'function' ? tab.content() : tab.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default CategoryTabs;
