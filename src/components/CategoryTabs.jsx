import { useEffect, useState } from 'react';

function CategoryTabs({ tabs }) {
  const [active, setActive] = useState(tabs[0]?.id ?? null);

  useEffect(() => {
    setActive(tabs[0]?.id ?? null);
  }, [tabs]);

  if (!tabs.length) {
    return null;
  }

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
            aria-selected={active === tab.id ? 'true' : 'false'}
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
            className={`tabpanel${active === tab.id ? ' is-active' : ''}`}
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
