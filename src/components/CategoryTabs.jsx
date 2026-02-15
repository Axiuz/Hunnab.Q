import { useEffect, useState } from 'react';

/** Renderiza tabs de categoria y controla cual panel esta activo. */
function CategoryTabs({ tabs }) {
  const hasRouteTabs = tabs.length > 0 && tabs.every((tab) => Boolean(tab.route));

  // Estado local
  const [active, setActive] = useState(tabs[0]?.id ?? null);

  // Sincronizacion cuando cambian los tabs
  useEffect(() => {
    setActive(tabs[0]?.id ?? null);
  }, [tabs]);

  // Estado vacio
  if (!tabs.length) {
    return null;
  }

  // Render
  return (
    <div className="tabs">
      <div className="tabbar" role="tablist">
        {tabs.map((tab) =>
          tab.route ? (
            <a key={tab.id} className="tabbtn" href={tab.route}>
              {tab.label}
            </a>
          ) : (
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
          )
        )}
      </div>
      {!hasRouteTabs && (
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
      )}
    </div>
  );
}

export default CategoryTabs;
