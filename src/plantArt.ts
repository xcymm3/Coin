// Code-native pixel art follows the existing terracotta pots and dark outlined silhouettes.
export const EXTRA_PLANTS = [
  { color: '#f8d357', light: '#fff2b0', shape: 'M5 9h8v3h2v6H3v-6h2ZM16 3h8v3h2v6H14V6h2ZM23 14h6v3h2v5H21v-5h2Z', bud: 'M12 9h4v7h-4Zm7-3h4v7h-4Z' },
  { color: '#f7aa40', light: '#ffe099', shape: 'M9 8h5v3h3v10h-3v3H9v-3H6V11h3Zm12-5h5v3h3v10h-3v3h-5v-3h-3V6h3Z', bud: 'M12 8h8v3h3v8h-3v3h-8v-3H9v-8h3Z' },
  { color: '#55d9a4', light: '#b2ffda', shape: 'M14 2h4v19h-4ZM3 8h4v4h4v8h3v5H9V19H6v-5H3ZM25 6h4v8h-3v5h-4v6h-5v-5h4v-9h4Z', bud: 'M14 5h4v19h-4ZM7 12h4v8H7Zm14-3h4v11h-4Z' },
  { color: '#ff764e', light: '#ffd66f', shape: 'M13 3h6v6h4V5h4v13h-4v5H9v-5H5V9h4v4h4Z', bud: 'M14 5h4v7h4v9H10v-9h4Z' },
  { color: '#6ac2f5', light: '#e1fcff', shape: 'M8 5h5v21H8Zm12-3h5v24h-5ZM4 10h13v3H4Zm13 7h15v3H13Z', bud: 'M12 6h5v20h-5Zm8 5h4v15h-4ZM8 13h13v3H8Z' },
  { color: '#86ebda', light: '#dec5ff', shape: 'M14 4h4v23h-4ZM5 5h5v4h4v4h-4V9H5ZM2 12h7v4h5v4H9v-4H2Zm16-3h4V5h6v4h-6v4h-4Zm0 10h5v-5h7v4h-7v5h-5Z', bud: 'M14 8h4v18h-4ZM6 11h8v5H6Zm12-4h8v5h-8Z' },
  { color: '#8075ed', light: '#ead2ff', shape: 'M14 3h4v5h4V5h4v8h5v6h-5v5H6v-5H1v-6h5V5h4v3h4Z', bud: 'M13 6h6v5h5v10H8V11h5Z' },
  { color: '#ffab46', light: '#ffed91', shape: 'M14 2h4v8h4V5h4v7h5v7h-6v4H7v-4H1v-7h5V5h4v5h4Z', bud: 'M14 4h4v9h6v7H8v-7h6Z' },
  { color: '#edbe82', light: '#fff1c5', shape: 'M7 3h18v4h-3v5h-4v4h4v5h3v4H7v-4h3v-5h4v-4h-4V7H7Z', bud: 'M10 7h12v4h-4v6h4v5H10v-5h4v-6h-4Z' },
  { color: '#a68bf5', light: '#d4f5ff', shape: 'M13 2h9v4h4v6h-4v4H12v4h12v5H8v-5H4v-6h4v-4h12V7h-7Z', bud: 'M12 6h10v4h-4v4h-6v5h8v4H8V12h4Z' },
  { color: '#ffe07b', light: '#fffde7', shape: 'M13 2h6v6h5V4h4v9h4v7h-8v5H8v-5H0v-7h4V4h4v4h5Z', bud: 'M13 5h6v7h7v7h-7v5h-6v-5H6v-7h7Z' },

  {color:'#d9aa58',light:'#ffe3a0',shape:'M14 2h4v25h-4ZM4 4h7v4h3v4h-4V8H4Zm14 8h5V7h7v5h-7v5h-5ZM4 17h6v4h4v4H9v-4H4Z',bud:'M14 4h4v22h-4ZM6 10h8v4H6Z'},
  {color:'#b4cab1',light:'#edf5d6',shape:'M5 3h6v4h14v5h-7v5h9v7h-6v-3H10v-5h5v-5H5Zm2 2v3h2V5Z',bud:'M8 7h15v5h-8v11h-5V12H8Z'},
  {color:'#b89781',light:'#edd6b8',shape:'M12 2h8v5h6v6h-5v6h7v5H4v-5h7v-6H6V7h6Zm1 8h6v3h-6Z',bud:'M12 7h8v5h4v8H8v-8h4Z'},
  {color:'#77beaa',light:'#cdf0bd',shape:'M12 1h8v8h5V4h5v10h2v6h-8v6H8v-6H0v-6h2V4h5v5h5Z',bud:'M13 5h6v8h7v8H6v-8h7Z'},
  {color:'#84dcf2',light:'#edffff',shape:'M1 2h4v6h5v5h6V8h8v3h5v9h-5v5h-9v-5h-5v-4H6v-5H3V7H1Z',bud:'M5 5h5v7h11v10H10v-7H5Z'},
  {color:'#b19df1',light:'#e5d7ff',shape:'M11 2h10v4h6v7h5v4H0v-4h5V6h6Zm3 15h5v10h-5ZM2 19h8v3H2Zm21 0h7v3h-7Z',bud:'M9 8h14v8H9Zm5 8h4v9h-4Z'},
  {color:'#9fb7d6',light:'#eff4ff',shape:'M13 2h6v5h5v5h4v12H16V12h3v-2h-6v8H3v-8h4V6h6Z',bud:'M11 6h10v4h5v12H15V12h-4Z'},
  {color:'#e6c487',light:'#fff6bd',shape:'M13 0h6v7h6v5h7v6h-7v5h-6v6h-6v-6H7v-5H0v-6h7V7h6Z',bud:'M13 4h6v6h7v9h-7v7h-6v-7H6v-9h7Z'},
]
