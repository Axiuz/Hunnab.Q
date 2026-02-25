import { useEffect, useMemo, useState } from 'react';

const REGEX_PASSWORD = /^(?=.*[!@#$%^&*])[A-Za-z0-9!@#$%^&*]{6,10}$/;
const EMPTY_ACCOUNT_FORM = {
  nombre: '',
  correo: '',
  direccionEnvio: '',
};
const EMPTY_PASSWORD_FORM = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
};
const ORDER_STATUS_OPTIONS = [
  { value: 'PENDIENTE', label: 'Pendiente' },
  { value: 'EN PREPARACION', label: 'En preparacion' },
  { value: 'ENVIADO', label: 'Enviado' },
];

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
  const [passwordForm, setPasswordForm] = useState(EMPTY_PASSWORD_FORM);
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [deleteAccountPassword, setDeleteAccountPassword] = useState('');
  const [showDeletePassword, setShowDeletePassword] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [accountError, setAccountError] = useState('');
  const [accountSuccess, setAccountSuccess] = useState('');
  const [pedidosUsuario, setPedidosUsuario] = useState([]);
  const [pedidosAdmin, setPedidosAdmin] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState('');
  const [ordersSuccess, setOrdersSuccess] = useState('');
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const [orderStatusDrafts, setOrderStatusDrafts] = useState({});

  // Estado exclusivo del panel super usuario.
  const [, setAdminRefreshKey] = useState(0);
  const [adminError, setAdminError] = useState('');
  const [adminSuccess, setAdminSuccess] = useState('');
  const [createProductForm, setCreateProductForm] = useState({
    title: '',
    price: '',
    stock: '10',
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
    setPasswordForm(EMPTY_PASSWORD_FORM);
    setShowPasswordFields(false);
    setDeleteAccountPassword('');
    setShowDeletePassword(false);
    setIsDeletingAccount(false);
    setAccountError('');
    setAccountSuccess('');
    setPedidosUsuario([]);
    setPedidosAdmin([]);
    setOrdersLoading(false);
    setOrdersError('');
    setOrdersSuccess('');
    setUpdatingOrderId(null);
    setOrderStatusDrafts({});
    setForm({ nombre: '', correo: '', usuario: '', password: '' });
  };

  // Datos derivados para renderizado.
  const nombreUsuario = (usuarioActivo?.nombre || usuarioActivo?.usuario || '').trim();
  const normalizedRole = String(usuarioActivo?.tipoUsuario || usuarioActivo?.tipo_usuario || '')
    .trim()
    .toUpperCase();
  const isSuperUser = normalizedRole === 'ADMIN' || normalizedRole === 'ADMINISTRADOR';
  const ordersForTab = isSuperUser ? pedidosAdmin : pedidosUsuario;
  const ordersTabLabel = isSuperUser ? 'Pedidos' : 'Mis pedidos';
  const ordersEmptyMessage = isSuperUser
    ? 'No hay pedidos registrados en la base de datos.'
    : 'Aun no tienes pedidos.';
  const adminProducts = isSuperUser ? app.catalog?.getAdminProducts?.() ?? [] : [];
  const adminCategoryKeys = useMemo(() => app.catalog?.getCategoryKeys?.() ?? [], [app]);
  const statusLabelMap = useMemo(
    () => Object.fromEntries(ORDER_STATUS_OPTIONS.map((option) => [option.value, option.label])),
    []
  );

  const buildOrderStatusDrafts = (orders) => {
    if (!Array.isArray(orders)) {
      return {};
    }
    return orders.reduce((acc, order) => {
      const orderId = Number.parseInt(order?.idPedido, 10);
      if (!Number.isInteger(orderId) || orderId <= 0) {
        return acc;
      }
      const statusKey = String(order?.statusKey || '').trim().toUpperCase() || 'PENDIENTE';
      acc[orderId] = statusKey;
      return acc;
    }, {});
  };

  useEffect(() => {
    if (!isSuperUser && cuentaTab === 'crud') {
      setCuentaTab('pedidos');
    }
  }, [isSuperUser, cuentaTab]);

  const refreshOrders = async () => {
    if (!usuarioActivo || !app?.orders) {
      setPedidosUsuario([]);
      setPedidosAdmin([]);
      setOrdersLoading(false);
      return;
    }

    setOrdersLoading(true);
    const [userOrdersResult, adminOrdersResult] = await Promise.all([
      app.orders.getUserOrders?.(usuarioActivo),
      isSuperUser ? app.orders.getAdminOrders?.(usuarioActivo) : Promise.resolve([]),
    ]);
    setPedidosUsuario(Array.isArray(userOrdersResult) ? userOrdersResult : []);
    const safeAdminOrders = Array.isArray(adminOrdersResult) ? adminOrdersResult : [];
    setPedidosAdmin(safeAdminOrders);
    setOrderStatusDrafts(isSuperUser ? buildOrderStatusDrafts(safeAdminOrders) : {});
    setOrdersLoading(false);
  };

  useEffect(() => {
    let isMounted = true;

    const loadOrders = async () => {
      if (!usuarioActivo || !app?.orders) {
        if (!isMounted) {
          return;
        }
        setPedidosUsuario([]);
        setPedidosAdmin([]);
        setOrdersLoading(false);
        return;
      }

      setOrdersLoading(true);
      const [userOrdersResult, adminOrdersResult] = await Promise.all([
        app.orders.getUserOrders?.(usuarioActivo),
        isSuperUser ? app.orders.getAdminOrders?.(usuarioActivo) : Promise.resolve([]),
      ]);
      if (!isMounted) {
        return;
      }
      setPedidosUsuario(Array.isArray(userOrdersResult) ? userOrdersResult : []);
      const safeAdminOrders = Array.isArray(adminOrdersResult) ? adminOrdersResult : [];
      setPedidosAdmin(safeAdminOrders);
      setOrderStatusDrafts(isSuperUser ? buildOrderStatusDrafts(safeAdminOrders) : {});
      setOrdersLoading(false);
    };

    loadOrders();
    return () => {
      isMounted = false;
    };
  }, [app, usuarioActivo, isSuperUser]);

  const onOrderStatusDraftChange = (orderId) => (event) => {
    setOrdersError('');
    setOrdersSuccess('');
    setOrderStatusDrafts((prev) => ({
      ...prev,
      [orderId]: event.target.value,
    }));
  };

  const updateOrderStatus = async (order) => {
    const orderId = Number.parseInt(order?.idPedido, 10);
    if (!isSuperUser || !Number.isInteger(orderId) || orderId <= 0) {
      return;
    }
    if (typeof app?.orders?.updateOrderStatus !== 'function') {
      setOrdersError('No esta disponible la actualizacion de estado de pedidos en esta version.');
      return;
    }

    const status = String(orderStatusDrafts[orderId] || order?.statusKey || 'PENDIENTE');
    setOrdersError('');
    setOrdersSuccess('');
    setUpdatingOrderId(orderId);

    const result = await app.orders.updateOrderStatus({
      adminUser: usuarioActivo,
      orderId,
      status,
    });

    if (!result?.ok) {
      setOrdersError(result?.error || 'No se pudo actualizar el estado del pedido.');
      setUpdatingOrderId(null);
      return;
    }

    setOrdersSuccess(`Pedido ${order.id} actualizado a ${statusLabelMap[status] || status}.`);
    await refreshOrders();
    setUpdatingOrderId(null);
  };

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

  const syncCreatedProductToMysql = async ({ createdProductId, createdForm }) => {
    const adminUserId = Number.parseInt(usuarioActivo?.id, 10);
    const hasValidAdminUserId = Number.isInteger(adminUserId) && adminUserId > 0;
    const adminUsername = String(usuarioActivo?.usuario || '').trim();
    if (!adminUsername) {
      return { ok: false, error: 'No hay sesion de super usuario valida para sincronizar a MySQL.' };
    }

    const apiUrl = typeof app?.orders?.buildApiUrl === 'function'
      ? app.orders.buildApiUrl('/api/products/admin-create')
      : '/api/products/admin-create';

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminUserId: hasValidAdminUserId ? adminUserId : null,
          adminUsername,
          product: {
            localId: String(createdProductId || '').trim(),
            title: String(createdForm?.title || '').trim(),
            price: Number.parseFloat(createdForm?.price),
            stock: Number.parseInt(createdForm?.stock, 10),
            categoryKey: String(createdForm?.categoryKey || '').trim(),
            description: 'Producto creado desde CRUD local.',
          },
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        return { ok: false, error: data?.error || 'No se pudo guardar el producto en MySQL.' };
      }
      return { ok: true, data };
    } catch (error) {
      return { ok: false, error: 'No hay conexion con el servidor API.' };
    }
  };

  const syncUpdatedProductToMysql = async ({ productId, previousTitle, updatedDraft }) => {
    const adminUserId = Number.parseInt(usuarioActivo?.id, 10);
    const hasValidAdminUserId = Number.isInteger(adminUserId) && adminUserId > 0;
    const adminUsername = String(usuarioActivo?.usuario || '').trim();
    if (!adminUsername) {
      return { ok: false, error: 'No hay sesion de super usuario valida para sincronizar a MySQL.' };
    }

    const nextCategoryKey = Array.isArray(updatedDraft?.categories) && updatedDraft.categories.length > 0
      ? String(updatedDraft.categories[0] || '').trim()
      : '';
    const apiUrl = typeof app?.orders?.buildApiUrl === 'function'
      ? app.orders.buildApiUrl('/api/products/admin-create')
      : '/api/products/admin-create';

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminUserId: hasValidAdminUserId ? adminUserId : null,
          adminUsername,
          product: {
            localId: String(productId || '').trim(),
            lookupTitle: String(previousTitle || '').trim(),
            title: String(updatedDraft?.title || '').trim(),
            price: Number.parseFloat(updatedDraft?.price),
            stock: Number.parseInt(updatedDraft?.stock, 10),
            categoryKey: nextCategoryKey,
            description: 'Producto actualizado desde CRUD local.',
          },
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        return { ok: false, error: data?.error || 'No se pudo actualizar el producto en MySQL.' };
      }
      return { ok: true, data };
    } catch (error) {
      return { ok: false, error: 'No hay conexion con el servidor API.' };
    }
  };

  const onCreateProductFieldChange = (field) => (event) => {
    clearAdminMessages();
    setCreateProductForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  // Acciones CRUD visuales desde panel admin.
  const createProductFromAdmin = async (event) => {
    event.preventDefault();
    clearAdminMessages();
    const result = app.catalog?.adminCreateProduct?.(createProductForm);
    if (!result?.ok) {
      setAdminError(result?.error || 'No se pudo crear el producto.');
      return;
    }

    const syncResult = await syncCreatedProductToMysql({
      createdProductId: result.id,
      createdForm: createProductForm,
    });
    if (!syncResult?.ok) {
      setAdminError(`${syncResult?.error || 'No se pudo guardar en MySQL.'} El producto quedo creado localmente.`);
      setAdminSuccess(`Producto creado localmente: ${result.id}`);
    } else {
      setAdminSuccess(`Producto creado: ${result.id} y guardado en MySQL.`);
    }

    setCreateProductForm((prev) => ({
      ...prev,
      title: '',
      price: '',
      stock: '10',
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
      stock: draft?.stock ?? `${product.stock ?? 0}`,
      img: draft?.img ?? product.img ?? '',
      imgHover: draft?.imgHover ?? product.imgHover ?? '',
      categories: Array.isArray(draft?.categories) ? draft.categories : categories,
    };
  };

  const onProductDraftFieldChange = (productId, field, product, categories) => (event) => {
    clearAdminMessages();
    const current = getProductDraft(productId, product, categories);
    const value = field === 'price' || field === 'stock'
      ? event.target.value
      : String(event.target.value || '');
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

  const saveProductChanges = async (productId, product, categories) => {
    clearAdminMessages();
    const draft = getProductDraft(productId, product, categories);
    const result = app.catalog?.adminUpdateProduct?.({
      id: productId,
      title: draft.title,
      price: draft.price,
      stock: draft.stock,
      img: draft.img,
      imgHover: draft.imgHover,
      categories: draft.categories,
    });
    if (!result?.ok) {
      setAdminError(result?.error || 'No se pudo actualizar el producto.');
      return;
    }

    const syncResult = await syncUpdatedProductToMysql({
      productId,
      previousTitle: product?.title,
      updatedDraft: draft,
    });
    if (!syncResult?.ok) {
      setAdminError(`${syncResult?.error || 'No se pudo actualizar en MySQL.'} Los cambios quedaron guardados localmente.`);
      setAdminSuccess('Producto actualizado localmente.');
    } else {
      setAdminSuccess('Producto actualizado y sincronizado en MySQL.');
    }

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

  const onPasswordFieldChange = (field) => (event) => {
    clearAccountMessages();
    setPasswordForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const onDeleteAccountPasswordChange = (event) => {
    clearAccountMessages();
    setDeleteAccountPassword(event.target.value);
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

  const changePassword = async (event) => {
    event.preventDefault();
    clearAccountMessages();

    if (!REGEX_PASSWORD.test(passwordForm.newPassword)) {
      setAccountError(
        'La contrasena debe tener entre 6 y 10 caracteres, incluir al menos un signo especial (!@#$%^&*) y solo puede contener letras (sin enie ni acentos), numeros y esos signos.'
      );
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setAccountError('La nueva contrasena y su confirmacion no coinciden.');
      return;
    }

    if (typeof auth.changePassword !== 'function') {
      setAccountError('No esta disponible el cambio de contrasena en esta version.');
      return;
    }

    const result = await auth.changePassword({
      user: usuarioActivo,
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword,
    });

    if (!result?.ok) {
      setAccountError(result?.error || 'No se pudo cambiar la contrasena.');
      return;
    }

    setPasswordForm(EMPTY_PASSWORD_FORM);
    setAccountSuccess('Contrasena actualizada correctamente.');
  };

  const deleteAccount = async (event) => {
    event.preventDefault();
    clearAccountMessages();

    if (!deleteAccountPassword.trim()) {
      setAccountError('Ingresa tu contrasena actual para eliminar la cuenta.');
      return;
    }
    if (typeof auth.deleteAccount !== 'function') {
      setAccountError('No esta disponible eliminar cuenta en esta version.');
      return;
    }

    const confirmed = typeof window === 'undefined'
      ? true
      : window.confirm(
          'Vas a eliminar tu cuenta de forma permanente. Esta accion no se puede deshacer. Deseas continuar?'
        );
    if (!confirmed) {
      return;
    }

    setIsDeletingAccount(true);
    const result = await auth.deleteAccount({
      user: usuarioActivo,
      password: deleteAccountPassword,
    });
    setIsDeletingAccount(false);

    if (!result?.ok) {
      setAccountError(result?.error || 'No se pudo eliminar la cuenta.');
      return;
    }

    cerrarSesion();
  };

  useEffect(() => {
    if (!auth || !usuarioActivo) {
      setAccountForm(EMPTY_ACCOUNT_FORM);
      setPasswordForm(EMPTY_PASSWORD_FORM);
      setShowPasswordFields(false);
      setDeleteAccountPassword('');
      setShowDeletePassword(false);
      setIsDeletingAccount(false);
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
    setPasswordForm(EMPTY_PASSWORD_FORM);
    setShowPasswordFields(false);
    setDeleteAccountPassword('');
    setShowDeletePassword(false);
    setIsDeletingAccount(false);
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
                {ordersTabLabel}
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
              {isSuperUser && (
                <button
                  type="button"
                  role="tab"
                  className={`cuenta-submenu__btn ${cuentaTab === 'crud' ? 'is-active' : ''}`}
                  aria-selected={cuentaTab === 'crud' ? 'true' : 'false'}
                  onClick={() => setCuentaTab('crud')}
                >
                  CRUD productos
                </button>
              )}
            </div>

            {cuentaTab === 'pedidos' && (
              <section className="pedidos-panel" aria-label={ordersTabLabel}>
                <div className="admin-orders-panel__top">
                  <h3>{ordersTabLabel}</h3>
                  {isSuperUser ? (
                    <button type="button" className="admin-btn admin-btn--secondary" onClick={refreshOrders}>
                      Actualizar pedidos
                    </button>
                  ) : null}
                </div>
                {ordersError ? <p className="cuenta-msg cuenta-msg--error">{ordersError}</p> : null}
                {ordersSuccess ? <p className="cuenta-msg cuenta-msg--ok">{ordersSuccess}</p> : null}
                {ordersLoading ? (
                  <p className="pedidos-empty">Cargando pedidos...</p>
                ) : ordersForTab.length === 0 ? (
                  <p className="pedidos-empty">
                    {ordersEmptyMessage}
                    {isSuperUser ? null : (
                      <>
                        {' '}
                        Ve al <a href="#/carrito">carrito</a> y finaliza uno.
                      </>
                    )}
                  </p>
                ) : (
                  <div className="pedidos-list">
                    {ordersForTab.map((pedido) => (
                      <article key={pedido.id} className="pedido-card">
                        <div className="pedido-card__top">
                          <strong>{pedido.id}</strong>
                          <span>{pedido.status}</span>
                        </div>
                        <p>{formatOrderDate(pedido.createdAt)}</p>
                        {isSuperUser ? <p>{`Usuario: ${pedido.user?.usuario || 'N/A'}`}</p> : null}
                        <p>{`Total: ${app.currency.formatMXN(pedido.total)}`}</p>
                        <p>{`Productos: ${pedido.items.length}`}</p>
                        {isSuperUser ? (
                          <div className="pedido-status-actions">
                            <label htmlFor={`pedido-status-${pedido.idPedido}`}>Estado</label>
                            <select
                              id={`pedido-status-${pedido.idPedido}`}
                              value={orderStatusDrafts[pedido.idPedido] || pedido.statusKey || 'PENDIENTE'}
                              onChange={onOrderStatusDraftChange(pedido.idPedido)}
                              disabled={updatingOrderId === pedido.idPedido}
                            >
                              {ORDER_STATUS_OPTIONS.map((option) => (
                                <option key={`${pedido.idPedido}-${option.value}`} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                            <button
                              type="button"
                              className="admin-btn admin-btn--secondary"
                              onClick={() => updateOrderStatus(pedido)}
                              disabled={updatingOrderId === pedido.idPedido}
                            >
                              {updatingOrderId === pedido.idPedido ? 'Guardando...' : 'Guardar estado'}
                            </button>
                          </div>
                        ) : null}
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

                <section className="cuenta-password-panel" aria-label="Cambiar contrasena">
                  <h4>Cambiar contrasena</h4>
                  <form className="cuenta-password-form" onSubmit={changePassword}>
                    <div className="cuenta-field">
                      <label htmlFor="account-current-password">Contrasena actual</label>
                      <input
                        id="account-current-password"
                        type={showPasswordFields ? 'text' : 'password'}
                        value={passwordForm.currentPassword}
                        onChange={onPasswordFieldChange('currentPassword')}
                        required
                      />
                    </div>

                    <div className="cuenta-field">
                      <label htmlFor="account-new-password">Nueva contrasena</label>
                      <input
                        id="account-new-password"
                        type={showPasswordFields ? 'text' : 'password'}
                        value={passwordForm.newPassword}
                        onChange={onPasswordFieldChange('newPassword')}
                        required
                      />
                    </div>

                    <div className="cuenta-field">
                      <label htmlFor="account-confirm-password">Confirmar nueva contrasena</label>
                      <input
                        id="account-confirm-password"
                        type={showPasswordFields ? 'text' : 'password'}
                        value={passwordForm.confirmPassword}
                        onChange={onPasswordFieldChange('confirmPassword')}
                        required
                      />
                    </div>

                    <label className="cuenta-show-pass cuenta-field--wide" htmlFor="account-show-passwords">
                      <input
                        id="account-show-passwords"
                        type="checkbox"
                        checked={showPasswordFields}
                        onChange={(event) => setShowPasswordFields(event.target.checked)}
                      />
                      Ver contrasenas
                    </label>

                    <div className="cuenta-form-actions">
                      <button type="submit" className="admin-btn admin-btn--secondary">
                        Actualizar contrasena
                      </button>
                    </div>
                  </form>
                </section>

                <section className="cuenta-danger-panel" aria-label="Eliminar cuenta">
                  <h4>Eliminar cuenta</h4>
                  <p className="cuenta-danger-copy">
                    Esta accion es permanente y eliminara tu acceso a esta cuenta.
                  </p>
                  <form className="cuenta-delete-form" onSubmit={deleteAccount}>
                    <div className="cuenta-field">
                      <label htmlFor="account-delete-password">Contrasena actual</label>
                      <input
                        id="account-delete-password"
                        type={showDeletePassword ? 'text' : 'password'}
                        value={deleteAccountPassword}
                        onChange={onDeleteAccountPasswordChange}
                        required
                      />
                    </div>

                    <label className="cuenta-show-pass" htmlFor="account-show-delete-password">
                      <input
                        id="account-show-delete-password"
                        type="checkbox"
                        checked={showDeletePassword}
                        onChange={(event) => setShowDeletePassword(event.target.checked)}
                      />
                      Ver contrasena
                    </label>

                    <div className="cuenta-form-actions">
                      <button type="submit" className="admin-btn admin-btn--danger" disabled={isDeletingAccount}>
                        {isDeletingAccount ? 'Eliminando...' : 'Eliminar cuenta'}
                      </button>
                    </div>
                  </form>
                </section>

                {accountError ? <p className="cuenta-msg cuenta-msg--error">{accountError}</p> : null}
                {accountSuccess ? <p className="cuenta-msg cuenta-msg--ok">{accountSuccess}</p> : null}
              </section>
            )}

            {isSuperUser && cuentaTab === 'crud' && (
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

                  <div className="admin-field">
                    <label htmlFor="admin-product-stock">Stock inicial</label>
                    <input
                      id="admin-product-stock"
                      type="number"
                      min="0"
                      step="1"
                      value={createProductForm.stock}
                      onChange={onCreateProductFieldChange('stock')}
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
                        <p>{`Stock actual: ${product.stock}`}</p>
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

                          <div className="admin-field">
                            <label htmlFor={`admin-edit-stock-${id}`}>Stock</label>
                            <input
                              id={`admin-edit-stock-${id}`}
                              type="number"
                              min="0"
                              step="1"
                              value={draft.stock}
                              onChange={onProductDraftFieldChange(id, 'stock', product, categories)}
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
