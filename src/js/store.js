import { seedBooks } from './data.js'

const KEYS = {
  books: 'bookhaven.books.v1',
  cart: 'bookhaven.cart.v1',
  orders: 'bookhaven.orders.v1',
  user: 'bookhaven.currentUser.v1'
}

function read(key, fallback) {
  try {
    const value = localStorage.getItem(key)
    return value === null ? fallback : JSON.parse(value)
  } catch {
    return fallback
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch (error) {
    console.error(`Could not save ${key}:`, error)
    return false
  }
}

function makeId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function getBooks() {
  const saved = read(KEYS.books, null)

  if (Array.isArray(saved)) return saved

  const initialBooks = JSON.parse(JSON.stringify(seedBooks))
  write(KEYS.books, initialBooks)
  return initialBooks
}

function getCart() {
  const cart = read(KEYS.cart, [])
  return Array.isArray(cart) ? cart : []
}

function getOrders() {
  const orders = read(KEYS.orders, [])
  return Array.isArray(orders) ? orders : []
}

function getCartItems() {
  const books = getBooks()

  return getCart()
    .map((item) => {
      const book = books.find((entry) => entry.id === item.bookId)
      if (!book) return null

      const quantity = Math.max(1, Number(item.quantity) || 1)

      return {
        book,
        bookId: book.id,
        quantity,
        lineTotal: book.price * quantity
      }
    })
    .filter(Boolean)
}

function getCartCount() {
  return getCartItems().reduce((sum, item) => sum + item.quantity, 0)
}

function addToCart(bookId, quantity = 1) {
  const books = getBooks()
  const book = books.find((entry) => entry.id === bookId)

  if (!book) return { ok: false, message: 'This book could not be found.' }

  const amount = Math.max(1, Math.floor(Number(quantity) || 1))

  if (book.stock < 1) {
    return { ok: false, message: 'This book is currently out of stock.' }
  }

  const cart = getCart()
  const existing = cart.find((item) => item.bookId === bookId)
  const nextQuantity = (existing?.quantity || 0) + amount

  if (nextQuantity > book.stock) {
    return {
      ok: false,
      message: `Only ${book.stock} copies are currently available.`
    }
  }

  if (existing) {
    existing.quantity = nextQuantity
  } else {
    cart.push({ bookId, quantity: amount })
  }

  write(KEYS.cart, cart)
  return { ok: true, message: `${book.title} added to your cart.` }
}

function updateCartItem(bookId, quantity) {
  const amount = Math.floor(Number(quantity))
  const cart = getCart()

  if (!Number.isFinite(amount) || amount < 1) {
    return removeFromCart(bookId)
  }

  const book = getBooks().find((entry) => entry.id === bookId)
  if (!book) return { ok: false, message: 'This book could not be found.' }

  if (amount > book.stock) {
    return {
      ok: false,
      message: `Only ${book.stock} copies are currently available.`
    }
  }

  const item = cart.find((entry) => entry.bookId === bookId)
  if (!item) return { ok: false, message: 'This item is not in your cart.' }

  item.quantity = amount
  write(KEYS.cart, cart)
  return { ok: true, message: 'Cart updated.' }
}

function removeFromCart(bookId) {
  const cart = getCart().filter((item) => item.bookId !== bookId)
  write(KEYS.cart, cart)
  return { ok: true, message: 'Book removed from your cart.' }
}

function clearCart() {
  write(KEYS.cart, [])
}

function getTotals() {
  const items = getCartItems()
  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0)
  const shipping = subtotal === 0 || subtotal >= 50 ? 0 : 5.95

  return {
    count: items.reduce((sum, item) => sum + item.quantity, 0),
    subtotal,
    shipping,
    total: subtotal + shipping,
    freeShippingRemaining: Math.max(0, 50 - subtotal)
  }
}

function createOrder(details) {
  const items = getCartItems()

  if (items.length === 0) {
    return { ok: false, message: 'Your cart is empty.' }
  }

  const books = getBooks()

  for (const item of items) {
    const currentBook = books.find((book) => book.id === item.bookId)

    if (!currentBook || currentBook.stock < item.quantity) {
      return {
        ok: false,
        message: `Not enough stock for ${item.book.title}. Please review your cart.`
      }
    }
  }

  const totals = getTotals()
  const order = {
    id: `BH-${Date.now().toString().slice(-8)}`,
    createdAt: new Date().toISOString(),
    status: 'Processing',
    customer: { ...details },
    items: items.map((item) => ({
      bookId: item.bookId,
      title: item.book.title,
      author: item.book.author,
      price: item.book.price,
      quantity: item.quantity,
      coverColor: item.book.coverColor
    })),
    subtotal: totals.subtotal,
    shipping: totals.shipping,
    total: totals.total
  }

  for (const item of items) {
    const book = books.find((entry) => entry.id === item.bookId)
    book.stock -= item.quantity
  }

  write(KEYS.books, books)
  write(KEYS.orders, [order, ...getOrders()])
  clearCart()

  return { ok: true, message: 'Your order has been placed.', order }
}

function cancelOrder(orderId) {
  const orders = getOrders()
  const order = orders.find((entry) => entry.id === orderId)

  if (!order) return { ok: false, message: 'Order not found.' }

  if (order.status !== 'Processing') {
    return {
      ok: false,
      message: 'Only processing orders can be cancelled.'
    }
  }

  const books = getBooks()

  for (const item of order.items) {
    const book = books.find((entry) => entry.id === item.bookId)
    if (book) book.stock += item.quantity
  }

  order.status = 'Cancelled'
  write(KEYS.books, books)
  write(KEYS.orders, orders)

  return { ok: true, message: 'Order cancelled and stock restored.' }
}

function updateOrderStatus(orderId, status) {
  const allowed = ['Processing', 'Shipped', 'Delivered', 'Cancelled']
  if (!allowed.includes(status)) {
    return { ok: false, message: 'Invalid order status.' }
  }

  const orders = getOrders()
  const order = orders.find((entry) => entry.id === orderId)

  if (!order) return { ok: false, message: 'Order not found.' }

  order.status = status
  write(KEYS.orders, orders)
  return { ok: true, message: 'Order status updated.' }
}

function addBook(bookDetails) {
  const title = String(bookDetails.title || '').trim()
  const author = String(bookDetails.author || '').trim()

  if (!title || !author) {
    return { ok: false, message: 'Title and author are required.' }
  }

  const books = getBooks()
  const book = {
    id: makeId('book'),
    title,
    author,
    category: bookDetails.category || 'Literary Fiction',
    price: Math.max(0, Number(bookDetails.price) || 0),
    stock: Math.max(0, Math.floor(Number(bookDetails.stock) || 0)),
    rating: 0,
    reviews: 0,
    badge: '',
    coverColor: bookDetails.coverColor || '#687d72',
    coverText: title.toUpperCase(),
    featured: false,
    description: bookDetails.description || 'Discover this title at BookHaven.'
  }

  books.push(book)
  write(KEYS.books, books)
  return { ok: true, message: 'Book added to the catalog.', book }
}

function updateBook(bookId, changes) {
  const books = getBooks()
  const index = books.findIndex((book) => book.id === bookId)

  if (index === -1) return { ok: false, message: 'Book not found.' }

  const current = books[index]
  books[index] = {
    ...current,
    ...changes,
    id: current.id,
    price: changes.price === undefined ? current.price : Math.max(0, Number(changes.price) || 0),
    stock: changes.stock === undefined ? current.stock : Math.max(0, Math.floor(Number(changes.stock) || 0))
  }

  write(KEYS.books, books)
  return { ok: true, message: 'Book details updated.' }
}

function deleteBook(bookId) {
  const books = getBooks().filter((book) => book.id !== bookId)
  const cart = getCart().filter((item) => item.bookId !== bookId)

  write(KEYS.books, books)
  write(KEYS.cart, cart)
  return { ok: true, message: 'Book removed from the catalog.' }
}

function getCurrentUser() {
  return read(KEYS.user, null)
}

function setCurrentUser(user) {
  return write(KEYS.user, user)
}

function logout() {
  try {
    localStorage.removeItem(KEYS.user)
  } catch (error) {
    console.error('Could not clear the current user:', error)
  }
}

export const store = {
  getBooks,
  getBook: (id) => getBooks().find((book) => book.id === id) || null,
  getCart,
  getCartItems,
  getCartCount,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  getTotals,
  getOrders,
  createOrder,
  cancelOrder,
  updateOrderStatus,
  addBook,
  updateBook,
  deleteBook,
  getCurrentUser,
  setCurrentUser,
  logout
}
