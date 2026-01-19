    // Datos de paginas del menu
     
    const CATEGORIES = {
      "collares": {
        title: "Collares",
        desc: "Diseños artesanales creados con dedicación, pensados para expresar tu esencia y dar un toque único a cada look.",
        heroImg: "imagenes/Collar_Nautilus.jpeg",
        heroImgHover: "imagenes/Collar_Nautilus_Negro.jpeg",
        products: ["gargantilla-luna", "gargantilla-perla", "gargantilla-minimal"],
        tabs: [
          { id:"caballero", label:"Para Caballero", html:()=>"<p>Accesorios con carácter y diseño moderno, ideales para un estilo auténtico y sofisticado.</p>" },
          { id:"dama", label:"Para Dama", html:()=>"<p>Diseños delicados que realzan tu estilo y aportan un toque de elegancia a cada ocasión.</p>"}
        ]
      },
      "aretes": {
        title: "Aretes",
        desc: "Aretes elegantes y versátiles para cualquier ocasión.",
        heroImg: "imagenes/Anillo_Muestra.jpeg",
        heroImgHover: "imagenes/Anillo_Modelo.jpeg",
        products: ["arracadas-clasicas", "arracadas-chunky"]
      },
      "collares/caballero": {
        title: "Collares Caballero",
        desc: "Collares cortos ideales para lucir solos o combinar en capas, aportando estilo y versatilidad a cualquier look.",
        heroImg: "imagenes/Collar_Nautilus.jpeg",
        heroImgHover: "imagenes/Collar_Nautilus_Negro.jpeg",
        products: ["gargantilla-luna", "gargantilla-perla", "gargantilla-minimal"]
        
      },
      "collares/dama": {
        title: "Collares Dama",
        desc: "Collares cortos para dama, ideales para lucir solos o en capas, realzando tu estilo con delicadeza y versatilidad.",
        heroImg: "imagenes/Anillo_Muestra.jpeg",
        heroImgHover: "imagenes/Anillo_Modelo.jpeg",
        products: ["corbatin-satin", "corbatin-oro"]
      },
      "aretes/arracadas": {
        title: "Anillos",
        desc: "Anillos clásicos y modernos para cualquier ocasión.",
        heroImg: "imagenes/Anillo_Muestra.jpeg",
        heroImgHover: "imagenes/Anillo_Modelo.jpeg",
        products: ["arracadas-clasicas", "arracadas-chunky"]
      },
      "anillos": {
        title: "Anillos",
        desc: "Anillos clásicos y modernos para cualquier ocasión.",
        heroImg: "imagenes/Anillo_Modelo.jpeg",
        heroImgHover: "imagenes/Anillo_Muestra.jpeg",
        products: ["anillo-modelo", "anillo-muestra"]
      },
      "pulseras": {
        title: "Pulseras",
        desc: "Piezas cuidadosamente elaboradas que combinan diseño y detalle para acompañarte en cada momento.",
        heroImg: "imagenes/Pulsera_Volcanica.png",
        heroImgHover: "imagenes/Pulseras_Onyx.png",
        products: ["pulsera-nudo", "pulsera-bicolor"],
        tabs: [
          { id:"caballero", label:"Para Caballero", html:()=>"<p>Pulseras con estilo sobrio y materiales resistentes.</p>" },
          { id:"dama", label:"Para Dama", html:()=>"<p>Pulseras delicadas y versátiles para cualquier ocasión.</p>" }
        ]
      },
      "pulseras/caballero": {
        title: "Pulseras Para Caballero",
        desc: "Pulseras con estilo sobrio y materiales resistentes.",
        heroImg: "imagenes/Pulsera_Volcanica.png",
        heroImgHover: "imagenes/Pulseras_Onyx.png",
        products: ["pulsera-nudo"]
      },
      "pulseras/dama": {
        title: "Pulseras Para Dama",
        desc: "Pulseras delicadas y versátiles para cualquier ocasión.",
        heroImg: "imagenes/Pulseras_Onyx.png",
        heroImgHover: "imagenes/Pulsera_Volcanica.png",
        products: ["pulsera-bicolor"]
      },
      
    };

    // Datos de productos
  
    const PRODUCTS = {
      // Ejemplos para que el “Ver gargantillas” muestre un grid
      "gargantilla-luna":  { title:"Collar Aquamarina",  price: 250.00, img:"imagenes/Collar_Aquamarina.jpeg", imgHover:"imagenes/Collar_Aquamarina_Negro.jpeg" },
      "gargantilla-perla": { title:"Collar Nautilus", price: 270.00, img:"imagenes/Collar_Nautilus.jpeg", imgHover:"imagenes/Collar_Nautilus_Negro.jpeg" },
      "gargantilla-minimal":{ title:"Collar Libelula",price: 170.00, img:"imagenes/Collar_Libelula.jpeg", imgHover:"imagenes/2.jpeg" },
      "corbatin-satin":    { title:"Collar Amatista",    price: 280.00, img:"imagenes/Collar_Amatista.jpeg" },
      "corbatin-oro":      { title:"Collar Oro",      price: 310.00, img:"imagenes/Collar_Arbolvida.jpeg" },
      "arracadas-clasicas":{ title:"Arracadas Clásicas",price: 260.00, img:"images/arra-1.jpg" },
      "arracadas-chunky":  { title:"Arracadas Chunky",  price: 320.00, img:"images/arra-2.jpg" },
      "anillo-modelo":     { title:"Anillo Modelo",     price: 290.00, img:"imagenes/Anillo_Modelo.jpeg" },
      "anillo-muestra":    { title:"Anillo Muestra",    price: 260.00, img:"imagenes/Anillo_Muestra.jpeg" },
      "pulsera-nudo":      { title:"Pulsera Piedra Volcanica",      price: 180.00, img:"imagenes/Pulsera_Volcanica.png" },
      "pulsera-bicolor":   { title:"Pulsera Onyx",   price: 210.00, img:"imagenes/Pulseras_Onyx.png" }
    };

    // App y router
    const app = document.getElementById("app");

    // Formatea precio en MXN
    function money(n){
      return n.toLocaleString("es-MX",{ style:"currency", currency:"MXN" });
    }

    // Tabs default para categorías (se aplican si la categoría no define tabs)
    const DEFAULT_CATEGORY_TABS = [
      { id:"descripcion", label:"Descripción", html:(c)=>`<p>${c.desc}</p>` },
      { id:"materiales", label:"Materiales", html:()=>`<p>Materiales de la colección (edita aquí).</p>` },
      { id:"cuidados", label:"Cuidados", html:()=>`<ul><li>Evita perfumes/químicos.</li><li>Guarda por separado.</li><li>Limpia con paño suave.</li></ul>` },
      
    ];

    // Colores por defecto
    const DEFAULT_PRODUCT_COLORS = [
      { name:"Negro", value:"#111111" },
      { name:"Dorado", value:"#d4af37" },
      { name:"Plateado", value:"#bfc7d5" },
      { name:"Rosa", value:"#e7a9b7" }
    ];

// Renderiza tabs (HTML)
function renderTabsHTML(items, getHtmlFn){
  if(!items || items.length === 0) return "";
  return `
    <div class="tabs">
      <div class="tabbar" role="tablist">
        ${items.map((item, idx)=>`
          <button
            class="tabbtn"
            type="button"
            data-tab="${item.id}"
            aria-selected="${idx === 0 ? "true" : "false"}"
          >${item.label}</button>
        `).join("")}
      </div>
      <div class="tabpanels">
        ${items.map((item, idx)=>`
          <div class="tabpanel${idx === 0 ? " is-active" : ""}" data-panel="${item.id}">
            ${getHtmlFn(item)}
          </div>
        `).join("")}
      </div>
    </div>
  `;
}

// Activa los tabs al hacer click
function wireTabs(container){
  container.querySelectorAll(".tabs").forEach((root)=>{
    const tabbar = root.querySelector(".tabbar");
    if(!tabbar) return;

    tabbar.addEventListener("click", (e)=>{
      const btn = e.target.closest(".tabbtn");
      if(!btn) return;

      const id = btn.dataset.tab;
      root.querySelectorAll(".tabbtn")
        .forEach(b=>b.setAttribute("aria-selected","false"));
      root.querySelectorAll(".tabpanel")
        .forEach(p=>p.classList.remove("is-active"));

      btn.setAttribute("aria-selected","true");
      const panel = root.querySelector(`.tabpanel[data-panel="${id}"]`);
      if(panel) panel.classList.add("is-active");
    });
  });
}

// Renderiza acordeon (HTML)
function renderAccordionHTML(items, getHtmlFn){
  return `
    <div class="accordion">
      ${items.map(item=>`
        <div class="accordion-item">
          <button
            class="accordion-header"
            type="button"
            data-accordion="${item.id}"
            aria-expanded="false"
          >
            <span>${item.label}</span>
            <span class="accordion-icon" aria-hidden="true"></span>
          </button>

          <div class="accordion-panel" data-panel="${item.id}">
            <div class="accordion-panel-inner">
              ${getHtmlFn(item)}
            </div>
          </div>
        </div>
      `).join("")}
    </div>
  `;
}

    // Activa el acordeon dentro del contenedor
function wireAccordion(container){
  const accordion = container.querySelector(".accordion");
  if(!accordion) return;

  accordion.addEventListener("click", (e)=>{
    const header = e.target.closest("[data-accordion]");
    if(!header) return;

    const id = header.dataset.accordion;
    const panel = accordion.querySelector(`[data-panel="${id}"]`);
    if(!panel) return;

    const expanded = header.getAttribute("aria-expanded") === "true";

    header.setAttribute("aria-expanded", String(!expanded));

    if(!expanded){
      panel.style.maxHeight = panel.scrollHeight + "px";
    }else{
      panel.style.maxHeight = "0px";
    }
  });

  /* Ajuste automático al cargar (por si hay contenido dinámico) */
  accordion.querySelectorAll(".accordion-header[aria-expanded='true']")
    .forEach(header=>{
      const panel = accordion.querySelector(
        `[data-panel="${header.dataset.accordion}"]`
      );
      if(panel) panel.style.maxHeight = panel.scrollHeight + "px";
    });
}

    // Renderiza la pagina de inicio
    function renderHome(){
      app.innerHTML = `
        <div class="hero">
          <h1>Inicio</h1>
          <p>Haz clic en el menú: por ejemplo <strong>Collares → Ver Gargantillas</strong> y se cargará su página.</p>
        </div>
        <div class="grid">
          ${["collares","aretes","pulseras","anillos"].map(key=>{
            const c = CATEGORIES[key];
            if(!c) return "";
            return `
              <a class="card" href="#/${key}">
                <div class="img-swap">
                 <img class="base" src="${c.heroImg}" alt="${c.title}">
                   <img class="hover" src="${c.heroImgHover || c.heroImg}" alt="${c.title}">
                    </div>
                <div class="card__body">
                  <strong>${c.title}</strong>
                  <span>${c.desc}</span>
                </div>
              </a>
            `;
          }).join("")}
        </div>
      `;
    }
    
    //render de quienes somos
    // Renderiza la pagina de "Quienes Somos"
    function renderAbout(){
      app.innerHTML = `
        <div class="hero">
          <h1>Quienes Somos</h1>
          <p>Desde 2019, Hunnab.Q nace como un proyecto artesanal que cree en el valor de
            crear con las manos y en comunidad. Diseñan piezas de cerámica, joyería y
            accesorios utilizando técnicas como el alambrismo, la pintura y diversos tejidos,
            integrando cuarzos naturales y piezas pintadas a mano.</p>
        </div>
        <div class="hero" style="margin-top:16px">
          <h2 style="margin:0 0 8px">Valores de la Empresa</h2>
          <div class="simple-carousel" data-simple-carousel>
            <button class="simple-nav simple-prev" type="button" aria-label="Anterior">‹</button>
            <div class="simple-track">
              <div class="simple-slide">
                <div>
                  <strong>Misión</strong>
                  <p style="margin:6px 0 0;color:var(--muted)">Crear piezas artesanales únicas que conecten con la esencia, la creatividad y el valor de lo hecho con intención.
                    Compartimos conocimiento accesible que impulse a emprender de forma consciente y creativa.</p>
                </div>
              </div>
              <div class="simple-slide">
                <div>
                  <strong>Visión</strong>
                  <p style="margin:6px 0 0;color:var(--muted)">Inspirar una comunidad creativa que valore lo hecho a mano y encuentre en la artesanía y el aprendizaje una herramienta real para transformar su vida.</p>
                </div>
              </div>
              <div class="simple-slide">
                <div>
                  <strong>Valores</strong>
                  <p style="margin:6px 0 0;color:var(--muted)">• Artesanía consciente
                  • Creatividad con propósito
                  • Accesibilidad
                  • Autenticidad
                  • Comunidad y colaboración
                  • Empoderamiento</p>
                </div>
              </div>
            </div>
            <button class="simple-nav simple-next" type="button" aria-label="Siguiente">›</button>
          </div>
        </div>
      `;
      wireSimpleCarousel(app.querySelector("[data-simple-carousel]"));
    }

    // Activa controles del carrusel simple
    function wireSimpleCarousel(root){
      if(!root) return;
      const track = root.querySelector(".simple-track");
      const prevBtn = root.querySelector(".simple-prev");
      const nextBtn = root.querySelector(".simple-next");
      const slides = track ? Array.from(track.children) : [];
      let index = 0;

      // Calcula el ancho de cada slide
      function getSlideWidth(){
        if(!track || slides.length === 0) return 0;
        const styles = getComputedStyle(track);
        const gap = parseFloat(styles.gap || "0");
        return slides[0].getBoundingClientRect().width + gap;
      }

      // Mueve el carrusel al indice indicado
      function go(nextIndex){
        const w = getSlideWidth();
        if(!w) return;
        index = (nextIndex + slides.length) % slides.length;
        track.scrollTo({ left: w * index, behavior: "smooth" });
      }

      prevBtn?.addEventListener("click", ()=> go(index - 1));
      nextBtn?.addEventListener("click", ()=> go(index + 1));
    }

    // Renderiza una categoria y su grid
    function renderCategory(key){
      const c = CATEGORIES[key];
      if(!c){ renderNotFound(); return; }

      const personaTabs = c.tabs?.length ? c.tabs : [];
      const infoTabs = DEFAULT_CATEGORY_TABS;
      const showInfoAccordion = key !== "collares" && key !== "pulseras";

      app.innerHTML = `
        <div class="crumb">Inicio / ${c.title}</div>

        <div class="hero" style="display:grid;grid-template-columns:1fr .9fr;gap:14px;align-items:center">
          <div>
            <h1 style="margin:0 0 6px">${c.title}</h1>
            <p style="margin:0;color:var(--muted)">${c.desc}</p>

            <!-- Tabs de categoria (Caballero / Dama) -->
            ${personaTabs.length ? renderTabsHTML(personaTabs, (t)=>{
              if(typeof t.html === "function") return t.html(c);
              return t.html || "";
            }) : ""}

            <!-- Acordeon de info -->
            ${showInfoAccordion ? renderAccordionHTML(infoTabs, (t)=>{
              if(typeof t.html === "function") return t.html(c);
              return t.html || "";
            }) : ""}

          </div>

          <div class="shot big" style="margin:0">
            <img src="${c.heroImg}" alt="${c.title}">
          </div>
        </div>

        <div class="grid">
          ${c.products.map(pid=>{
            const p = PRODUCTS[pid];
            if(!p) return "";
            const img = p.img || (p.images ? p.images[0] : "images/placeholder.jpg");
            const price = p.price ?? 0;
            return `
                <a class="card" href="#/p/${pid}">
                <div class="img-swap">
                <img class="base" src="${img}" alt="${p.title}">
                <img class="hover" src="${p.imgHover || img}" alt="${p.title}">
                </div>
                
                  <div class="card__body">
                  <strong>${p.title}</strong>
                  <span>${money(price)}</span>
                </div>
              </a>
            `;
          }).join("")}
        </div>
      `;

      wireTabs(app);
      wireAccordion(app);

    }

    // Renderiza la vista de producto
    function renderProduct(pid){
      const p = PRODUCTS[pid];
      if(!p){ renderNotFound(); return; }
      const images = (p.images && p.images.length ? p.images : [p.img, p.imgHover]).filter(Boolean);
      if(images.length === 0){ renderNotFound(); return; }
      const tabs = p.tabs || [];
      const bullets = p.bullets || [];
      const hasStock = typeof p.inStock === "boolean";
      const priceText = p.price != null ? money(p.price) : "";
      const kickerHTML = p.kicker ? `<div class="kicker">${p.kicker}</div>` : "";
      const priceHTML = priceText ? `<div class="price">${priceText}</div>` : "";
      const stockHTML = hasStock ? `
            <div class="stock">
              <span class="dot"></span>
              <span>${p.inStock ? "El artículo está en stock" : "Agotado"}</span>
            </div>` : "";
      const descHTML = p.shortDesc ? `<div class="desc">${p.shortDesc}</div>` : "";
      const bulletsHTML = bullets.length ? `
            <div class="bullets">
              ${bullets.map(b=>`
                <div><strong>${b.icon}</strong><span>${b.text}</span></div>
              `).join("")}
            </div>` : "";
      const tabsHTML = tabs.length ? `
            <div class="tabs">
              <div class="tabbar" id="tabbar"></div>
              <div id="tabpanels"></div>
            </div>` : "";

      app.innerHTML = `
        <div class="crumb">Inicio / ${p.kicker || "Producto"} / ${p.title}</div>

        <div class="product">
          <!-- Gallery -->
          <div class="gallery">
            ${images.slice(0,4).map((src, i)=>`
              <div class="shot ${i < 2 ? "big" : ""}">
                <img src="${src}" alt="${p.title} ${i+1}">
              </div>
            `).join("")}
          </div>

          <!-- Side info -->
          <aside class="side">
            ${kickerHTML}
            <h2 style="margin:6px 0 6px;font-size:22px">${p.title}</h2>
            ${priceHTML}
            ${stockHTML}

            <div class="opt">
              <label>Color</label>
              <div class="swatches" id="swatches"></div>
            </div>

            <div class="opt">
              <label>Cantidad</label>
              <div class="qty">
                <button type="button" id="minus">−</button>
                <input id="qty" value="1" inputmode="numeric" />
                <button type="button" id="plus">+</button>
              </div>
            </div>

            <button class="btn primary" id="addCart">AÑADIR AL CARRITO • ${money(p.price)}</button>
            <button class="btn alt" type="button">Comprar con Pay</button>
            <button class="btn link" type="button">Más opciones de pago</button>

            ${descHTML}
            ${bulletsHTML}
            ${tabsHTML}
          </aside>
        </div>
      `;

      // swatches
      const sw = document.getElementById("swatches");
      const colors = (p.colors && p.colors.length) ? p.colors : DEFAULT_PRODUCT_COLORS;
      let selectedColor = 0;

      colors.forEach((c, idx)=>{
        const el = document.createElement("button");
        el.className = "swatch";
        el.type = "button";
        el.title = c.name;
        el.style.background = c.value;
        el.setAttribute("role","radio");
        el.setAttribute("aria-checked", idx === 0 ? "true" : "false");
        el.addEventListener("click", ()=>{
          selectedColor = idx;
          [...sw.children].forEach(ch=>ch.setAttribute("aria-checked","false"));
          el.setAttribute("aria-checked","true");
        });
        sw.appendChild(el);
      });

      // qty
      const qtyEl = document.getElementById("qty");
      const clampQty = ()=>{
        let v = parseInt(qtyEl.value || "1", 10);
        if(Number.isNaN(v) || v < 1) v = 1;
        if(v > 99) v = 99;
        qtyEl.value = String(v);
      };
      document.getElementById("minus").addEventListener("click", ()=>{ qtyEl.value = String((parseInt(qtyEl.value||"1",10)||1)-1); clampQty(); });
      document.getElementById("plus").addEventListener("click", ()=>{ qtyEl.value = String((parseInt(qtyEl.value||"1",10)||1)+1); clampQty(); });
      qtyEl.addEventListener("input", clampQty);

      // tabs
      if(tabs.length){
        const tabbar = document.getElementById("tabbar");
        const panels = document.getElementById("tabpanels");

        tabs.forEach((t, idx)=>{
          const b = document.createElement("button");
          b.className = "tabbtn";
          b.type = "button";
          b.textContent = t.label;
          b.setAttribute("aria-selected", idx === 0 ? "true" : "false");

          const panel = document.createElement("div");
          panel.className = "tabpanel" + (idx === 0 ? " is-active" : "");
          panel.innerHTML = t.html;

          b.addEventListener("click", ()=>{
            [...tabbar.children].forEach(x=>x.setAttribute("aria-selected","false"));
            [...panels.children].forEach(x=>x.classList.remove("is-active"));
            b.setAttribute("aria-selected","true");
            panel.classList.add("is-active");
          });

          tabbar.appendChild(b);
          panels.appendChild(panel);
        });
      }

      // Demo de carrito
      document.getElementById("addCart").addEventListener("click", ()=>{
        clampQty();
        alert(`Añadido: ${p.title}\nColor: ${(colors[selectedColor]?.name)||"—"}\nCantidad: ${qtyEl.value}`);
      });
    }

    // Renderiza la vista de no encontrado
    function renderNotFound(){
      app.innerHTML = `
        <div class="hero">
          <h1>No encontrado</h1>
          <p>La ruta no existe. Prueba volver al <a href="#/" style="text-decoration:underline">inicio</a>.</p>
        </div>
      `;
    }

    // Enruta segun el hash actual
    function router(){
      const hash = (location.hash || "#/").replace("#/","");
      if(hash === "" || hash === "/"){ renderHome(); return; }
      if(hash === "quienes-somos"){ renderAbout(); return; }

      // product route: p/<id>
      if(hash.startsWith("p/")){
        const pid = hash.slice(2);
        renderProduct(pid);
        return;
      }

      // category route
      renderCategory(hash);
    }

    // Menu movil y buscador
    const body = document.body;
    const openMenu = document.getElementById("openMenu");
    const closeMenu = document.getElementById("closeMenu");
    const backdrop = document.getElementById("backdrop");
    const drawer = document.getElementById("drawer");
    const openSearch = document.getElementById("openSearch");
    const searchOverlay = document.getElementById("searchOverlay");
    const searchPanel = document.getElementById("searchPanel");
    const searchInput = document.getElementById("searchInput");
    const searchResults = document.getElementById("searchResults");

    // Abre o cierra el menu movil
    function setDrawer(open){
      body.classList.toggle("is-open", open);
      backdrop.setAttribute("aria-hidden", String(!open));
    }
    // Abre o cierra el buscador
    function setSearch(open){
      body.classList.toggle("is-search-open", open);
      searchOverlay.setAttribute("aria-hidden", String(!open));
      if(open){
        searchInput.value = "";
        renderSearchResults("");
        searchInput.focus();
      }
    }
    const SEARCH_ITEMS = [
      { label:"Inicio", route:"#/" },
      { label:"Anillos", route:"#/anillos" },
      { label:"Quienes Somos", route:"#/quienes-somos" },
      ...Object.keys(CATEGORIES).map((key)=>({
        label: CATEGORIES[key].title,
        route: `#/${key}`
      }))
    ];
    // Muestra resultados del buscador
    function renderSearchResults(query){
      const q = query.trim().toLowerCase();
      const results = q
        ? SEARCH_ITEMS.filter(item=>item.label.toLowerCase().includes(q))
        : SEARCH_ITEMS;
      if(results.length === 0){
        searchResults.innerHTML = `<div class="search-empty">Sin resultados</div>`;
        return;
      }
      searchResults.innerHTML = results.map(item=>`
        <a href="${item.route}">
          <span>${item.label}</span>
          <span class="tag">ir</span>
        </a>
      `).join("");
    }
    openMenu.addEventListener("click", ()=> setDrawer(true));
    closeMenu.addEventListener("click", ()=> setDrawer(false));
    backdrop.addEventListener("click", ()=> setDrawer(false));
    window.addEventListener("keydown", (e)=>{ if(e.key==="Escape") setDrawer(false); });
    openSearch.addEventListener("click", ()=> setSearch(true));
    searchOverlay.addEventListener("click", ()=> setSearch(false));
    window.addEventListener("keydown", (e)=>{ if(e.key==="Escape") setSearch(false); });
    searchInput.addEventListener("input", (e)=> renderSearchResults(e.target.value));
    searchPanel.addEventListener("click", (e)=>{
      const link = e.target.closest("a");
      if(link && link.getAttribute("href")?.startsWith("#/")){
        setSearch(false);
      }
    });

    document.querySelectorAll("[data-toggle='mobile']").forEach(btn=>{
      btn.addEventListener("click", ()=>{
        const sec = btn.closest(".m-sec");
        sec.dataset.open = sec.dataset.open === "true" ? "false" : "true";
      });
    });

    // Close drawer when clicking any link inside it
    drawer.addEventListener("click", (e)=>{
      const a = e.target.closest("a");
      if(a && a.getAttribute("href")?.startsWith("#/")){
        setDrawer(false);
      }
    });
    window.addEventListener("hashchange", router);
    router();
document.addEventListener("click", (e) => {
  const card = e.target.closest(".card");
  if(!card) return;

  const hoverImg = card.querySelector(".img-swap img.hover");
  const baseImg  = card.querySelector(".img-swap img.base");
  if(!hoverImg || !baseImg) return;
  card.classList.toggle("is-hover");
});
  // Autoplay carrusel
  const track = document.getElementById("carouselTrack");
  let index = 0;

  // Calcula el ancho del slide del carrusel principal
  function getSlideWidth(){
    if(!track) return 0;
    const slide = track.querySelector(".carousel__slide");
    if(!slide) return 0;
    const styles = getComputedStyle(track);
    const gap = parseFloat(styles.gap || "0");
    return slide.getBoundingClientRect().width + gap;
  }

  // Avanza el carrusel principal automaticamente
  function autoplay(){
    const slideWidth = getSlideWidth();
    if(!slideWidth) return;

    index = (index + 1) % track.children.length;
    track.scrollTo({ left: slideWidth * index, behavior: "smooth" });
  }

  if(track){
    setInterval(autoplay, 3000);
  }
