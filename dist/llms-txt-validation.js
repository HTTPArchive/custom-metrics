//[llms-txt-valid]

const fetchWithTimeout = (url) => {
  var controller = new AbortController();
  setTimeout(() => {controller.abort()}, 5000);
  return fetch(url, {signal: controller.signal});
}

return fetchWithTimeout('/llms.txt')
  .then(response => {
    if (!response.ok) return JSON.stringify({valid:0, message: response.status, error: "Non OK status code"});
    const ct = response.headers.get('Content-Type')||'';
    if (!ct.toLowerCase().includes('text/plain')) return JSON.stringify({valid:0, message: ct, error: "Invalid content type"});
    return response.text().then(text => {
      const m = s=> (text.match(new RegExp(`\\${s}`,'g'))||[]).length;
      if ((text.match(/```/g)||[]).length %2) return JSON.stringify({valid:0, error:"Invalid markdown fences"});
      if (m('[')!==m(']')||m('(')!==m(')')) return JSON.stringify({valid:0, error:"Unmatched braces"});
      return JSON.stringify({valid:1});
    });
  })
  .catch(error => {
    return JSON.stringify({valid:0, message: error.message, error: error});
  });
