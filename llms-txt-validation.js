//[llms-txt-valid]
return fetch('/llms.txt')
  .then(response => {
    if (!response.ok) return 0;
    const ct = response.headers.get('Content-Type')||'';
    if (!ct.toLowerCase().includes('text/plain')) return 0;
    return response.text().then(text => {
      const m = s=> (text.match(new RegExp(`\\${s}`,'g'))||[]).length;
      if ((text.match(/```/g)||[]).length %2) return 0;
      if (m('[')!==m(']')||m('(')!==m(')')) return 0;
      return 1;
    });
  })
  .catch(error => {
    return JSON.stringify({message: error.message, error: error});
  });
