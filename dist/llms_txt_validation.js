//[llms-txt-valid]

const fetchWithTimeout = (url) => {
  var controller = new AbortController();
  setTimeout(() => {controller.abort()}, 5000);
  return fetch(url, {signal: controller.signal});
}

return fetchWithTimeout('/llms.txt')
  .then(response => {
    if (!response.ok) return JSON.stringify({valid: false, message: response.status, error: "Non OK status code"});
    const ct = response.headers.get('Content-Type')||'';
    if (!ct.toLowerCase().includes('text/plain')) return JSON.stringify({valid: false, message: ct, error: "Invalid content type"});
    return response.text().then(text => {
      const m = s => (text.match(new RegExp(`\\${s}`,'g'))||[]).length;
      if (m('[')!==m(']')||m('(')!==m(')')) return JSON.stringify({valid: true, error: "Invalid markdown: Unmatched braces"});
      if ((text.match(/```/g)||[]).length %2) return JSON.stringify({valid: true, error: "Invalid markdown: Uneven code fences"});
      return JSON.stringify({valid: true});
    });
  })
  .catch(error => {
    return JSON.stringify({valid: false, message: error.message, error: error});
  });
