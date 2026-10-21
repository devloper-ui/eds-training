export default async function decorate(block) {
  const rows = [...block.children];
  let formTitle = null;
  let jsonUrl = null;

  // 1. Check if the first row contains an optional title (text, not a link)
  if (rows.length > 0) {
    const firstRow = rows[0];
    const firstCell = firstRow.firstElementChild;
    const linkInFirstCell = firstCell ? firstCell.querySelector('a') : null;

    if (firstCell && !linkInFirstCell && firstCell.textContent.trim() !== '') {
      formTitle = firstCell.textContent.trim();
      firstRow.remove();
      rows.shift();
    }
  }

  // 2. Find the JSON spreadsheet link in the remaining rows
  const remainingLink = block.querySelector('a');
  if (!remainingLink) return;
  jsonUrl = remainingLink.href;

  // Clear block contents to rebuild cleanly
  block.textContent = '';

  // 3. Prepend the title header if provided
  if (formTitle) {
    const titleDiv = document.createElement('div');
    titleDiv.className = 'form-header';
    const h2 = document.createElement('h2');
    h2.textContent = formTitle;
    titleDiv.append(h2);
    block.append(titleDiv);
  }

  try {
    const response = await fetch(jsonUrl);
    const json = await response.json();
    const fields = json.data || [];

    const form = document.createElement('form');
    form.className = 'contact-form-container';
    form.action = '#';
    form.method = 'POST';

    fields.forEach((field) => {
      const fieldWrapper = document.createElement('div');
      const type = (field.Type || field.type || 'text').toLowerCase();
      const name = field.Field || field.name || '';
      const labelText = FieldLabel(field);
      const placeholder = field.Placeholder || field.placeholder || '';
      const isRequired = (field.Mandatory || field.mandatory || '').toLowerCase() === 'true';

      fieldWrapper.className = `form-group field-${name} ${type === 'submit' ? 'form-group-submit' : ''}`;

      if (type !== 'submit') {
        const label = document.createElement('label');
        label.textContent = labelText;
        label.setAttribute('for', name);
        if (isRequired) label.classList.add('required');
        fieldWrapper.append(label);
      }

      let input;
      if (type === 'textarea') {
        input = document.createElement('textarea');
        input.rows = 4;
      } else if (type === 'submit') {
        input = document.createElement('button');
        input.type = 'submit';
        input.textContent = labelText || 'Submit';
        input.className = 'form-submit-btn';
      } else {
        input = document.createElement('input');
        input.type = type;
      }

      if (type !== 'submit') {
        input.id = name;
        input.name = name;
        input.placeholder = placeholder;
        if (isRequired) input.required = true;
      }

      fieldWrapper.append(input);
      form.append(fieldWrapper);
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());

      console.log('Form Submitted Data:', data);
      alert('Thank you! Your message has been sent successfully.');
      form.reset();
    });

    block.append(form);
  } catch (error) {
    console.error('Failed to load form definition:', error);
    const errorMsg = document.createElement('p');
    errorMsg.textContent = 'Unable to load the contact form at this time.';
    block.append(errorMsg);
  }
}

function FieldLabel(field) {
  return field.Label || field.label || field.Field || field.name || '';
}
