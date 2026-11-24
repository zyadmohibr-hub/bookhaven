import { store } from './store.js'
import * as dataModule from './data.js'

const categories = dataModule.categories ?? []
const app = document.querySelector('#app')
const page = document.body.dataset.page || 'home'

function iconSvg(name, size = 18) {
  const icons = {
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
    bag: '<path d="M5 8h14l1 13H4L5 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
    bagPlus: '<path d="M5 8h14l1 13H4L5 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/><path d="M12 12v5M9.5 14.5h5"/>',
    heart: '<path d="M20.8 8.7c0 5.2-8.8 10.3-8.8 10.3S3.2 13.9 3.2 8.7A4.7 4.7 0 0 1 12 6.5a4.7 4.7 0 0 1 8.8 2.2Z"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    book: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v17H6.5A2.5 2.5 0 0 1 4 17.5v-12Z"/><path d="M4 16.5A2.5 2.5 0 0 1 6.5 14H20"/>',
    home: '<path d="m3 10 9-7 9 7"/><path d="M5 9v12h14V9M9 21v-7h6v7"/>',
    orders: '<path d="M8 3h8l4 4v14H4V3h4Z"/><path d="M16 3v5h4M8 12h8M8 16h8"/>',
    admin: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M5 21v-2a7 7 0 0 1 14 0v2"/>',
    logout: '<path d="M10 17l5-5-5-5"/><path d="M15 12H3"/><path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6"/>' ,
    plus: '<path d="M12 5v14M5 12h14"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    truck: '<path d="M3 6h11v11H3z"/><path d="M14 10h4l3 3v4h-7z"/><circle cx="7.5" cy="19" r="1.5"/><circle cx="17.5" cy="19" r="1.5"/>',
    check: '<path d="m5 12 4 4L19 6"/>'
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || icons.book}</svg>`
}

if (!app || !store) {
  throw new Error('BookHaven could not initialize. Check the app element and store export.')
}

const money = (value) => `$${Number(value || 0).toFixed(2)}`

function escapeHTML(value = '') {
  return String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[char])
}

function getBooks() {
  return store.getBooks?.() ?? []
}

function getBook(id) {
  return store.getBook?.(id) ?? getBooks().find((book) => String(book.id) === String(id))
}

function getCartItems() {
  const items = store.getCartItems?.() ?? []

  return items.map((item) => {
    const book = item.book ?? getBook(item.bookId ?? item.id) ?? item
    return {
      ...book,
      quantity: Number(item.quantity ?? item.qty ?? 1),
    }
  })
}

function getCartCount() {
  if (store.getCartCount) return store.getCartCount()
  return getCartItems().reduce((sum, item) => sum + item.quantity, 0)
}

function getUser() {
  return store.getCurrentUser?.() ?? null
}

function showToast(message, type = 'success') {
  document.querySelector('.toast')?.remove()

  const toast = document.createElement('div')
  toast.className = `toast toast--${type}`
  toast.textContent = message
  document.body.appendChild(toast)

  requestAnimationFrame(() => toast.classList.add('is-visible'))
  window.setTimeout(() => {
    toast.classList.remove('is-visible')
    window.setTimeout(() => toast.remove(), 250)
  }, 2800)
}

function bookCover(book, extraClass = '') {
  const title = escapeHTML(book.title || 'Untitled')
  const author = escapeHTML(book.author || 'Unknown author')
  const category = String(book.category || '').toLowerCase()

  const palettes = {
    'personal growth': 'cover--sage',
    biography: 'cover--peach',
    'science fiction': 'cover--blue',
    business: 'cover--gold',
    'art & creativity': 'cover--rose',
    'literary fiction': 'cover--green',
  }

  const palette = palettes[category] || 'cover--sage'
  const initials = escapeHTML(
    String(book.title || 'B')
      .split(' ')
      .slice(0, 2)
      .map((word) => word[0] || '')
      .join('')
      .toUpperCase()
  )

  return `
    <div class="book-cover ${palette} ${extraClass}">
      <span class="book-cover__ornament" aria-hidden="true"></span>
      <span class="book-cover__brand">BOOKHAVEN</span>
      <span class="book-cover__initials">${initials}</span>
      <span class="book-cover__title">${title}</span>
      <span class="book-cover__author">${author}</span>
    </div>
  `
}

function bookCard(book) {
  const id = escapeHTML(book.id)
  const outOfStock = Number(book.stock ?? 0) <= 0

  return `
    <article class="book-card">
      <a class="book-card__cover-link" href="./book-details.html?id=${encodeURIComponent(book.id)}" aria-label="View ${escapeHTML(book.title)}">
        ${bookCover(book)}
      </a>
      <div class="book-card__info">
        <span class="eyebrow">${escapeHTML(book.category || 'Books')}</span>
        <h3><a href="./book-details.html?id=${encodeURIComponent(book.id)}">${escapeHTML(book.title)}</a></h3>
        <p class="book-card__author">by ${escapeHTML(book.author || 'Unknown author')}</p>
        <div class="book-card__bottom">
          <strong>${money(book.price)}</strong>
          <button
            class="icon-button add-button"
            type="button"
            data-action="add-to-cart"
            data-id="${id}"
            ${outOfStock ? 'disabled' : ''}
            aria-label="Add ${escapeHTML(book.title)} to cart"
            title="${outOfStock ? 'Out of stock' : 'Add to cart'}"
          >${outOfStock ? '—' : iconSvg('bagPlus', 18)}</button>
        </div>
      </div>
    </article>
  `
}

function header() {
  const activeLinks = {
    home: 'home',
    catalog: 'catalog',
  }

  const active = activeLinks[page]
  const user = getUser()

  return `
    <header class="site-header">
      <div class="container header-inner">
        <a class="brand" href="./index.html" aria-label="BookHaven home">
          <span class="brand__icon">B</span>
          <span>Book<span>Haven</span></span>
        </a>

        <nav class="main-nav" aria-label="Main navigation">
          <a class="${active === 'home' ? 'is-active' : ''}" href="./index.html"><span class="nav-icon">${iconSvg('home', 16)}</span><span>Home</span></a>
          <a class="${active === 'catalog' ? 'is-active' : ''}" href="./catalog.html"><span class="nav-icon">${iconSvg('book', 16)}</span><span>Explore Books</span></a>
          <a href="./orders.html"><span class="nav-icon">${iconSvg('orders', 16)}</span><span>My Orders</span></a>
          <a href="./admin.html"><span class="nav-icon">${iconSvg('admin', 16)}</span><span>Admin</span></a>
        </nav>

        <div class="header-actions">
          ${user ? `
            <div class="header-user">
              <a class="header-account" href="./orders.html">
                <span class="account-icon">${iconSvg('user', 16)}</span>
                <span>Hi, ${escapeHTML(user.name || 'Reader')}</span>
              </a>
              <button class="logout-button" type="button" data-action="logout" aria-label="Log out">
                ${iconSvg('logout', 16)}
                <span>Log out</span>
              </button>
            </div>
          ` : `
            <a class="header-account" href="./login.html">
              <span class="account-icon">${iconSvg('user', 16)}</span>
              <span>Sign in</span>
            </a>
          `}
          <a class="cart-link" href="./cart.html" aria-label="Shopping cart">
            <span class="cart-link__icon">${iconSvg("bag", 18)}</span>
            <span>Bag</span>
            <span class="cart-count">${getCartCount()}</span>
          </a>
          <button class="menu-toggle" type="button" aria-label="Open navigation" data-action="toggle-menu">${iconSvg("menu", 20)}</button>
        </div>
      </div>
    </header>
  `
}

function footer() {
  return `
    <footer class="site-footer">
      <div class="container footer-inner">
        <a class="brand brand--footer" href="./index.html">
          <span class="brand__icon">B</span>
          <span>Book<span>Haven</span></span>
        </a>
        <p>A World of Stories, One Book at a Time.</p>
        <div class="footer-links">
          <a href="./catalog.html">Explore</a>
          <a href="./orders.html">Your Orders</a>
          <a href="./admin.html">Admin Demo</a>
        </div>
        <small>© ${new Date().getFullYear()} BookHaven. Student project demo.</small>
      </div>
    </footer>
  `
}

function layout(content) {
  return `${header()}<main>${content}</main>${footer()}`
}

function sectionHeading(eyebrow, title, description = '') {
  return `
    <div class="section-heading">
      <span class="eyebrow">${escapeHTML(eyebrow)}</span>
      <h2>${title}</h2>
      ${description ? `<p>${escapeHTML(description)}</p>` : ''}
    </div>
  `
}

function renderHome() {
  const books = getBooks()
  const featured = books.slice(0, 4)
  const categoryList = Array.isArray(categories) ? categories : []

  return `
    <section class="hero">
      <div class="container hero-inner">
        <div class="hero-copy">
          <span class="eyebrow hero-eyebrow">A little escape, a lot of wonder</span>
          <h1>Find your next <em>great read.</em></h1>
          <p>Discover stories that inspire, ideas that stay with you, and books you'll want to keep close.</p>
          <div class="hero-actions">
            <a class="button button--primary" href="./catalog.html">Explore the collection <span>↗</span></a>
            <a class="text-link" href="./catalog.html">Browse all books</a>
          </div>
          <div class="hero-note">
            <span class="hero-note__stars">★★★★★</span>
            <span>A thoughtful collection for curious minds</span>
          </div>
        </div>
        <div class="hero-art" aria-label="A collection of books">
          <div class="hero-art__circle"></div>
          <div class="hero-art__book hero-art__book--one"><span>THE ART OF<br>BEGINNING</span></div>
          <div class="hero-art__book hero-art__book--two"><span>QUIET<br>WONDERS</span></div>
          <div class="hero-art__book hero-art__book--three"><span>GROW<br>WITHIN</span></div>
          <div class="hero-art__flower">✳</div>
          <div class="hero-art__caption">Stories worth keeping</div>
        </div>
      </div>
      <div class="hero-bottom-line"></div>
    </section>

    <section class="container home-categories">
      <div class="category-intro">
        <span class="eyebrow">Explore by mood</span>
        <h2>Follow your curiosity.</h2>
      </div>
      <div class="category-pills">
        ${categoryList.map((category) => {
          const name = typeof category === 'string' ? category : category.name
          return `<a class="category-pill" href="./catalog.html?category=${encodeURIComponent(name)}">${escapeHTML(name)}</a>`
        }).join('')}
      </div>
    </section>

    <section class="featured-section">
      <div class="container">
        ${sectionHeading('Handpicked for you', 'A few good <em>pages.</em>', 'Take a look at some of the stories waiting for you.')}
        <div class="book-grid">
          ${featured.length ? featured.map(bookCard).join('') : '<p class="empty-state">Books will appear here soon.</p>'}
        </div>
        <div class="section-cta">
          <a class="button button--outline" href="./catalog.html">View all books <span>→</span></a>
        </div>
      </div>
    </section>

    <section class="quote-section">
      <div class="container quote-inner">
        <span class="quote-mark">“</span>
        <blockquote>There is no friend as loyal as a book.</blockquote>
        <span class="quote-credit">A good reminder for every reader</span>
      </div>
    </section>
  `
}

function renderCatalog() {
  const url = new URL(window.location.href)
  const initialCategory = url.searchParams.get('category') || ''
  const books = getBooks()
  const categoryList = Array.isArray(categories) ? categories : []

  return `
    <section class="page-banner">
      <div class="container">
        <span class="eyebrow">The BookHaven collection</span>
        <h1>Explore <em>books.</em></h1>
        <p>Find something new to read, learn, and love.</p>
      </div>
    </section>

    <section class="container catalog-section">
      <form class="catalog-toolbar" id="catalog-filter">
        <label class="search-field">
          <span class="search-field__icon" aria-hidden="true">${iconSvg("search", 19)}</span>
          <input type="search" name="search" id="book-search" placeholder="Search by title or author..." aria-label="Search books">
        </label>
        <label class="select-field">
          <span class="sr-only">Category</span>
          <select name="category" id="category-filter">
            <option value="">All categories</option>
            ${categoryList.map((category) => {
              const name = typeof category === 'string' ? category : category.name
              return `<option value="${escapeHTML(name)}" ${name === initialCategory ? 'selected' : ''}>${escapeHTML(name)}</option>`
            }).join('')}
          </select>
        </label>
        <label class="select-field">
          <span class="sr-only">Sort books</span>
          <select name="sort" id="sort-books">
            <option value="featured">Featured</option>
            <option value="price-low">Price: low to high</option>
            <option value="price-high">Price: high to low</option>
            <option value="title">Title: A to Z</option>
          </select>
        </label>
        <button class="button button--primary" type="submit">Apply</button>
      </form>

      <div class="catalog-meta">
        <p id="catalog-count">${books.length} books to discover</p>
        <span>Made for your next quiet moment.</span>
      </div>

      <div class="book-grid" id="catalog-grid">
        ${books.length ? books.map(bookCard).join('') : '<p class="empty-state">No books available yet.</p>'}
      </div>
      <p class="empty-state is-hidden" id="catalog-empty">No books match your search. Try another title or category.</p>
    </section>
  `
}

function renderDetails() {
  const id = new URLSearchParams(window.location.search).get('id')
  const book = (id && getBook(id)) || getBooks()[0]

  if (!book) {
    return `
      <section class="container content-page">
        <div class="empty-state">
          <h1>No book found</h1>
          <p>There are no books to display right now.</p>
          <a class="button button--primary" href="./catalog.html">Back to collection</a>
        </div>
      </section>
    `
  }

  const stock = Number(book.stock ?? 0)

  return `
    <section class="container content-page">
      <a class="back-link" href="./catalog.html">← Back to collection</a>
      <div class="details-layout">
        <div class="details-cover">${bookCover(book, 'book-cover--large')}</div>
        <div class="details-copy">
          <span class="eyebrow">${escapeHTML(book.category || 'Book')}</span>
          <h1>${escapeHTML(book.title)}</h1>
          <p class="details-author">By ${escapeHTML(book.author || 'Unknown author')}</p>
          <p class="details-description">${escapeHTML(book.description || 'A lovely addition to your reading list. Explore this title and discover where its pages take you.')}</p>
          <div class="details-price">${money(book.price)}</div>
          <p class="stock-note ${stock > 0 ? 'stock-note--available' : 'stock-note--empty'}">
            ${stock > 0 ? `${stock} available in stock` : 'Currently out of stock'}
          </p>
          <button class="button button--primary" type="button" data-action="add-to-cart" data-id="${escapeHTML(book.id)}" ${stock <= 0 ? 'disabled' : ''}>
            Add to bag <span>↗</span>
          </button>
        </div>
      </div>
    </section>
  `
}

function renderCart() {
  const items = getCartItems()
  const subtotal = items.reduce((sum, item) => sum + Number(item.price || 0) * item.quantity, 0)
  const totals = store.getTotals?.() ?? {}
  const shipping = Number(totals.shipping ?? totals.shippingCost ?? (subtotal > 0 && subtotal < 50 ? 5.95 : 0))
  const total = Number(totals.total ?? totals.grandTotal ?? (subtotal + shipping))

  return `
    <section class="page-banner page-banner--compact">
      <div class="container">
        <span class="eyebrow">Your reading list</span>
        <h1>Your <em>bag.</em></h1>
      </div>
    </section>

    <section class="container content-page">
      ${items.length ? `
        <div class="cart-layout">
          <div class="cart-items">
            ${items.map((item) => `
              <article class="cart-item">
                <a class="cart-item__cover" href="./book-details.html?id=${encodeURIComponent(item.id)}">
                  ${bookCover(item)}
                </a>
                <div class="cart-item__info">
                  <span class="eyebrow">${escapeHTML(item.category || 'Book')}</span>
                  <h3><a href="./book-details.html?id=${encodeURIComponent(item.id)}">${escapeHTML(item.title)}</a></h3>
                  <p>by ${escapeHTML(item.author || 'Unknown author')}</p>
                  <strong>${money(item.price)}</strong>
                </div>
                <div class="cart-item__controls">
                  <div class="quantity-control">
                    <button type="button" data-action="decrease-quantity" data-id="${escapeHTML(item.id)}" aria-label="Decrease quantity">−</button>
                    <span>${item.quantity}</span>
                    <button type="button" data-action="increase-quantity" data-id="${escapeHTML(item.id)}" aria-label="Increase quantity">+</button>
                  </div>
                  <button class="remove-link" type="button" data-action="remove-from-cart" data-id="${escapeHTML(item.id)}">Remove</button>
                </div>
              </article>
            `).join('')}
          </div>

          <aside class="order-summary">
            <span class="eyebrow">A little summary</span>
            <h2>Order total</h2>
            <div class="summary-line"><span>Subtotal</span><strong>${money(subtotal)}</strong></div>
            <div class="summary-line"><span>Shipping</span><strong>${shipping === 0 ? 'Free' : money(shipping)}</strong></div>
            <div class="summary-total"><span>Total</span><strong>${money(total)}</strong></div>
            <p class="summary-note">${subtotal >= 50 ? 'Lovely! Your order qualifies for free shipping.' : 'Free shipping on orders of $50 or more.'}</p>
            <a class="button button--primary button--full" href="./checkout.html">Continue to checkout <span>→</span></a>
            <a class="continue-link" href="./catalog.html">Continue exploring</a>
          </aside>
        </div>
      ` : `
        <div class="empty-state empty-cart">
          <span class="empty-cart__icon">${iconSvg("heart", 42)}</span>
          <h2>Your bag is waiting for a story.</h2>
          <p>Looks like you haven't added any books yet.</p>
          <a class="button button--primary" href="./catalog.html">Find a book</a>
        </div>
      `}
    </section>
  `
}

function renderCheckout() {
  const items = getCartItems()

  if (!items.length) {
    return `
      <section class="container content-page">
        <div class="empty-state">
          <h1>Your bag is empty.</h1>
          <p>Add a book before continuing to checkout.</p>
          <a class="button button--primary" href="./catalog.html">Explore books</a>
        </div>
      </section>
    `
  }

  const subtotal = items.reduce((sum, item) => sum + Number(item.price || 0) * item.quantity, 0)
  const totals = store.getTotals?.() ?? {}
  const shipping = Number(totals.shipping ?? totals.shippingCost ?? (subtotal > 0 && subtotal < 50 ? 5.95 : 0))
  const total = Number(totals.total ?? totals.grandTotal ?? (subtotal + shipping))

  return `
    <section class="page-banner page-banner--compact">
      <div class="container">
        <span class="eyebrow">Almost there</span>
        <h1>Checkout <em>details.</em></h1>
      </div>
    </section>

    <section class="container content-page">
      <div class="checkout-layout">
        <form class="form-card" id="checkout-form">
          <span class="eyebrow">Delivery information</span>
          <h2>Where should we send your books?</h2>
          <label class="form-label">Full name
            <input type="text" name="name" required minlength="2" placeholder="Your full name">
          </label>
          <label class="form-label">Email address
            <input type="email" name="email" required placeholder="you@example.com">
          </label>
          <label class="form-label">Delivery address
            <textarea name="address" required rows="3" placeholder="Street, city, and delivery details"></textarea>
          </label>
          <div class="demo-notice">
            <strong>Demo checkout</strong>
            <p>This student project creates a sample order only. No payment will be collected.</p>
          </div>
          <button class="button button--primary button--full" type="submit">Place demo order <span>→</span></button>
        </form>

        <aside class="order-summary">
          <span class="eyebrow">Your selection</span>
          <h2>Order summary</h2>
          ${items.map((item) => `
            <div class="summary-book">
              <span>${escapeHTML(item.title)} <small>× ${item.quantity}</small></span>
              <strong>${money(Number(item.price || 0) * item.quantity)}</strong>
            </div>
          `).join('')}
          <div class="summary-line"><span>Subtotal</span><strong>${money(subtotal)}</strong></div>
          <div class="summary-line"><span>Shipping</span><strong>${shipping === 0 ? 'Free' : money(shipping)}</strong></div>
          <div class="summary-total"><span>Total</span><strong>${money(total)}</strong></div>
        </aside>
      </div>
    </section>
  `
}

function renderOrders() {
  const orders = store.getOrders?.() ?? []

  return `
    <section class="page-banner page-banner--compact">
      <div class="container">
        <span class="eyebrow">Your BookHaven activity</span>
        <h1>My <em>orders.</em></h1>
      </div>
    </section>

    <section class="container content-page">
      ${orders.length ? `
        <div class="orders-list">
          ${orders.slice().reverse().map((order) => {
            const orderId = order.id ?? order.orderId
            const items = order.items ?? order.orderItems ?? []
            const status = order.status || 'Processing'
            return `
              <article class="order-card">
                <div class="order-card__top">
                  <div>
                    <span class="eyebrow">Order ${escapeHTML(orderId)}</span>
                    <h2>${escapeHTML(order.customerName || order.name || 'BookHaven customer')}</h2>
                  </div>
                  <span class="status status--${escapeHTML(status.toLowerCase())}">${escapeHTML(status)}</span>
                </div>
                <div class="order-card__items">
                  ${items.map((item) => {
                    const book = item.book ?? item
                    return `<span>${escapeHTML(book.title || item.title || 'Book')} × ${Number(item.quantity || 1)}</span>`
                  }).join('')}
                </div>
                <div class="order-card__bottom">
                  <span>${order.createdAt ? escapeHTML(new Date(order.createdAt).toLocaleDateString()) : 'Order placed'}</span>
                  <strong>${money(order.total ?? order.totalAmount ?? order.amount)}</strong>
                  ${status === 'Processing' ? `<button class="remove-link" type="button" data-action="cancel-order" data-id="${escapeHTML(orderId)}">Cancel order</button>` : ''}
                </div>
              </article>
            `
          }).join('')}
        </div>
      ` : `
        <div class="empty-state">
          <h2>No orders just yet.</h2>
          <p>Your next favorite book could be one click away.</p>
          <a class="button button--primary" href="./catalog.html">Explore the collection</a>
        </div>
      `}
    </section>
  `
}

function renderAdmin() {
  const books = getBooks()
  const orders = store.getOrders?.() ?? []
  const totalStock = books.reduce((sum, book) => sum + Number(book.stock || 0), 0)

  return `
    <section class="page-banner page-banner--compact">
      <div class="container">
        <span class="eyebrow">BookHaven workspace</span>
        <h1>Admin <em>dashboard.</em></h1>
        <p>Manage the demo bookstore collection and review orders.</p>
      </div>
    </section>

    <section class="container content-page admin-page">
      <div class="admin-notice">
        <strong>Demo admin area</strong>
        <span>This is a frontend project demonstration, not a secured admin system.</span>
      </div>

      <div class="admin-stats">
        <div class="stat-card"><span>Total books</span><strong>${books.length}</strong></div>
        <div class="stat-card"><span>Units in stock</span><strong>${totalStock}</strong></div>
        <div class="stat-card"><span>Total orders</span><strong>${orders.length}</strong></div>
      </div>

      <div class="admin-grid">
        <section class="form-card">
          <span class="eyebrow">Add to the shelves</span>
          <h2>Add a new book</h2>
          <form id="add-book-form">
            <label class="form-label">Book title
              <input type="text" name="title" required placeholder="Book title">
            </label>
            <label class="form-label">Author
              <input type="text" name="author" required placeholder="Author name">
            </label>
            <label class="form-label">Category
              <select name="category" required>
                <option value="">Choose a category</option>
                ${(Array.isArray(categories) ? categories : []).map((category) => {
                  const name = typeof category === 'string' ? category : category.name
                  return `<option value="${escapeHTML(name)}">${escapeHTML(name)}</option>`
                }).join('')}
              </select>
            </label>
            <div class="form-row">
              <label class="form-label">Price ($)
                <input type="number" name="price" required min="0.01" step="0.01" placeholder="19.99">
              </label>
              <label class="form-label">Stock
                <input type="number" name="stock" required min="0" step="1" value="5">
              </label>
            </div>
            <label class="form-label">Description
              <textarea name="description" rows="3" placeholder="A short description..."></textarea>
            </label>
            <button class="button button--primary button--full" type="submit">Add book <span>+</span></button>
          </form>
        </section>

        <section class="admin-panel">
          <div class="panel-heading">
            <div><span class="eyebrow">Current collection</span><h2>Manage books</h2></div>
          </div>
          <div class="admin-book-list">
            ${books.map((book) => `
              <div class="admin-book-row">
                <div class="admin-book-row__info">
                  <strong>${escapeHTML(book.title)}</strong>
                  <span>${escapeHTML(book.author || 'Unknown author')} · ${money(book.price)}</span>
                </div>
                <label class="stock-edit">
                  <span>Stock</span>
                  <input type="number" min="0" value="${Number(book.stock || 0)}" data-stock-input="${escapeHTML(book.id)}" aria-label="Stock for ${escapeHTML(book.title)}">
                </label>
                <button class="small-button" type="button" data-action="save-stock" data-id="${escapeHTML(book.id)}">Save</button>
                <button class="small-button small-button--danger" type="button" data-action="delete-book" data-id="${escapeHTML(book.id)}">Delete</button>
              </div>
            `).join('') || '<p class="empty-state">No books have been added.</p>'}
          </div>
        </section>
      </div>

      <section class="admin-panel admin-orders">
        <div class="panel-heading">
          <div><span class="eyebrow">Recent activity</span><h2>Manage orders</h2></div>
        </div>
        ${orders.length ? orders.slice().reverse().map((order) => {
          const orderId = order.id ?? order.orderId
          return `
            <div class="admin-order-row">
              <div>
                <strong>${escapeHTML(orderId)}</strong>
                <span>${escapeHTML(order.customerName || order.name || 'Customer')} · ${money(order.total ?? order.totalAmount)}</span>
              </div>
              <span class="status status--${escapeHTML((order.status || 'Processing').toLowerCase())}">${escapeHTML(order.status || 'Processing')}</span>
              <select data-order-status="${escapeHTML(orderId)}" aria-label="Update order status">
                <option value="Processing" ${order.status === 'Processing' ? 'selected' : ''}>Processing</option>
                <option value="Shipped" ${order.status === 'Shipped' ? 'selected' : ''}>Shipped</option>
                <option value="Delivered" ${order.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
              </select>
              <button class="small-button" type="button" data-action="save-order-status" data-id="${escapeHTML(orderId)}">Update</button>
            </div>
          `
        }).join('') : '<p class="empty-state">No orders to review yet.</p>'}
      </section>
    </section>
  `
}

function renderLogin() {
  return `
    <section class="auth-section">
      <div class="auth-card">
        <a class="brand auth-brand" href="./index.html"><span class="brand__icon">B</span><span>Book<span>Haven</span></span></a>
        <span class="eyebrow">Welcome back</span>
        <h1>Good to see <em>you.</em></h1>
        <p>Enter your email to start this demo session.</p>
        <form id="login-form">
          <label class="form-label">Your name
            <input type="text" name="name" required minlength="2" placeholder="Your name">
          </label>
          <label class="form-label">Email address
            <input type="email" name="email" required placeholder="you@example.com">
          </label>
          <label class="form-label">Demo role
            <select name="role">
              <option value="customer">Customer</option>
              <option value="admin">Admin demo</option>
            </select>
          </label>
          <button class="button button--primary button--full" type="submit">Continue <span>→</span></button>
        </form>
        <p class="auth-switch">New to BookHaven? <a href="./register.html">Create an account</a></p>
        <p class="auth-disclaimer">Demo only. This page does not provide secure authentication or save passwords.</p>
      </div>
    </section>
  `
}

function renderRegister() {
  return `
    <section class="auth-section">
      <div class="auth-card">
        <a class="brand auth-brand" href="./index.html"><span class="brand__icon">B</span><span>Book<span>Haven</span></span></a>
        <span class="eyebrow">Join our reading corner</span>
        <h1>Make room for <em>stories.</em></h1>
        <p>Create a demo reader profile to explore BookHaven.</p>
        <form id="register-form">
          <label class="form-label">Your name
            <input type="text" name="name" required minlength="2" placeholder="Your name">
          </label>
          <label class="form-label">Email address
            <input type="email" name="email" required placeholder="you@example.com">
          </label>
          <button class="button button--primary button--full" type="submit">Create demo profile <span>→</span></button>
        </form>
        <p class="auth-switch">Already have a demo profile? <a href="./login.html">Sign in</a></p>
        <p class="auth-disclaimer">Demo only. No password is collected or stored.</p>
      </div>
    </section>
  `
}

const renderers = {
  home: renderHome,
  catalog: renderCatalog,
  details: renderDetails,
  cart: renderCart,
  checkout: renderCheckout,
  orders: renderOrders,
  admin: renderAdmin,
  login: renderLogin,
  register: renderRegister,
}

function render() {
  const renderPage = renderers[page] || renderHome
  app.innerHTML = layout(renderPage())
}

function updateCatalogResults() {
  const grid = document.querySelector('#catalog-grid')
  const count = document.querySelector('#catalog-count')
  const empty = document.querySelector('#catalog-empty')
  if (!grid) return

  const search = document.querySelector('#book-search')?.value.trim().toLowerCase() || ''
  const category = document.querySelector('#category-filter')?.value || ''
  const sort = document.querySelector('#sort-books')?.value || 'featured'

  let books = getBooks().filter((book) => {
    const matchesSearch = `${book.title || ''} ${book.author || ''}`.toLowerCase().includes(search)
    const matchesCategory = !category || book.category === category
    return matchesSearch && matchesCategory
  })

  if (sort === 'price-low') books.sort((a, b) => Number(a.price) - Number(b.price))
  if (sort === 'price-high') books.sort((a, b) => Number(b.price) - Number(a.price))
  if (sort === 'title') books.sort((a, b) => String(a.title).localeCompare(String(b.title)))

  grid.innerHTML = books.map(bookCard).join('')
  count.textContent = `${books.length} ${books.length === 1 ? 'book' : 'books'} found`
  empty.classList.toggle('is-hidden', books.length > 0)
}

app.addEventListener('click', (event) => {
  const button = event.target.closest('[data-action]')
  if (!button) return

  const action = button.dataset.action
  const id = button.dataset.id

  try {
    if (action === 'add-to-cart') {
      store.addToCart(id)
      render()
      showToast('Added to your bag.')
    }

    if (action === 'increase-quantity' || action === 'decrease-quantity') {
      const item = getCartItems().find((entry) => String(entry.id) === String(id))
      if (!item) return
      const nextQuantity = item.quantity + (action === 'increase-quantity' ? 1 : -1)
      store.updateCartItem(id, nextQuantity)
      render()
    }

    if (action === 'remove-from-cart') {
      store.removeFromCart(id)
      render()
      showToast('Book removed from your bag.')
    }

    if (action === 'cancel-order') {
      const confirmed = window.confirm('Cancel this order?')
      if (!confirmed) return
      const result = store.cancelOrder(id)
      render()
      showToast(result === false ? 'This order could not be cancelled.' : 'Order cancelled.')
    }

    if (action === 'delete-book') {
      const confirmed = window.confirm('Remove this book from the collection?')
      if (!confirmed) return
      store.deleteBook(id)
      render()
      showToast('Book removed from the collection.')
    }

    if (action === 'save-stock') {
      const input = document.querySelector(`[data-stock-input="${CSS.escape(id)}"]`)
      const stock = Number(input?.value)
      if (!Number.isInteger(stock) || stock < 0) {
        showToast('Enter a valid stock quantity.', 'error')
        return
      }
      store.updateBook(id, { stock })
      render()
      showToast('Stock updated.')
    }

    if (action === 'save-order-status') {
      const select = document.querySelector(`[data-order-status="${CSS.escape(id)}"]`)
      if (!select) return
      store.updateOrderStatus(id, select.value)
      render()
      showToast('Order status updated.')
    }

    if (action === 'logout') {
      store.logout()
      window.location.href = './index.html'
      return
    }
    if (action === 'toggle-menu') {
      document.querySelector('.main-nav')?.classList.toggle('is-open')
    }
  } catch (error) {
    console.error(error)
    showToast(error.message || 'Something went wrong. Please try again.', 'error')
  }
})

app.addEventListener('input', (event) => {
  if (page === 'catalog' && ['book-search'].includes(event.target.id)) {
    updateCatalogResults()
  }
})

app.addEventListener('change', (event) => {
  if (page === 'catalog' && ['category-filter', 'sort-books'].includes(event.target.id)) {
    updateCatalogResults()
  }
})

app.addEventListener('submit', (event) => {
  const form = event.target
  const formData = new FormData(form)

  try {
    if (form.id === 'catalog-filter') {
      event.preventDefault()
      updateCatalogResults()
    }

    if (form.id === 'checkout-form') {
      event.preventDefault()
      const customer = {
        customerName: String(formData.get('name') || '').trim(),
        name: String(formData.get('name') || '').trim(),
        email: String(formData.get('email') || '').trim(),
        address: String(formData.get('address') || '').trim(),
      }

      if (!customer.customerName || !customer.email || !customer.address) {
        showToast('Please complete all delivery details.', 'error')
        return
      }

      const result = store.createOrder(customer)
      if (result === false || result?.success === false) {
        showToast(result?.message || 'We could not create your order. Check stock and try again.', 'error')
        return
      }

      window.location.href = './orders.html'
    }

    if (form.id === 'add-book-form') {
      event.preventDefault()
      const book = {
        title: String(formData.get('title') || '').trim(),
        author: String(formData.get('author') || '').trim(),
        category: String(formData.get('category') || ''),
        price: Number(formData.get('price')),
        stock: Number(formData.get('stock')),
        description: String(formData.get('description') || '').trim(),
      }

      if (!book.title || !book.author || !book.category || !Number.isFinite(book.price) || book.price <= 0 || !Number.isInteger(book.stock) || book.stock < 0) {
        showToast('Please check the book details.', 'error')
        return
      }

      store.addBook(book)
      render()
      showToast('New book added to the collection.')
    }

    if (form.id === 'login-form' || form.id === 'register-form') {
      event.preventDefault()
      const name = String(formData.get('name') || '').trim()
      const email = String(formData.get('email') || '').trim()
      const role = form.id === 'login-form' ? String(formData.get('role') || 'customer') : 'customer'

      if (name.length < 2 || !email.includes('@')) {
        showToast('Enter a valid name and email address.', 'error')
        return
      }

      store.setCurrentUser({ name, email, role })
      window.location.href = role === 'admin' ? './admin.html' : './index.html'
    }
  } catch (error) {
    console.error(error)
    showToast(error.message || 'Something went wrong. Please try again.', 'error')
  }
})

render()
