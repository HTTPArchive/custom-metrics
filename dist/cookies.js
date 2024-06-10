// [cookies]

return $WPT_COOKIES?.map(cookie => {
  const { name, domain, path, expires, size, httpOnly, secure, session, sameSite, sameParty, partitionKey, partitionKeyOpaque } = cookie
  return { name, domain, path, expires, size, httpOnly, secure, session, sameSite, sameParty, partitionKey, partitionKeyOpaque }
})
