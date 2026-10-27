import { createOptimizedPicture } from '../../scripts/aem.js';

const PAGE_SIZE = 12;

/**
 * Read the data source path authored in the block's first cell.
 * Authors write the published spreadsheet path, e.g. `/products.json`.
 */
function readSourcePath(block) {
  const link = block.querySelector('a[href]');
  if (link) return link.getAttribute('href');
  const text = block.textContent.trim();
  return text || null;
}

/** Fetch the EDS sheet JSON and return its rows. */
async function fetchProducts(path) {
  try {
    const resp = await fetch(path);
    if (!resp.ok) return [];
    const json = await resp.json();
    // A single-sheet endpoint exposes `data`; a multi-sheet one nests under a sheet name.
    if (Array.isArray(json.data)) return json.data;
    const firstSheet = Object.values(json).find((v) => v && Array.isArray(v.data));
    return firstSheet ? firstSheet.data : [];
  } catch (e) {
    return [];
  }
}

/** Placeholder rows so the block still renders before the sheet exists. */
function sampleProducts(count = 24) {
  return Array.from({ length: count }, (_, i) => ({
    image: '',
    title: `Sample Product ${i + 1}`,
    company: `Company ${String.fromCharCode(65 + (i % 6))}`,
    price: `$${(80 + i * 5).toFixed(2)}`,
    salePrice: i % 2 === 0 ? `$${(60 + i * 5).toFixed(2)}` : '',
  }));
}

/** Format a value that may already include a currency symbol. */
function money(value) {
  if (value === undefined || value === null || value === '') return '';
  const str = String(value).trim();
  if (/^[^\d]*[\d]/.test(str) && /[^\d.,\s]/.test(str)) return str; // already has a symbol
  const num = Number(str.replace(/[^\d.-]/g, ''));
  return Number.isFinite(num) ? `$${num.toFixed(2)}` : str;
}

function buildCard(product) {
  const li = document.createElement('li');
  li.className = 'products-card';

  // Image
  const imageWrap = document.createElement('div');
  imageWrap.className = 'products-card-image';
  if (product.image) {
    const picture = createOptimizedPicture(product.image, product.title || '', false, [{ width: '750' }]);
    imageWrap.append(picture);
  }
  li.append(imageWrap);

  // Body
  const body = document.createElement('div');
  body.className = 'products-card-body';

  if (product.company) {
    const company = document.createElement('p');
    company.className = 'products-card-company';
    company.textContent = product.company;
    body.append(company);
  }

  if (product.title) {
    const title = document.createElement('h3');
    title.className = 'products-card-title';
    title.textContent = product.title;
    body.append(title);
  }

  const priceRow = document.createElement('div');
  priceRow.className = 'products-card-prices';
  const sale = money(product.salePrice);
  const regular = money(product.price);
  if (sale) {
    const saleEl = document.createElement('span');
    saleEl.className = 'products-card-sale';
    saleEl.textContent = sale;
    priceRow.append(saleEl);
    if (regular) {
      const regEl = document.createElement('span');
      regEl.className = 'products-card-regular products-card-strike';
      regEl.textContent = regular;
      priceRow.append(regEl);
    }
  } else if (regular) {
    const regEl = document.createElement('span');
    regEl.className = 'products-card-regular';
    regEl.textContent = regular;
    priceRow.append(regEl);
  }
  body.append(priceRow);

  li.append(body);
  return li;
}

export default async function decorate(block) {
  const path = readSourcePath(block);
  block.textContent = '';

  let products = path ? await fetchProducts(path) : [];
  if (!products.length) products = sampleProducts();

  const total = products.length;
  let currentPage = 1;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Toolbar: result count (left) + dummy sort (right)
  const toolbar = document.createElement('div');
  toolbar.className = 'products-toolbar';

  const resultCount = document.createElement('p');
  resultCount.className = 'products-result-count';

  const sort = document.createElement('div');
  sort.className = 'products-sort';
  const sortSelect = document.createElement('select');
  sortSelect.className = 'products-sort-select';
  sortSelect.setAttribute('aria-label', 'Sort products');
  ['Sort by: Featured', 'Price: Low to High', 'Price: High to Low', 'Name: A–Z'].forEach((label) => {
    const opt = document.createElement('option');
    opt.textContent = label;
    sortSelect.append(opt);
  });
  sort.append(sortSelect);

  toolbar.append(resultCount, sort);

  const grid = document.createElement('ul');
  grid.className = 'products-grid';

  const pagination = document.createElement('nav');
  pagination.className = 'products-pagination';
  pagination.setAttribute('aria-label', 'Product pages');

  function render() {
    const start = (currentPage - 1) * PAGE_SIZE;
    const end = Math.min(start + PAGE_SIZE, total);
    const pageItems = products.slice(start, end);

    resultCount.textContent = total
      ? `Showing ${start + 1}–${end} of ${total} results`
      : 'No products found';

    grid.replaceChildren(...pageItems.map(buildCard));

    pagination.replaceChildren();
    if (pageCount <= 1) return;

    const addButton = (label, page, { disabled = false, current = false } = {}) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'products-page-btn';
      btn.textContent = label;
      if (current) {
        btn.classList.add('is-current');
        btn.setAttribute('aria-current', 'page');
      }
      if (disabled) btn.disabled = true;
      btn.addEventListener('click', () => {
        currentPage = page;
        render();
        block.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
      pagination.append(btn);
    };

    addButton('‹ Prev', currentPage - 1, { disabled: currentPage === 1 });
    for (let p = 1; p <= pageCount; p += 1) {
      addButton(String(p), p, { current: p === currentPage });
    }
    addButton('Next ›', currentPage + 1, { disabled: currentPage === pageCount });
  }

  render();
  block.append(toolbar, grid, pagination);
}
