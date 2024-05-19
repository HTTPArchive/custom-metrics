//[ccpa-link]
// Uncomment the previous line for testing on webpagetest.org


const allowedCCPALinkPhrases = [
    //https://petsymposium.org/popets/2022/popets-2022-0030.pdf page 612
    'do not sell my personal information',
    'do not sell my information',
    'do not sell my info',
    'do not sell my personal info',
    'do not sell or share my personal information',
    'do not sell or share my information',
    'do not sell or share my info',
    'do not sell or share my personal info',
    //https://cppa.ca.gov/faq.html
    'your privacy choices',
    'your california privacy choices'
]

// https://petsymposium.org/popets/2022/popets-2022-0030.pdf page 627
const CCPAExclusionPhrases = [
    'terms',
    'user agreement',
    'service agreement',
    'conditions of use',
    'terms of usage',
    'privacy notice',
    'privacy policy',
    'privacy & cookies',
    'preferences',
    'terms of sale',
    'login',
    'terms and conditions apply',
    'accessibility',
    'your data in search',
    'shield',
    'promo',
    'campaign',
    'deal',
    'ad choice',
    'january',
    'february',
    'march',
    'april',
    'may',
    'june',
    'july',
    'august',
    'september',
    'october',
    'november',
    'december',
    'archive',
    'previous',
    'versions',
    'settings'
]

const CCPALinks = Array.from(document.querySelectorAll('a')).filter(link => {
    const text = link.textContent.toLowerCase()
    return allowedCCPALinkPhrases.some(phrase => text.includes(phrase)) && !CCPAExclusionPhrases.some(phrase => text.includes(phrase))
})

return JSON.stringify({
    hasCCPALink: CCPALinks.length > 0,
    CCPALinkPhrases: CCPALinks.map(link => link.textContent.trim().toLowerCase())
})