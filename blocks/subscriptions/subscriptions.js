export default function decorate(block) {
  const rows = [...block.children];
  let titleText = null;

  // Evaluate Row 1 for an optional section title
  if (rows.length > 0) {
    const firstRow = rows[0];
    const firstCell = firstRow.firstElementChild;

    if (firstCell) {
      const textContent = firstCell.textContent.trim();
      if (textContent !== '') {
        titleText = textContent;
      }
      firstRow.remove();
      rows.shift();
    }
  }

  // Prepend section header if title exists
  if (titleText) {
    const titleDiv = document.createElement('div');
    titleDiv.className = 'subscriptions-header';
    const h2 = document.createElement('h2');
    h2.textContent = titleText;
    titleDiv.append(h2);
    block.prepend(titleDiv);
  }

  // Process remaining rows into subscription columns/cards
  const ul = document.createElement('ul');
  ul.className = 'subscriptions-grid';

  rows.forEach((row, index) => {
    const li = document.createElement('li');
    li.className = `subscription-card plan-${index + 1}`;

    while (row.firstElementChild) li.append(row.firstElementChild);

    [...li.children].forEach((div, divIdx) => {
      if (divIdx === 0) {
        div.className = 'subscription-plan-header';

        const paragraphs = [...div.querySelectorAll('p')];
        if (paragraphs.length >= 2) {
          paragraphs[0].className = 'plan-name';

          // Get the price text (e.g. "100 rs./month")
          let priceText = paragraphs[1].textContent.trim();

          // Create wrapper for the price structure
          const priceWrapper = document.createElement('div');
          priceWrapper.className = 'price-wrapper';

          const badge = document.createElement('span');
          badge.className = 'price-badge';

          // If there's a slash (like "/month"), split them up
          if (priceText.includes('/')) {
            const parts = priceText.split('/');
            badge.textContent = parts[0].trim(); // "100 rs."

            priceWrapper.append(badge);

            const period = document.createElement('span');
            period.className = 'price-period';
            period.textContent = `/${parts[1].trim()}`; // "/month"
            priceWrapper.append(period);
          } else {
            badge.textContent = priceText;
            priceWrapper.append(badge);
          }

          paragraphs[1].replaceWith(priceWrapper);
        }
      } else {
        div.className = 'subscription-plan-features';
      }
    });

    ul.append(li);
  });

  const existingList = block.querySelector('ul');
  if (existingList) existingList.remove();
  block.append(ul);
}
