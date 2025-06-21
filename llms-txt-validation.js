//[llms-txt-valid]
return fetch('/llms.txt')
  .then(response => {
    if (!response.ok) return {"exists":0,"valid":0};
    const ct = response.headers.get('Content-Type')||'';
    if (!ct.toLowerCase().includes('text/plain')) return {"exists":1,"valid":0};
    return response.text().then(text => {
      const m = s=> (text.match(new RegExp(`\\${s}`,'g'))||[]).length;
      if ((text.match(/```/g)||[]).length %2) return {"exists":1,"valid":0};
      if (m('[')!==m(']')||m('(')!==m(')')) return {"exists":1,"valid":0};
      return {"exists":1,"valid":1};
    });
  })
  .catch(error => {
    return JSON.stringify({message: error.message, error: error});
  });
