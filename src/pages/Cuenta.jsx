import { useEffect, useMemo, useState } from 'react';

const REGEX_PASSWORD = /^(?=.*[!@#$%^&*])[A-Za-z0-9!@#$%^&*]{6,10}$/;
const PAYMENT_METHOD_TYPES = ['Tarjeta de credito', 'Tarjeta de debito', 'PayPal', 'Transferencia'];
const EMPTY_ACCOUNT_FORM = {
  nombre: '',
  correo: '',
  direccionEnvio: '',
};
const EMPTY_PAYMENT_METHOD_FORM = {
  type: PAYMENT_METHOD_TYPES[0],
  alias: '',
  holder: '',
  last4: '',
  expiry: '',
};

/**
 * Vista de cuenta:
 * - Login y registro contra API
 * - Sesion activa
 * - Resumen de pedidos del usuario
 * - Panel admin para CRUD visual de productos
 */
function AccountPage({ app }) {
  const auth = useMemo(() => app?.auth ?? null, [app]);

  // Estado de autenticacion y formulario.
  const [modoRegistro, setModoRegistro] = useState(false);
  const [mostrarPass, setMostrarPass] = useState(false);
  const [form, setForm] = useState({
    nombre: '',
    correo: '',
    usuario: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [usuarioActivo, setUsuarioActivo] = useState(() => auth?.getSessionUser() ?? null);
  const [cuentaTab, setCuentaTab] = useState('pedidos');
  const [accountForm, setAccountForm] = useState(EMPTY_ACCOUNT_FORM);
  const [paymentMethodForm, setPaymentMethodForm] = useState(EMPTY_PAYMENT_METHOD_FORM);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [accountError, setAccountError] = useState('');
  const [accountSuccess, setAccountSuccess] = useState('');

  // Estado exclusivo del panel super usuario.
  const [, setAdminRefreshKey] = useState(0);
  const [adminError, setAdminError] = useState('');
  const [adminSuccess, setAdminSuccess] = useState('');
  const [createProductForm, setCreateProductForm] = useState({
    title: '',
    price: '',
    img: '',
    imgHover: '',
    categoryKey: 'collares',
  });
  const [editDrafts, setEditDrafts] = useState({});

  // Handlers de formulario (login/registro).
  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
    if (error) {
      setError('');
    }
  };

  const cambiarModo = () => {
    setModoRegistro((prev) => !prev);
    setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      if (modoRegistro) {
        if (!REGEX_PASSWORD.test(form.password)) {
          setError(
            'La contrasena debe tener entre 6 y 10 caracteres, incluir al menos un signo especial (!@#$%^&*) y solo puede contener letras (sin enie ni acentos), numeros y esos signos.'
          );
          return;
        }

        const result = await auth.register(form);
        if (!result.ok) {
          setError(result.error);
          return;
        }
        setError('');
        setModoRegistro(false);
        setForm((prev) => ({ ...prev, nombre: '', correo: '', password: '' }));
        return;
      }

      const result = await auth.login(form);
      if (!result.ok) {
        setError(result.error);
        return;
      }

      setError('');
      setUsuarioActivo(result.user);
      setCuentaTab('pedidos');
      setForm({ nombre: '', correo: '', usuario: '', password: '' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const cerrarSesion = () => {
    auth.logout();
    setUsuarioActivo(null);
    setModoRegistro(false);
    setMostrarPass(false);
    setError('');
    setAdminError('');
    setAdminSuccess('');
    setEditDrafts({});
    setCuentaTab('pedidos');
    setAccountForm(EMPTY_ACCOUNT_FORM);
    setPaymentMethodForm(EMPTY_PAYMENT_METHOD_FORM);
    setPaymentMethods([]);
    setAccountError('');
    setAccountSuccess('');
    setForm({ nombre: '', correo: '', usuario: '', password: '' });
  };

  // Datos derivados para renderizado.
  const nombreUsuario = (usuarioActivo?.nombre || usuarioActivo?.usuario || '').trim();
  const pedidosUsuario = usuarioActivo ? app.orders?.getUserOrders?.(usuarioActivo) ?? [] : [];
  const normalizedRole = String(usuarioActivo?.tipoUsuario || usuarioActivo?.tipo_usuario || '')
    .trim()
    .toUpperCase();
  const isSuperUser = normalizedRole === 'ADMIN' || normalizedRole === 'ADMINISTRADOR';
  const adminProducts = isSuperUser ? app.catalog?.getAdminProducts?.() ?? [] : [];
  const adminCategoryKeys = useMemo(() => app.catalog?.getCategoryKeys?.() ?? [], [app]);

  // Utilidades de visualizacion.
  const formatOrderDate = (value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return date.toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' });
  };

  const refreshAdminPanel = () => setAdminRefreshKey((prev) => prev + 1);

  // Helpers para mensajes del panel admin.
  const clearAdminMessages = () => {
    if (adminError) {
      setAdminError('');
    }
    if (adminSuccess) {
      setAdminSuccess('');
    }
  };

  const onCreateProductFieldChange = (field) => (event) => {
    clearAdminMessages();
    setCreateProductForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  // Acciones CRUD visuales desde panel admin.
  const createProductFromAdmin = (event) => {
    event.preventDefault();
    clearAdminMessages();
    const result = app.catalog?.adminCreateProduct?.(createProductForm);
    if (!result?.ok) {
      setAdminError(result?.error || 'No se pudo crear el producto.');
      return;
    }

    setAdminSuccess(`Producto creado: ${result.id}`);
    setCreateProductForm((prev) => ({
      ...prev,
      title: '',
      price: '',
      img: '',
      imgHover: '',
    }));
    refreshAdminPanel();
  };

  const getProductDraft = (productId, product, categories) => {
    const draft = editDrafts[productId];
    return {
      title: draft?.title ?? product.title ?? '',
      price: draft?.price ?? `${product.price ?? ''}`,
      img: draft?.img ?? product.img ?? '',
      imgHover: draft?.imgHover ?? product.imgHover ?? '',
      categories: Array.isArray(draft?.categories) ? draft.categories : categories,
    };
  };

  const onProductDraftFieldChange = (productId, field, product, categories) => (event) => {
    clearAdminMessages();
    const current = getProductDraft(productId, product, categories);
    const value = field === 'price' ? event.target.value : String(event.target.value || '');
    setEditDrafts((prev) => ({
      ...prev,
      [productId]: {
        ...current,
        [field]: value,
      },
    }));
  };

  const toggleDraftCategory = (productId, categoryKey, product, categories) => {
    clearAdminMessages();
    const current = getProductDraft(productId, product, categories);
    const exists = current.categories.includes(categoryKey);
    const nextCategories = exists
      ? current.categories.filter((item) => item !== categoryKey)
      : [...current.categories, categoryKey];

    setEditDrafts((prev) => ({
      ...prev,
      [productId]: {
        ...current,
        categories: nextCategories,
      },
    }));
  };

  const saveProductChanges = (productId, product, categories) => {
    clearAdminMessages();
    const draft = getProductDraft(productId, product, categories);
    const result = app.catalog?.adminUpdateProduct?.({
      id: productId,
      title: draft.title,
      price: draft.price,
      img: draft.img,
      imgHover: draft.imgHover,
      categories: draft.categories,
    });
    if (!result?.ok) {
      setAdminError(result?.error || 'No se pudo actualizar el producto.');
      return;
    }
    setAdminSuccess('Producto actualizado.');
    setEditDrafts((prev) => {
      const next = { ...prev };
      delete next[productId];
      return next;
    });
    refreshAdminPanel();
  };

  const hideProductFromAdmin = (productId) => {
    clearAdminMessages();
    const result = app.catalog?.adminHideProduct?.(productId);
    if (!result?.ok) {
      setAdminError(result?.error || 'No se pudo ocultar el producto.');
      return;
    }
    setAdminSuccess('Producto ocultado.');
    refreshAdminPanel();
  };

  const restoreProductFromAdmin = (productId) => {
    clearAdminMessages();
    const result = app.catalog?.adminRestoreProduct?.(productId);
    if (!result?.ok) {
      setAdminError(result?.error || 'No se pudo restaurar el producto.');
      return;
    }
    setAdminSuccess('Producto restaurado.');
    refreshAdminPanel();
  };

  const clearAccountMessages = () => {
    if (accountError) {
      setAccountError('');
    }
    if (accountSuccess) {
      setAccountSuccess('');
    }
  };

  const onAccountFieldChange = (field) => (event) => {
    clearAccountMessages();
    setAccountForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const onPaymentMethodFieldChange = (field) => (event) => {
    clearAccountMessages();
    setPaymentMethodForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const saveAccountInformation = (event) => {
    event.preventDefault();
    clearAccountMessages();

    const result = auth.saveAccountSettings?.(usuarioActivo, accountForm);
    if (!result?.ok) {
      setAccountError(result?.error || 'No se pudo guardar la informacion de la cuenta.');
      return;
    }

    if (result.user) {
      setUsuarioActivo(result.user);
    }
    setAccountForm({
      nombre: result.settings?.nombre || '',
      correo: result.settings?.correo || '',
      direccionEnvio: result.settings?.direccionEnvio || '',
    });
    setAccountSuccess('Informacion de cuenta actualizada.');
  };

  const addPaymentMethod = (event) => {
    event.preventDefault();
    clearAccountMessages();

    const result = auth.addPaymentMethod?.(usuarioActivo, paymentMethodForm);
    if (!result?.ok) {
      setAccountError(result?.error || 'No se pudo agregar el metodo de pago.');
      return;
    }

    setPaymentMethods(result.paymentMethods || []);
    setPaymentMethodForm(EMPTY_PAYMENT_METHOD_FORM);
    setAccountSuccess('Metodo de pago agregado.');
  };

  const removePaymentMethod = (methodId) => {
    clearAccountMessages();
    const result = auth.removePaymentMethod?.(usuarioActivo, methodId);
    if (!result?.ok) {
      setAccountError(result?.error || 'No se pudo eliminar el metodo de pago.');
      return;
    }
    setPaymentMethods(result.paymentMethods || []);
    setAccountSuccess('Metodo de pago eliminado.');
  };

  useEffect(() => {
    if (!auth || !usuarioActivo) {
      setAccountForm(EMPTY_ACCOUNT_FORM);
      setPaymentMethods([]);
      setPaymentMethodForm(EMPTY_PAYMENT_METHOD_FORM);
      setAccountError('');
      setAccountSuccess('');
      return;
    }

    const settings = auth.getAccountSettings?.(usuarioActivo);
    setAccountForm({
      nombre: settings?.nombre || '',
      correo: settings?.correo || '',
      direccionEnvio: settings?.direccionEnvio || '',
    });
    setPaymentMethods(settings?.paymentMethods || []);
    setPaymentMethodForm(EMPTY_PAYMENT_METHOD_FORM);
    setAccountError('');
    setAccountSuccess('');
  }, [auth, usuarioActivo]);

  if (!auth) {
    return null;
  }

  // Render principal de la cuenta.
  return (
    <section className="auth-page">
      <div className={`inicio-sesion ${usuarioActivo && isSuperUser ? 'inicio-sesion--super' : ''}`}>
        <img
          className="inicio-sesion__logo"
          src="/imagenes/hunnabpng.png"
          alt="Hunnab.Q"
          width="260"
          height="80"
        />

        <h1>{usuarioActivo ? 'Bienvenida' : modoRegistro ? 'Registrarse' : 'Iniciar Sesion'}</h1>

        {!usuarioActivo && (
          <p className="inicio-sesion__switch">
            {modoRegistro ? 'Ya tienes cuenta?' : 'No tienes cuenta?'}{' '}
            <button type="button" className="link-btn" onClick={cambiarModo}>
              {modoRegistro ? 'Iniciar Sesion' : 'Registrate'}
            </button>
          </p>
        )}

        {!usuarioActivo && (
          <form className="inicio-sesion__form" onSubmit={handleSubmit}>
            {modoRegistro && (
              <>
                <label htmlFor="nombre">Nombre Completo:</label>
                <input
                  id="nombre"
                  type="text"
                  value={form.nombre}
                  onChange={handleChange('nombre')}
                  required={modoRegistro}
                />

                <label htmlFor="correo">Correo Electronico:</label>
                <input
                  id="correo"
                  type="email"
                  value={form.correo}
                  onChange={handleChange('correo')}
                  required={modoRegistro}
                />

                <p className="password-help">
                  La contrasena debe tener entre 6 y 10 caracteres, incluir al menos un signo
                  especial (!@#$%^&*) y solo puede contener letras (sin enie ni acentos),
                  numeros y esos signos.
                </p>
              </>
            )}

            <label htmlFor="usuario">Usuario:</label>
            <input
              id="usuario"
              type="text"
              value={form.usuario}
              onChange={handleChange('usuario')}
              required
            />

            <label htmlFor="password">Contrasena:</label>
            <input
              id="password"
              type={mostrarPass ? 'text' : 'password'}
              value={form.password}
              onChange={handleChange('password')}
              required
            />

            <label className="show-pass" htmlFor="mostrar-pass">
              <input
                id="mostrar-pass"
                type="checkbox"
                checked={mostrarPass}
                onChange={(event) => setMostrarPass(event.target.checked)}
              />
              Mostrar contrasena
            </label>

            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Procesando...' : modoRegistro ? 'Registrarse' : 'Iniciar Sesion'}
            </button>

            <p className={`auth-error ${error ? 'is-visible' : ''}`}>{error || ' '}</p>
          </form>
        )}

        {usuarioActivo && (
          <div className="panel-usuario">
            <h2>{`Hola ${nombreUsuario} 💛`}</h2>

            <div className="cuenta-submenu" role="tablist" aria-label="Secciones de cuenta">
              <button
                type="button"
                role="tab"
                className={`cuenta-submenu__btn ${cuentaTab === 'pedidos' ? 'is-active' : ''}`}
                aria-selected={cuentaTab === 'pedidos' ? 'true' : 'false'}
                onClick={() => setCuentaTab('pedidos')}
              >
                Mis pedidos
              </button>
              <button
                type="button"
                role="tab"
                className={`cuenta-submenu__btn ${cuentaTab === 'configuracion' ? 'is-active' : ''}`}
                aria-selected={cuentaTab === 'configuracion' ? 'true' : 'false'}
                onClick={() => setCuentaTab('configuracion')}
              >
                Editar cuenta
              </button>
            </div>

            {cuentaTab === 'pedidos' && (
              <section className="pedidos-panel" aria-label="Mis pedidos">
                <h3>Mis pedidos</h3>
                {pedidosUsuario.length === 0 ? (
                  <p className="pedidos-empty">
                    Aun no tienes pedidos. Ve al <a href="#/carrito">carrito</a> y finaliza uno.
                  </p>
                ) : (
                  <div className="pedidos-list">
                    {pedidosUsuario.map((pedido) => (
                      <article key={pedido.id} className="pedido-card">
                        <div className="pedido-card__top">
                          <strong>{pedido.id}</strong>
                          <span>{pedido.status}</span>
                        </div>
                        <p>{formatOrderDate(pedido.createdAt)}</p>
                        <p>{`Total: ${app.currency.formatMXN(pedido.total)}`}</p>
                        <p>{`Productos: ${pedido.items.length}`}</p>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            )}

            {cuentaTab === 'configuracion' && (
              <section className="cuenta-config-panel" aria-label="Editar informacion de cuenta">
                <h3>Informacion de la cuenta</h3>

                <form className="cuenta-config-form" onSubmit={saveAccountInformation}>
                  <div className="cuenta-field">
                    <label htmlFor="account-nombre">Nombre completo</label>
                    <input
                      id="account-nombre"
                      type="text"
                      value={accountForm.nombre}
                      onChange={onAccountFieldChange('nombre')}
                      required
                    />
                  </div>

                  <div className="cuenta-field">
                    <label htmlFor="account-correo">Correo electronico</label>
                    <input
                      id="account-correo"
                      type="email"
                      value={accountForm.correo}
                      onChange={onAccountFieldChange('correo')}
                      required
                    />
                  </div>

                  <div className="cuenta-field cuenta-field--wide">
                    <label htmlFor="account-direccion">Direccion de envio</label>
                    <textarea
                      id="account-direccion"
                      rows={3}
                      value={accountForm.direccionEnvio}
                      onChange={onAccountFieldChange('direccionEnvio')}
                      placeholder="Calle, numero, colonia, ciudad, estado, codigo postal"
                    />
                  </div>

                  <div className="cuenta-form-actions">
                    <button type="submit" className="admin-btn admin-btn--primary">
                      Guardar informacion
                    </button>
                  </div>
                </form>

                {accountError ? <p className="cuenta-msg cuenta-msg--error">{accountError}</p> : null}
                {accountSuccess ? <p className="cuenta-msg cuenta-msg--ok">{accountSuccess}</p> : null}

                <section className="metodos-pago-panel" aria-label="Metodos de pago">
                  <h4>Metodos de pago</h4>

                  {paymentMethods.length === 0 ? (
                    <p className="metodo-pago-empty">Aun no tienes metodos de pago guardados.</p>
                  ) : (
                    <div className="metodos-pago-list">
                      {paymentMethods.map((method) => (
                        <article key={method.id} className="metodo-pago-card">
                          <div className="metodo-pago-card__top">
                            <strong>{method.alias}</strong>
                            <span>{method.type}</span>
                          </div>
                          <p>{`Titular: ${method.holder}`}</p>
                          <p>{`Terminacion: **** ${method.last4}`}</p>
                          <p>{`Expira: ${method.expiry}`}</p>
                          <button
                            type="button"
                            className="metodo-remove-btn"
                            onClick={() => removePaymentMethod(method.id)}
                          >
                            Eliminar metodo
                          </button>
                        </article>
                      ))}
                    </div>
                  )}

                  <form className="metodo-pago-form" onSubmit={addPaymentMethod}>
                    <div className="cuenta-field">
                      <label htmlFor="metodo-tipo">Tipo</label>
                      <select
                        id="metodo-tipo"
                        value={paymentMethodForm.type}
                        onChange={onPaymentMethodFieldChange('type')}
                      >
                        {PAYMENT_METHOD_TYPES.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="cuenta-field">
                      <label htmlFor="metodo-alias">Alias</label>
                      <input
                        id="metodo-alias"
                        type="text"
                        value={paymentMethodForm.alias}
                        onChange={onPaymentMethodFieldChange('alias')}
                        placeholder="Tarjeta principal"
                        required
                      />
                    </div>

                    <div className="cuenta-field">
                      <label htmlFor="metodo-titular">Titular</label>
                      <input
                        id="metodo-titular"
                        type="text"
                        value={paymentMethodForm.holder}
                        onChange={onPaymentMethodFieldChange('holder')}
                        required
                      />
                    </div>

                    <div className="cuenta-field">
                      <label htmlFor="metodo-last4">Ultimos 4 digitos</label>
                      <input
                        id="metodo-last4"
                        type="text"
                        inputMode="numeric"
                        maxLength={4}
                        value={paymentMethodForm.last4}
                        onChange={onPaymentMethodFieldChange('last4')}
                        placeholder="1234"
                        required
                      />
                    </div>

                    <div className="cuenta-field">
                      <label htmlFor="metodo-expiry">Expiracion</label>
                      <input
                        id="metodo-expiry"
                        type="text"
                        value={paymentMethodForm.expiry}
                        onChange={onPaymentMethodFieldChange('expiry')}
                        placeholder="MM/AA"
                        required
                      />
                    </div>

                    <div className="cuenta-form-actions">
                      <button type="submit" className="admin-btn admin-btn--secondary">
                        Agregar metodo de pago
                      </button>
                    </div>
                  </form>
                </section>
              </section>
            )}

            {isSuperUser && (
              <section className="admin-productos-panel" aria-label="Panel super usuario">
                <h3>Panel Super Usuario (CRUD Productos)</h3>

                <form className="admin-create-form" onSubmit={createProductFromAdmin}>
                  <div className="admin-field">
                    <label htmlFor="admin-product-title">Nombre del producto</label>
                    <input
                      id="admin-product-title"
                      type="text"
                      value={createProductForm.title}
                      onChange={onCreateProductFieldChange('title')}
                      required
                    />
                  </div>

                  <div className="admin-field">
                    <label htmlFor="admin-product-price">Precio</label>
                    <input
                      id="admin-product-price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={createProductForm.price}
                      onChange={onCreateProductFieldChange('price')}
                      required
                    />
                  </div>

                  <div className="admin-field admin-field--wide">
                    <label htmlFor="admin-product-image">Imagen principal (ruta)</label>
                    <input
                      id="admin-product-image"
                      type="text"
                      value={createProductForm.img}
                      onChange={onCreateProductFieldChange('img')}
                      placeholder="imagenes/mi_producto.jpg"
                      required
                    />
                  </div>

                  <div className="admin-field admin-field--wide">
                    <label htmlFor="admin-product-image-hover">Imagen hover (opcional)</label>
                    <input
                      id="admin-product-image-hover"
                      type="text"
                      value={createProductForm.imgHover}
                      onChange={onCreateProductFieldChange('imgHover')}
                      placeholder="imagenes/mi_producto_hover.jpg"
                    />
                  </div>

                  <div className="admin-field">
                    <label htmlFor="admin-product-category">Categoria</label>
                    <select
                      id="admin-product-category"
                      value={createProductForm.categoryKey}
                      onChange={onCreateProductFieldChange('categoryKey')}
                    >
                      {adminCategoryKeys.map((categoryKey) => (
                        <option key={categoryKey} value={categoryKey}>
                          {categoryKey}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="admin-form-actions">
                    <button type="submit" className="admin-btn admin-btn--primary">
                      Crear producto
                    </button>
                  </div>
                </form>

                {adminError ? <p className="admin-msg admin-msg--error">{adminError}</p> : null}
                {adminSuccess ? <p className="admin-msg admin-msg--ok">{adminSuccess}</p> : null}

                <div className="admin-products-list">
                  {adminProducts.map(({ id, product, categories }) => {
                    const draft = getProductDraft(id, product, categories);
                    return (
                      <article key={id} className="admin-product-card">
                        <div className="admin-product-card__top">
                          <strong>{product.title}</strong>
                          <span>{product._isHidden ? 'Oculto' : 'Visible'}</span>
                        </div>
                        <p>{`ID: ${id}`}</p>
                        <p>{`Precio actual: ${app.currency.formatMXN(product.price)}`}</p>
                        <p>{`Categorias: ${categories.length ? categories.join(', ') : 'Sin categoria'}`}</p>

                        <div className="admin-edit-grid">
                          <div className="admin-field">
                            <label htmlFor={`admin-edit-title-${id}`}>Nombre</label>
                            <input
                              id={`admin-edit-title-${id}`}
                              type="text"
                              value={draft.title}
                              onChange={onProductDraftFieldChange(id, 'title', product, categories)}
                            />
                          </div>

                          <div className="admin-field">
                            <label htmlFor={`admin-edit-price-${id}`}>Precio</label>
                            <input
                              id={`admin-edit-price-${id}`}
                              type="number"
                              min="0"
                              step="0.01"
                              value={draft.price}
                              onChange={onProductDraftFieldChange(id, 'price', product, categories)}
                            />
                          </div>

                          <div className="admin-field admin-field--wide">
                            <label htmlFor={`admin-edit-img-${id}`}>Imagen principal</label>
                            <input
                              id={`admin-edit-img-${id}`}
                              type="text"
                              value={draft.img}
                              onChange={onProductDraftFieldChange(id, 'img', product, categories)}
                            />
                          </div>

                          <div className="admin-field admin-field--wide">
                            <label htmlFor={`admin-edit-hover-${id}`}>Imagen hover</label>
                            <input
                              id={`admin-edit-hover-${id}`}
                              type="text"
                              value={draft.imgHover}
                              onChange={onProductDraftFieldChange(id, 'imgHover', product, categories)}
                              placeholder="Opcional"
                            />
                          </div>

                          <div className="admin-field admin-field--wide">
                            <label>Categorias</label>
                            <div className="admin-categories-grid">
                              {adminCategoryKeys.map((categoryKey) => (
                                <label key={`${id}-${categoryKey}`} className="admin-category-option">
                                  <input
                                    type="checkbox"
                                    checked={draft.categories.includes(categoryKey)}
                                    onChange={() =>
                                      toggleDraftCategory(id, categoryKey, product, categories)
                                    }
                                  />
                                  <span>{categoryKey}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="admin-actions">
                          <button
                            type="button"
                            className="admin-btn admin-btn--primary"
                            onClick={() => saveProductChanges(id, product, categories)}
                          >
                            Guardar cambios
                          </button>
                          {product._isHidden ? (
                            <button
                              type="button"
                              className="admin-btn admin-btn--secondary"
                              onClick={() => restoreProductFromAdmin(id)}
                            >
                              Mostrar producto
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="admin-btn admin-btn--secondary"
                              onClick={() => hideProductFromAdmin(id)}
                            >
                              Ocultar producto
                            </button>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            )}

            <button type="button" onClick={cerrarSesion}>
              Cerrar Sesion
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

export default AccountPage;
