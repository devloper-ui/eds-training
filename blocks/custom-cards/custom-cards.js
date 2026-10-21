export default function decorate(block) {
  const rows = [...block.children];
  let titleText = null;

  // Evaluate Row 1 for a potential section title
  if (rows.length > 0) {
    const firstRow = rows[0];
    const firstCell = firstRow.firstElementChild;
    
    if (firstCell) {
      const textContent = firstCell.textContent.trim();
      
      // If there is text, capture it as a title
      if (textContent !== '') {
        titleText = textContent;
      }
      
      // Always remove Row 1 so it acts purely as the title control row
      firstRow.remove();
      rows.shift();
    }
  }

  // Prepend title header if text was provided
  if (titleText) {
    const titleDiv = document.createElement('div');
    titleDiv.className = 'custom-cards-header';
    
    const h2 = document.createElement('h2');
    h2.textContent = titleText;
    titleDiv.append(h2);
    
    block.prepend(titleDiv);
  }

  // Process all remaining rows (Row 2 to rest) into cards
  const ul = document.createElement('ul');
  
  rows.forEach((row) => {
    const li = document.createElement('li');
    while (row.firstElementChild) li.append(row.firstElementChild);
    
    [...li.children].forEach((div) => {
      // Clean up empty cells
      if (div.textContent.trim() === '' && !div.querySelector('picture')) {
        div.remove();
        return;
      }

      if (div.children.length === 1 && div.querySelector('picture')) {
        div.className = 'cards-card-image';
      } else {
        div.className = 'cards-card-body';
        
        const firstTextElement = div.querySelector('p, h1, h2, h3, h4, h5, h6');
        if (firstTextElement) {
          firstTextElement.classList.add('cards-card-title');
        }
      }
    });
    
    if (li.children.length > 0) {
      ul.append(li);
    }
  });
  
  const existingList = block.querySelector('ul');
  if (existingList) existingList.remove();
  block.append(ul);
}
