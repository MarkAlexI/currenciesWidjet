'use strict';

const DEFAULT_BASE = 'USD';
const DEFAULT_TSYMS = 'USD,JPY,EUR';
const CURRENCIES_LIST = 'UAH, EUR, USD, PLN, BTC, JPY, ETH';
let BASE = localStorage.getItem('BASE') || DEFAULT_BASE;
let TSYMS = localStorage.getItem('TSYMS') || DEFAULT_TSYMS;

const createSelect = (id, isMultiple = false) => {
  return `<select
      id="${id}"
      class="hidden"
      ${isMultiple ? 'multiple=""' : ''}
    />
      <option value="">--Choose currency</option>
      ${CURRENCIES_LIST
        .split(', ')
        .map(el => `<option value="${el}">${el}</option>`)
        .join('')
      }
    </select>
  `;
};

const enterToDialog = document.body.appendChild(document.createElement('div'));

enterToDialog.innerHTML = `
<style>
  #currency_widget_dialog {
    display: grid;
    background-color: lime;
    z-index: 10;
    margin-top: 10 px;
    border-radius: 1rem;
  }
  #currency_widget_dialog:not([open]) {
    pointer-events: none;
    opacity: 0;
  }
  #currency_widget_dialog::backdrop {
    background-color: hsl(250, 100%, 50%, 0.25);
  }
  @media (prefers-color-scheme: dark) {
    #currency_widget_dialog {
      background: pink;
    }
  }
  .hidden {
    display: none;
  }
  button[id*="btn"] {
    border: 1px black solid;
    border-radius: 5%;
    background-color: lightgrey;
    color: blue;
  }
  #currency_widget_field {
    position: fixed;
    bottom: 5rem;
    right: 2rem;
    z-index: 10;
    border: 1px solid black;
  }
  #currency_widget_settings {
    margin: 0;
    padding: .4rem;
    height: 1.8rem;
    display: flex;
    gap: .3rem;
    justify-content: center;
    background-color: lightcyan;
  }
  #currency_widget_field table {
    width: 9rem;
    border-collapse: collapse;
    border: 1 px solid black;
    text-align: center;
    vertical-align: middle;
  }
  #currency_widget_data tr:nth-child(odd) {
    background-color: linen;
  }
</style>
<dialog
  id="currency_widget_dialog"
>
  <form onsubmit="submitForm(event)">
    <input
      id="currency_widget_input"
      type="text"
      placeholder="Print your API-key"
    />
    ${createSelect('currency_widget_select')}
    ${createSelect('currency_widget_multi_select', true)}
    <button
      autofocus
      id="currency_widget_left_btn"
      formmethod="dialog"
      type="submit"
    >Cancel</button>
    <button
      id="currency_widget_right_btn"
      type="submit"
    >Submit</button>
  </form>
</dialog>
<div id="currency_widget_field">
  <div id="currency_widget_settings">
    <button id="currency_widget_api_btn">
      API
    </button>
    <button id="currency_widget_base_btn">
      BASE
    </button>
    <button id="currency_widget_courses_btn">
      $
    </button>
  </div>
  <table>
    <tbody id="currency_widget_data">
      
    </tbody>
  </table>
</div>
`;

const getById = (id) => document.getElementById(id);

const dialog = getById("currency_widget_dialog");
const input = getById("currency_widget_input");
const leftBtn = getById("currency_widget_left_btn");
const rightBtn = getById("currency_widget_right_btn");
const field = getById("currency_widget_field");
const data = getById("currency_widget_data");
const select = getById("currency_widget_select");
const multiSelect = getById("currency_widget_multi_select");
const changeApiKeyBtn = getById("currency_widget_api_btn");
const changeBaseBtn = getById("currency_widget_base_btn");
const changeCoursesBtn = getById("currency_widget_courses_btn");

const openDialog = () => !dialog.open && dialog.showModal();

const closeDialog = () => dialog.close();

let savedKey = localStorage.getItem('key');

const saveLocal = (key, value) => localStorage.setItem(key, value);

const takeFromInput = () => {
  if (input.value) {
    savedKey = input.value;
    input.value = '';
    saveLocal('key', savedKey);
  }
  if (select.value) {
    BASE = select.value;
    saveLocal('BASE', select.value);
  }
  if (multiSelect.value) {
    const options = document.getElementById('currency_widget_multi_select').selectedOptions;
    const values = Array.from(options)
      .map(({ value }) => value)
      .filter(value => value !== '--Choose currency');
    TSYMS = values.join(',');
    saveLocal('TSYMS', TSYMS);
  }
  closeDialog();
  getCources();
};

const changeApiKey = () => {
  openDialog();
  input.classList.remove('hidden');
  select.classList.add('hidden');
  multiSelect.classList.add('hidden');
};

const changeBase = () => {
  openDialog();
  input.classList.add('hidden');
  multiSelect.classList.add('hidden');
  select.classList.remove('hidden');
};

const changeCourses = () => {
 openDialog();
 input.classList.add('hidden');
 multiSelect.classList.remove('hidden');
 select.classList.add('hidden');
};

leftBtn.addEventListener('click', closeDialog);
rightBtn.addEventListener('click', takeFromInput);

changeApiKeyBtn.addEventListener('click', changeApiKey);
changeBaseBtn.addEventListener('click', changeBase);
changeCoursesBtn.addEventListener('click', changeCourses);

const getResponse = (response) => {
  let content = '';

  Object
    .keys(response)
    .map(currencyCode => {
      content += `
        <tr>
          <td>${currencyCode}</td>
          <td>${(1/response[currencyCode]).toFixed(3)}</td>
        </tr>
      `
    });

  data.innerHTML = content;
};

const getCources = () => {
  fetch(`https://min-api.cryptocompare.com/data/price?fsym=${BASE}&tsyms=${TSYMS}&api_key={${savedKey}}`, {
      credentials: 'omit'
    })
    .then((response) => {
      return response.json();
    })
    .then(getResponse)
    .catch((error) => {
      console.log(error);
    });
};

if (savedKey?.length > 0) {
  getCources();
} else {
  openDialog();
}

function submitForm(event) {
  event.preventDefault();
  window.history.back();
  (!!input.value || !!select.value || !!multiSelect.value) && getCources();
  return false;
}