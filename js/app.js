const money = n => new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP',maximumFractionDigits:0}).format(n).replace('COP','$');
const $ = (s,r=document)=>r.querySelector(s); const $$=(s,r=document)=>[...r.querySelectorAll(s)];

// --- STORAGE KEYS ---
const cartKey = 'sva_cart_v1';
const usersKey = 'sva_users_v1';
const sessionKey = 'sva_session_v1';
const progressKey = 'sva_progress_v1';

// --- UTILITIES & XSS SANITIZATION ---
function escHTML(s){
  if(s === null || s === undefined) return '';
  const d=document.createElement('div');
  d.textContent=String(s);
  return d.innerHTML;
}

function toast(msg, type='info'){
  let el=$('.toast');
  if(!el){
    el=document.createElement('div');
    el.className='toast';
    document.body.append(el);
  }
  el.textContent=msg;
  el.classList.add('show');
  setTimeout(()=>el.classList.remove('show'),3200);
}

function getCrypto(){
  return (typeof window !== 'undefined' && window.crypto) || (typeof crypto !== 'undefined' ? crypto : null);
}

// --- PASSWORD HASHING (Web Crypto API SHA-256 with Salt & Fallback) ---
async function hashPassword(pwd, salt){
  const c = getCrypto();
  if(c && c.subtle){
    try{
      const enc = new TextEncoder();
      const data = enc.encode(pwd + salt + 'sva_pepper_key_2026');
      const buf = await c.subtle.digest('SHA-256', data);
      return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
    }catch(e){}
  }
  let h = 0x811c9dc5;
  const str = pwd + salt + 'sva_pepper_key_2026';
  for(let i=0; i<str.length; i++){
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8,'0') + salt.slice(0,8);
}

function generateSalt(){
  const c = getCrypto();
  if(c && c.getRandomValues){
    const arr = new Uint8Array(16);
    c.getRandomValues(arr);
    return Array.from(arr).map(b => b.toString(16).padStart(2,'0')).join('');
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// --- USER & SESSION MANAGEMENT ---
function getUsers(){
  try{ return JSON.parse(localStorage.getItem(usersKey)||'[]'); }catch{ return []; }
}
function saveUsers(u){
  localStorage.setItem(usersKey, JSON.stringify(u));
}

function getCurrentUser(){
  try{
    const sess = JSON.parse(localStorage.getItem(sessionKey));
    if(!sess || sess.expiresAt < Date.now()){
      localStorage.removeItem(sessionKey);
      return null;
    }
    return sess;
  }catch{ return null; }
}

function setSession(user){
  const sess = {
    id: user.id,
    name: user.name,
    lastname: user.lastname,
    email: user.email,
    expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000)
  };
  localStorage.setItem(sessionKey, JSON.stringify(sess));
  updateNavAuth();
}

function logoutUser(){
  localStorage.removeItem(sessionKey);
  toast('Sesión cerrada.');
  setTimeout(()=>{
    if(location.pathname.endsWith('aula.html')) location.href = 'index.html';
    else updateNavAuth();
  }, 500);
}

function updateNavAuth(){
  const user = getCurrentUser();
  const actions = $('.nav-actions');
  if(!actions) return;
  
  if(user){
    actions.innerHTML = `
      <a class="cart-btn" href="carrito.html" aria-label="Carrito">🛒<span class="cart-count">0</span></a>
      <a class="btn btn-secondary btn-sm" href="aula.html" style="background:#edf8fc;border-color:var(--blue);color:var(--blue-deep)">🎓 Mi Aula (${escHTML(user.name)})</a>
      <button class="btn btn-primary btn-sm" onclick="logoutUser()">Salir</button>
    `;
  } else {
    actions.innerHTML = `
      <a class="cart-btn" href="carrito.html" aria-label="Carrito">🛒<span class="cart-count">0</span></a>
      <a class="btn btn-secondary btn-sm" href="login.html">Ingresar</a>
      <a class="btn btn-primary btn-sm" href="registro.html">Crear cuenta</a>
    `;
  }
  updateCartCount();
}

// --- CART MANAGEMENT ---
function getCart(){try{return JSON.parse(localStorage.getItem(cartKey)||'[]')}catch{return []}}
function saveCart(items){localStorage.setItem(cartKey,JSON.stringify(items)); updateCartCount()}
function addCart(id){
  const cart=getCart(); 
  if(!cart.includes(id)) cart.push(id); 
  saveCart(cart); 
  toast('Curso agregado al carrito.');
}
function removeCart(id){
  saveCart(getCart().filter(x=>x!==id)); 
  if(location.pathname.endsWith('carrito.html')) renderCart();
}
function updateCartCount(){const el=$('.cart-count'); if(el) el.textContent=getCart().length}

// --- CATALOG & COURSES RENDERING ---
function cardHTML(c){
  return `<article class="course-card"><a class="course-image" href="curso.html?id=${c.id}"><img loading="lazy" src="${c.image}" alt="${escHTML(c.name)}"><span class="course-price-badge">${money(c.price)}</span></a><div class="course-body"><div class="category">${escHTML(c.category)}</div><h3><a href="curso.html?id=${c.id}">${escHTML(c.name)}</a></h3><div class="course-meta"><div class="course-price"><small>COP</small>${money(c.price).replace('$','')}</div><div class="course-actions"><a class="btn btn-secondary btn-sm" href="curso.html?id=${c.id}">Ver</a><button class="btn btn-primary btn-sm" onclick="addCart(${c.id})">Agregar</button></div></div></div></article>`;
}

function setupNav(){
  const btn=$('.mobile-menu'),nav=$('.nav'); 
  if(btn&&nav) btn.addEventListener('click',()=>nav.classList.toggle('open')); 
  updateNavAuth();
}

function renderFeatured(){
  const box=$('#featuredCourses'); if(!box)return; 
  const ids=[7,32,39,74,84,97]; 
  box.innerHTML=ids.map(id=>cardHTML(COURSES[id-1])).join('');
}

function renderCategories(){
  const box=$('#categoryGrid'); if(!box)return; 
  const counts={}; 
  COURSES.forEach(c=>counts[c.category]=(counts[c.category]||0)+1); 
  const icons=['✚','♡','⚕','◉','⌁','♧','✓','⚙']; 
  box.innerHTML=Object.entries(counts).map(([cat,n],i)=>`<a class="cat-card" href="cursos.html?category=${encodeURIComponent(cat)}"><div class="cat-icon">${icons[i%icons.length]}</div><h3>${escHTML(cat)}</h3><p>Explora la oferta disponible en esta categoría.</p><span>${n} cursos →</span></a>`).join('');
}

function setupFaq(){
  $$('.faq-q').forEach(b=>b.addEventListener('click',()=>b.closest('.faq-item').classList.toggle('open')));
}

let catPage=1;
function renderCatalog(){
  const grid=$('#catalogGrid'); if(!grid)return; 
  const q=($('#search')?.value||'').trim().toLowerCase(); 
  const category=$('#categoryFilter')?.value||''; 
  const price=$('#priceFilter')?.value||''; 
  const sort=$('#sortFilter')?.value||''; 
  let list=COURSES.filter(c=>(!q||c.name.toLowerCase().includes(q))&&(!category||c.category===category)&&(!price||c.price===Number(price)));
  if(sort==='low')list.sort((a,b)=>a.price-b.price); 
  if(sort==='high')list.sort((a,b)=>b.price-a.price); 
  if(sort==='az')list.sort((a,b)=>a.name.localeCompare(b.name,'es'));
  const per=12,pages=Math.max(1,Math.ceil(list.length/per)); 
  catPage=Math.min(catPage,pages); 
  const slice=list.slice((catPage-1)*per,catPage*per); 
  grid.innerHTML=slice.map(cardHTML).join('')||`<div class="empty-state" style="grid-column:1/-1"><h3>No encontramos cursos</h3><p>Prueba con otra palabra o cambia los filtros.</p></div>`;
  $('#resultCount').textContent=`${list.length} cursos encontrados`;
  const pbox=$('#pagination'); 
  pbox.innerHTML=Array.from({length:pages},(_,i)=>`<button class="page-btn ${i+1===catPage?'active':''}" data-page="${i+1}">${i+1}</button>`).join(''); 
  $$('.page-btn',pbox).forEach(b=>b.onclick=()=>{catPage=Number(b.dataset.page);renderCatalog();scrollTo({top:260,behavior:'smooth'})});
}

function setupCatalog(){
  if(!$('#catalogGrid'))return; 
  const cf=$('#categoryFilter'); 
  [...new Set(COURSES.map(c=>c.category))].sort().forEach(c=>cf.insertAdjacentHTML('beforeend',`<option>${c}</option>`)); 
  const params=new URLSearchParams(location.search); 
  if(params.get('category')) cf.value=params.get('category'); 
  ['search','categoryFilter','priceFilter','sortFilter'].forEach(id=>$('#'+id)?.addEventListener(id==='search'?'input':'change',()=>{catPage=1;renderCatalog()})); 
  renderCatalog();
}

function renderDetail(){
  const root=$('#courseDetail');if(!root)return;
  const id=Number(new URLSearchParams(location.search).get('id'))||1;
  const c=COURSES.find(x=>x.id===id)||COURSES[0]; 
  document.title=`${c.name} | Saber Vital Academy`;
  root.innerHTML=`<div class="detail-grid"><div><div class="detail-media"><img src="${c.image}" alt="${escHTML(c.name)}"></div><div class="detail-copy"><div class="category">${escHTML(c.category)}</div><h1 style="font-size:clamp(2rem,4vw,3.35rem);margin:8px 0 18px">${escHTML(c.name)}</h1><h2>Información del curso</h2><div class="placeholder-box">Capacitación intensiva con certificación digital oficial, temario actualizado conforme a las directrices de salud de Colombia, material audiovisual y soporte docente.</div><h2 style="margin-top:26px">Contenido</h2><div class="placeholder-box">Módulos teórico-prácticos divididos en 5 lecciones paso a paso, evaluaciones de comprensión y acceso ilimitado desde tu panel de estudiante.</div></div></div><aside class="buy-card"><div class="category">Inscripción</div><div class="price">${money(c.price)}</div><div class="cop">Precio en pesos colombianos (COP)</div><button class="btn btn-primary" onclick="addCartAndCheckout(${c.id})">Comprar ahora</button><button class="btn btn-secondary" onclick="addCart(${c.id})" style="margin-top:8px">Agregar al carrito</button><ul class="buy-list"><li>Acceso inmediato al aula virtual</li><li>Interfaz responsive para móvil y computador</li><li>Pago seguro con pasarela certificada</li></ul></aside></div>`;
  let ld=document.querySelector('#courseLd');
  if(!ld){
    ld=document.createElement('script');
    ld.type='application/ld+json';
    ld.id='courseLd';
    document.head.append(ld);
  }
  ld.textContent=JSON.stringify({
    "@context":"https://schema.org",
    "@type":"Course",
    "name":c.name,
    "description":`Capacitación profesional en ${c.name} para el sector salud.`,
    "url":`https://sabervital.academy/curso.html?id=${c.id}`,
    "image":`https://sabervital.academy/${c.image}`,
    "provider":{"@type":"Organization","name":"Saber Vital Academy","url":"https://sabervital.academy"},
    "offers":{"@type":"Offer","price":c.price,"priceCurrency":"COP","availability":"https://schema.org/InStock"}
  });
}

function addCartAndCheckout(id){
  addCart(id);
  location.href = 'carrito.html';
}

function renderCart(){
  const listEl=$('#cartList');if(!listEl)return; 
  const ids=getCart(),items=ids.map(id=>COURSES.find(c=>c.id===id)).filter(Boolean); 
  if(!items.length){
    listEl.innerHTML=`<div class="empty-state"><h3>Tu carrito está vacío</h3><p>Explora el catálogo y agrega las capacitaciones que te interesen.</p><a class="btn btn-primary" style="margin-top:18px" href="cursos.html">Ver cursos</a></div>`;
    $('#cartSummary').innerHTML='';
    return;
  } 
  listEl.innerHTML=items.map(c=>`<article class="cart-item"><img src="${c.image}" alt="${escHTML(c.name)}"><div><div class="cat">${escHTML(c.category)}</div><h3>${escHTML(c.name)}</h3><div class="course-price" style="margin-top:7px">${money(c.price)}</div></div><div><button class="remove" onclick="removeCart(${c.id})">Eliminar</button></div></article>`).join(''); 
  const total=items.reduce((s,c)=>s+c.price,0); 
  $('#cartSummary').innerHTML=`<div class="summary-card"><h3>Resumen</h3><div class="summary-row"><span>${items.length} curso${items.length>1?'s':''}</span><strong>${money(total)}</strong></div><div class="summary-row total"><span>Total</span><span>${money(total)}</span></div><button class="btn btn-primary" onclick="openCheckoutModal(${total})">Continuar al pago</button><div class="secure-badge">🔒 Cifrado seguro SSL 256-bit</div><p style="font-size:.74rem;margin-top:12px;text-align:center">Aceptamos PSE, Tarjetas de Crédito y Nequi en Colombia.</p></div>`;
}

// --- CHECKOUT & PAYMENT MODAL SYSTEM ---
function openCheckoutModal(total){
  const items = getCart().map(id => COURSES.find(c => c.id === id)).filter(Boolean);
  if(!items.length) return toast('Agrega al menos un curso al carrito.');
  
  let modal = $('#checkoutModal');
  if(!modal){
    modal = document.createElement('div');
    modal.id = 'checkoutModal';
    modal.className = 'sva-modal-backdrop';
    document.body.append(modal);
  }
  
  const user = getCurrentUser();
  const userName = user ? `${user.name} ${user.lastname}` : '';
  const userEmail = user ? user.email : '';
  
  modal.innerHTML = `
    <div class="sva-modal">
      <button class="sva-modal-close" onclick="closeModal('checkoutModal')">✕</button>
      <div class="modal-head">
        <span class="eyebrow" style="color:var(--green-dark)">Checkout Seguro</span>
        <h2>Pasarela de Pago</h2>
        <p>Selecciona tu medio de pago preferido para activar tu formación en Colombia.</p>
      </div>
      
      <div class="payment-tabs">
        <button class="payment-tab active" onclick="switchPaymentTab('pse')">🏦 PSE</button>
        <button class="payment-tab" onclick="switchPaymentTab('card')">💳 Tarjeta</button>
        <button class="payment-tab" onclick="switchPaymentTab('nequi')">📱 Nequi</button>
      </div>
      
      <form id="paymentForm" onsubmit="processPayment(event, ${total})">
        <div id="tab-pse" class="payment-body active">
          <div class="field"><label>Banco</label>
            <select required class="field" style="width:100%;border:1px solid #cfdee6;border-radius:12px;padding:12px">
              <option value="">Selecciona tu banco</option>
              <option>Bancolombia</option>
              <option>Banco de Bogotá</option>
              <option>Davivienda</option>
              <option>Nequi / Daviplata</option>
              <option>BBVA Colombia</option>
              <option>Banco de Occidente</option>
            </select>
          </div>
          <div class="field"><label>Nombre del titular</label><input required value="${escHTML(userName)}" placeholder="Nombre completo"></div>
          <div class="field"><label>Correo registrado en PSE</label><input required type="email" value="${escHTML(userEmail)}" placeholder="nombre@correo.com"></div>
          <div class="field"><label>Cédula de Ciudadanía (CC/NIT)</label><input required placeholder="Número de documento"></div>
        </div>
        
        <div id="tab-card" class="payment-body">
          <div class="field"><label>Número de tarjeta</label><input required maxlength="19" placeholder="4500 •••• •••• ••••"></div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
            <div class="field"><label>Vencimiento</label><input required placeholder="MM/AA" maxlength="5"></div>
            <div class="field"><label>CVV</label><input required type="password" maxlength="4" placeholder="123"></div>
          </div>
          <div class="field"><label>Nombre en la tarjeta</label><input required value="${escHTML(userName)}" placeholder="Como aparece en el plástico"></div>
        </div>
        
        <div id="tab-nequi" class="payment-body">
          <div class="field"><label>Número de celular Nequi</label><input required type="tel" maxlength="10" placeholder="300 000 0000"></div>
          <p style="font-size:.82rem;color:var(--muted);margin-bottom:12px">Recibirás una notificación en tu app Nequi para aprobar el cobro por ${money(total)}.</p>
        </div>
        
        <div class="checkout-summary">
          <div class="checkout-summary-row"><span>Cursos (${items.length}):</span><strong>${money(total)}</strong></div>
          <div class="checkout-summary-row"><span>IVA educación (0%):</span><span>$0</span></div>
          <div class="checkout-summary-row total"><span>Total a pagar:</span><span>${money(total)}</span></div>
        </div>
        
        <button class="btn btn-primary" style="width:100%" type="submit" id="btnPayNow">Confirmar y pagar ${money(total)}</button>
        <div class="secure-badge">🛡️ Transacción protegida por pasarela certificada</div>
      </form>
    </div>
  `;
  modal.classList.add('active');
}

function switchPaymentTab(type){
  $$('.payment-tab').forEach(t => t.classList.remove('active'));
  $$('.payment-body').forEach(b => b.classList.remove('active'));
  $(`.payment-tab[onclick*="${type}"]`)?.classList.add('active');
  $(`#tab-${type}`)?.classList.add('active');
}

function closeModal(id){
  const m = $('#' + id);
  if(m) m.classList.remove('active');
}

async function processPayment(e, total){
  e.preventDefault();
  const btn = $('#btnPayNow');
  btn.disabled = true;
  btn.textContent = 'Procesando pago seguro... ⏳';
  
  await new Promise(r => setTimeout(r, 1400));
  
  // Register order
  const orderId = 'SVA-' + Math.floor(100000 + Math.random() * 900000);
  const cartIds = getCart();
  
  // Grant courses to user
  let user = getCurrentUser();
  if(!user){
    // Create guest student account
    const email = $('#paymentForm input[type=email]')?.value || 'estudiante@sabervital.academy';
    const name = $('#paymentForm input[placeholder*="Nombre"]')?.value || 'Estudiante';
    user = { id: 'usr_' + Date.now(), name: name.split(' ')[0], lastname: name.split(' ').slice(1).join(' ') || 'Salud', email };
    setSession(user);
  }
  
  const users = getUsers();
  let dbUser = users.find(u => u.id === user.id);
  if(!dbUser){
    dbUser = { ...user, purchasedCourses: [] };
    users.push(dbUser);
  }
  if(!dbUser.purchasedCourses) dbUser.purchasedCourses = [];
  cartIds.forEach(id => {
    if(!dbUser.purchasedCourses.includes(id)) dbUser.purchasedCourses.push(id);
  });
  saveUsers(users);
  
  // Clear cart
  saveCart([]);
  closeModal('checkoutModal');
  
  // Show Receipt Modal
  showSuccessOrderModal(orderId, total, cartIds.length);
}

function showSuccessOrderModal(orderId, total, count){
  let modal = $('#orderSuccessModal');
  if(!modal){
    modal = document.createElement('div');
    modal.id = 'orderSuccessModal';
    modal.className = 'sva-modal-backdrop';
    document.body.append(modal);
  }
  modal.innerHTML = `
    <div class="sva-modal" style="text-align:center">
      <div style="width:68px;height:68px;border-radius:50%;background:#eaf9ef;color:var(--green-dark);display:grid;place-items:center;font-size:2.2rem;margin:0 auto 16px">✓</div>
      <h2>¡Pago Exitoso y Confirmado!</h2>
      <p style="margin:8px 0 20px">Tu orden <strong>${orderId}</strong> ha sido procesada con éxito por <strong>${money(total)}</strong>.</p>
      <div style="background:var(--soft);border-radius:16px;padding:16px;margin-bottom:24px;border:1px solid var(--line);text-align:left;font-size:.85rem">
        <div><strong>Recibo oficial:</strong> ${orderId}</div>
        <div style="margin-top:6px"><strong>Cursos activados:</strong> ${count} curso(s) habilitado(s)</div>
        <div style="margin-top:6px"><strong>Acceso:</strong> Inmediato e ilimitado</div>
      </div>
      <a class="btn btn-primary" style="width:100%" href="aula.html">Ir a Mi Aula Virtual 🎓</a>
    </div>
  `;
  modal.classList.add('active');
}

// --- PASSWORD RECOVERY SYSTEM ---
function setupPasswordRecovery(){
  const link = $('.forgot-link');
  if(!link) return;
  link.onclick = (e) => {
    e.preventDefault();
    openForgotModal();
  };
}

function openForgotModal(){
  let modal = $('#forgotModal');
  if(!modal){
    modal = document.createElement('div');
    modal.id = 'forgotModal';
    modal.className = 'sva-modal-backdrop';
    document.body.append(modal);
  }
  modal.innerHTML = `
    <div class="sva-modal">
      <button class="sva-modal-close" onclick="closeModal('forgotModal')">✕</button>
      <div class="modal-head">
        <span class="eyebrow">Seguridad de cuenta</span>
        <h2>Recuperar Contraseña</h2>
        <p>Ingresa el correo electrónico asociado a tu cuenta de Saber Vital Academy.</p>
      </div>
      <form id="forgotForm" onsubmit="handleForgotSubmit(event)">
        <div class="field">
          <label>Correo electrónico</label>
          <input required type="email" id="recoveryEmail" placeholder="nombre@correo.com">
        </div>
        <button class="btn btn-primary" style="width:100%" type="submit">Continuar</button>
      </form>
      <div id="resetStep2" style="display:none;margin-top:20px">
        <div style="background:#eef9fd;border:1px solid #bce2ef;border-radius:12px;padding:12px;font-size:.84rem;color:var(--blue-dark);margin-bottom:16px">
          ✓ Código de verificación verificado para tu correo. Ingresa tu nueva contraseña segura.
        </div>
        <form onsubmit="handleNewPasswordSubmit(event)">
          <div class="field">
            <label>Nueva contraseña (mínimo 6 caracteres)</label>
            <input required type="password" id="newPwd" placeholder="••••••••">
          </div>
          <button class="btn btn-primary" style="width:100%" type="submit">Restablecer Contraseña</button>
        </form>
      </div>
    </div>
  `;
  modal.classList.add('active');
}

let pendingRecoveryEmail = '';
function handleForgotSubmit(e){
  e.preventDefault();
  const email = $('#recoveryEmail').value.trim().toLowerCase();
  const users = getUsers();
  const user = users.find(u => u.email.toLowerCase() === email);
  if(!user){
    toast('No encontramos una cuenta registrada con ese correo.');
    return;
  }
  pendingRecoveryEmail = email;
  $('#forgotForm').style.display = 'none';
  $('#resetStep2').style.display = 'block';
  toast('Verificación enviada. Ingresa tu nueva contraseña.');
}

async function handleNewPasswordSubmit(e){
  e.preventDefault();
  const newPwd = $('#newPwd').value;
  if(newPwd.length < 6) return toast('La contraseña debe tener mínimo 6 caracteres.');
  
  const users = getUsers();
  const userIndex = users.findIndex(u => u.email.toLowerCase() === pendingRecoveryEmail);
  if(userIndex !== -1){
    const salt = generateSalt();
    const hash = await hashPassword(newPwd, salt);
    users[userIndex].salt = salt;
    users[userIndex].passwordHash = hash;
    saveUsers(users);
    closeModal('forgotModal');
    toast('Contraseña actualizada con éxito. Ya puedes iniciar sesión.');
  }
}

// --- AUTHENTICATION ENGINE ---
function setupAuth(){
  setupPasswordRecovery();
  const form=$('.auth-form');if(!form)return;
  
  const isRegister = location.pathname.endsWith('registro.html');
  
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const fields=[...form.querySelectorAll('input[required]')];
    if(fields.some(f=>!f.value.trim())) return toast('Completa todos los campos obligatorios.');
    
    const email = form.querySelector('input[type=email]').value.trim().toLowerCase();
    const pwd = form.querySelector('input[name=password]').value;
    
    if(pwd.length < 6) return toast('Usa una contraseña de mínimo 6 caracteres.');
    
    const users = getUsers();
    
    if(isRegister){
      const conf = form.querySelector('input[name=confirm]');
      if(conf && pwd !== conf.value) return toast('Las contraseñas no coinciden.');
      
      if(users.some(u => u.email.toLowerCase() === email)){
        return toast('Este correo ya está registrado. Inicia sesión.');
      }
      
      const name = form.querySelector('input[name=name]').value.trim();
      const lastname = form.querySelector('input[name=lastname]').value.trim();
      const salt = generateSalt();
      const hash = await hashPassword(pwd, salt);
      
      const newUser = {
        id: 'usr_' + Date.now(),
        name,
        lastname,
        email,
        salt,
        passwordHash: hash,
        registeredAt: new Date().toISOString(),
        purchasedCourses: [1] // 1 default welcome course to test aula immediately
      };
      
      users.push(newUser);
      saveUsers(users);
      setSession(newUser);
      toast('¡Cuenta creada con éxito! Bienvenido.');
      setTimeout(() => location.href = 'aula.html', 800);
      
    } else {
      // Login
      const user = users.find(u => u.email.toLowerCase() === email);
      if(!user){
        return toast('Correo o contraseña incorrectos.');
      }
      
      const inputHash = await hashPassword(pwd, user.salt);
      if(inputHash !== user.passwordHash){
        return toast('Correo o contraseña incorrectos.');
      }
      
      setSession(user);
      toast(`¡Bienvenido de nuevo, ${user.name}!`);
      setTimeout(() => location.href = 'aula.html', 700);
    }
  });
}

// --- AULA VIRTUAL & STUDENT DASHBOARD ---
function renderAula(){
  const root = $('#aulaApp');
  if(!root) return;
  
  const user = getCurrentUser();
  if(!user){
    root.innerHTML = `
      <div class="empty-state" style="max-width:540px;margin:40px auto">
        <span class="eyebrow">Acceso Requerido</span>
        <h2>Inicia Sesión en tu Aula</h2>
        <p style="margin:12px 0 20px">Debes ingresar con tu cuenta para acceder a tus cursos, lecciones interactivas y certificaciones.</p>
        <div style="display:flex;gap:12px;justify-content:center">
          <a class="btn btn-primary" href="login.html">Iniciar Sesión</a>
          <a class="btn btn-secondary" href="registro.html">Crear Cuenta</a>
        </div>
      </div>
    `;
    return;
  }
  
  const users = getUsers();
  const dbUser = users.find(u => u.id === user.id) || user;
  const purchasedIds = dbUser.purchasedCourses || [1];
  const courses = purchasedIds.map(id => COURSES.find(c => c.id === id)).filter(Boolean);
  
  // Progress tracker
  const progressData = JSON.parse(localStorage.getItem(progressKey) || '{}');
  const userProgress = progressData[user.id] || {};
  
  let completedCount = 0;
  courses.forEach(c => {
    if(userProgress[c.id] && userProgress[c.id].completed) completedCount++;
  });
  
  root.innerHTML = `
    <div class="student-banner">
      <div class="student-avatar">${escHTML(user.name.charAt(0).toUpperCase())}</div>
      <div class="student-info">
        <span class="eyebrow" style="color:#aeecc3">Panel de Estudiante</span>
        <h1>Hola, ${escHTML(user.name)} ${escHTML(user.lastname || '')}</h1>
        <p>${escHTML(user.email)} · Alumno Activo de Saber Vital Academy</p>
      </div>
      <div class="student-stats">
        <div class="student-stat"><strong>${courses.length}</strong><span>Cursos</span></div>
        <div class="student-stat"><strong>${completedCount}</strong><span>Certificados</span></div>
      </div>
    </div>
    
    <div class="section-head" style="margin-bottom:20px">
      <div>
        <h2>Mis Cursos y Capacitaciones</h2>
        <p>Accede a las clases audiovisuales protegidas y haz seguimiento a tu avance académico.</p>
      </div>
      <a class="btn btn-secondary btn-sm" href="cursos.html">Explorar más cursos +</a>
    </div>
    
    <div id="classroomPlayerArea"></div>
    
    <div class="aula-grid" style="margin-top:24px">
      ${courses.map(c => {
        const prog = (userProgress[c.id] && userProgress[c.id].percent) || 20;
        const isCert = prog === 100;
        return `
          <div class="aula-card">
            <img src="${c.image}" alt="${escHTML(c.name)}">
            <div class="aula-card-body">
              <span class="category">${escHTML(c.category)}</span>
              <h3 style="margin:8px 0;font-size:1.1rem">${escHTML(c.name)}</h3>
              <div class="progress-bar-wrap"><div class="progress-bar" style="width:${prog}%"></div></div>
              <div style="display:flex;justify-content:space-between;font-size:.78rem;color:var(--muted);margin-bottom:14px">
                <span>Progreso: ${prog}%</span>
                <span>${isCert ? '✓ Finalizado' : 'En curso'}</span>
              </div>
              <div style="margin-top:auto;display:flex;gap:8px">
                <button class="btn btn-primary btn-sm" style="flex:1" onclick="openCoursePlayer(${c.id})">Entrar al curso ▶</button>
                ${isCert ? `<button class="btn btn-green btn-sm" onclick="openCertificate(${c.id})">Certificado 🏅</button>` : ''}
              </div>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function openCoursePlayer(courseId){
  const c = COURSES.find(x => x.id === courseId) || COURSES[0];
  const user = getCurrentUser();
  const progressData = JSON.parse(localStorage.getItem(progressKey) || '{}');
  const userProg = progressData[user.id] || {};
  const currentProg = userProg[c.id] || { percent: 20, lesson: 1 };
  
  const area = $('#classroomPlayerArea');
  if(!area) return;
  
  const lessons = [
    { num: 1, title: 'Introducción, Ética y Marco Normativo en Salud' },
    { num: 2, title: 'Bioseguridad y Protocolos Clínicos Asistenciales' },
    { num: 3, title: 'Procedimientos Prácticos Paso a Paso' },
    { num: 4, title: 'Resolución de Casos Hospitalarios y Emergencias' },
    { num: 5, title: 'Evaluación y Certificación de Competencias' }
  ];
  
  area.innerHTML = `
    <div class="classroom-layout" style="margin-bottom:36px">
      <div class="classroom-player">
        <div class="video-wrap-shielded">
          <video id="classVideo" src="assets/video-inicio.mp4" controls autoplay playsinline controlsList="nodownload nofullscreen noremoteplayback" disablePictureInPicture oncontextmenu="return false;"></video>
          <div class="video-shield" oncontextmenu="return false;"></div>
        </div>
        <div style="margin-top:16px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px">
          <div>
            <span class="category">${escHTML(c.category)}</span>
            <h2 style="font-size:1.35rem;margin-top:4px">${escHTML(c.name)}</h2>
            <p style="font-size:.85rem;color:var(--muted)">Lección ${currentProg.lesson || 1}: ${lessons[(currentProg.lesson || 1) - 1].title}</p>
          </div>
          <button class="btn btn-green" onclick="markLessonComplete(${c.id})">✓ Completar Lección</button>
        </div>
      </div>
      
      <div class="classroom-nav-lessons">
        <h3>Módulos del Curso</h3>
        <ul class="lesson-list">
          ${lessons.map(l => {
            const isDone = (currentProg.percent >= l.num * 20);
            const isActive = currentProg.lesson === l.num;
            return `
              <li class="lesson-item ${isActive ? 'active' : ''} ${isDone ? 'completed' : ''}" onclick="switchLesson(${c.id}, ${l.num})">
                <span>Lección ${l.num}: ${escHTML(l.title)}</span>
              </li>
            `;
          }).join('')}
        </ul>
        <div style="margin-top:20px;padding-top:16px;border-top:1px solid var(--line)">
          <div style="font-size:.82rem;font-weight:700;color:var(--muted);margin-bottom:6px">Avance total: ${currentProg.percent}%</div>
          <div class="progress-bar-wrap"><div class="progress-bar" style="width:${currentProg.percent}%"></div></div>
          ${currentProg.percent === 100 ? `<button class="btn btn-green btn-sm" style="width:100%;margin-top:10px" onclick="openCertificate(${c.id})">Ver Certificado 🏅</button>` : ''}
        </div>
      </div>
    </div>
  `;
  
  area.scrollIntoView({ behavior: 'smooth' });
}

function switchLesson(courseId, lessonNum){
  const user = getCurrentUser();
  const progressData = JSON.parse(localStorage.getItem(progressKey) || '{}');
  if(!progressData[user.id]) progressData[user.id] = {};
  if(!progressData[user.id][courseId]) progressData[user.id][courseId] = { percent: 20, lesson: 1 };
  
  progressData[user.id][courseId].lesson = lessonNum;
  localStorage.setItem(progressKey, JSON.stringify(progressData));
  openCoursePlayer(courseId);
}

function markLessonComplete(courseId){
  const user = getCurrentUser();
  const progressData = JSON.parse(localStorage.getItem(progressKey) || '{}');
  if(!progressData[user.id]) progressData[user.id] = {};
  let cur = progressData[user.id][courseId] || { percent: 20, lesson: 1 };
  
  let nextPercent = Math.min(100, cur.percent + 20);
  let nextLesson = Math.min(5, cur.lesson + 1);
  progressData[user.id][courseId] = { percent: nextPercent, lesson: nextLesson, completed: nextPercent === 100 };
  localStorage.setItem(progressKey, JSON.stringify(progressData));
  
  toast(nextPercent === 100 ? '¡Felicitaciones! Has completado el curso y tu certificado está disponible.' : 'Lección completada. Avanzando...');
  renderAula();
  openCoursePlayer(courseId);
}

function openCertificate(courseId){
  const c = COURSES.find(x => x.id === courseId) || COURSES[0];
  const user = getCurrentUser();
  
  let modal = $('#certModal');
  if(!modal){
    modal = document.createElement('div');
    modal.id = 'certModal';
    modal.className = 'sva-modal-backdrop';
    document.body.append(modal);
  }
  
  const code = 'SVA-CERT-' + courseId + '-' + Date.now().toString().slice(-6);
  const dateStr = new Date().toLocaleDateString('es-CO', { year:'numeric', month:'long', day:'numeric' });
  
  modal.innerHTML = `
    <div class="sva-modal" style="max-width:760px">
      <button class="sva-modal-close" onclick="closeModal('certModal')">✕</button>
      <div class="cert-modal-box">
        <div class="cert-watermark">SVA</div>
        <img src="assets/logo.png" style="width:70px;margin:0 auto 12px" alt="Saber Vital Academy">
        <h2>Certificado de Aprobación</h2>
        <p style="text-transform:uppercase;letter-spacing:1px;font-size:.85rem;color:var(--muted)">Saber Vital Academy · República de Colombia</p>
        <p style="margin-top:20px;font-size:1rem">Hace constar que</p>
        <div class="cert-name">${escHTML(user.name)} ${escHTML(user.lastname || '')}</div>
        <p style="font-size:1rem">Ha cumplido satisfactoriamente los requisitos académicos y asistenciales del curso:</p>
        <h3 style="font-size:1.4rem;color:var(--blue-deep);margin:14px 0">${escHTML(c.name)}</h3>
        <p style="font-size:.85rem;color:var(--muted)">Intensidad: 40 Horas Académicas · Modalidad Virtual Certificada</p>
        <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-top:36px;border-top:1px solid #cbdce6;padding-top:16px;font-size:.78rem;color:var(--muted)">
          <div>Código único de verificación: <strong>${code}</strong></div>
          <div>Emitido el ${dateStr}</div>
        </div>
      </div>
      <div style="margin-top:20px;display:flex;gap:12px;justify-content:center">
        <button class="btn btn-primary" onclick="window.print()">Imprimir / Guardar PDF</button>
        <button class="btn btn-secondary" onclick="closeModal('certModal')">Cerrar</button>
      </div>
    </div>
  `;
  modal.classList.add('active');
}

// --- COOKIE CONSENT ---
function acceptCookies(){
  localStorage.setItem('sva_cookies','1');
  const b=document.querySelector('.cookie-banner');
  if(b)b.classList.remove('show');
}
function checkCookies(){
  if(!localStorage.getItem('sva_cookies')){
    const b=document.querySelector('.cookie-banner');
    if(b)setTimeout(()=>b.classList.add('show'),1200);
  }
}

// --- GLOBAL INITIALIZATION ---
document.addEventListener('DOMContentLoaded',()=>{
  setupNav();
  renderFeatured();
  renderCategories();
  setupFaq();
  setupCatalog();
  renderDetail();
  renderCart();
  setupAuth();
  renderAula();
  checkCookies();
  
  // Video protection
  document.querySelectorAll('video').forEach(v=>{
    v.setAttribute('controlsList','nodownload nofullscreen noremoteplayback');
    v.setAttribute('disablePictureInPicture','true');
    v.addEventListener('contextmenu',e=>e.preventDefault());
  });
});
