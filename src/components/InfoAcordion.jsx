import { useState } from 'react';

function InfoAccordion({ app, category }) {
  const [openId, setOpenId] = useState(null);
  const tabs = app.catalog.getCategoryInfoTabs(category);

  return (
    <div className="accordion">
      {tabs.map((tab) => {
        const expanded = openId === tab.id;
        return (
          <div className="accordion-item" key={tab.id}>
            <button
              className="accordion-header"
              type="button"
              data-accordion={tab.id}
              aria-expanded={expanded ? 'true' : 'false'}
              onClick={() => setOpenId(expanded ? null : tab.id)}
            >
              <span>{tab.label}</span>
              <span className="accordion-icon" aria-hidden="true" />
            </button>
            <div
              className="accordion-panel"
              data-panel={tab.id}
              style={{ maxHeight: expanded ? '220px' : '0px' }}
            >
              <div className="accordion-panel-inner">
                <p>{tab.content}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default InfoAccordion;
