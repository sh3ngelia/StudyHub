function setCookie(name, value, days) {
    const expires = new Date();
    expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
}

function getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

function deleteCookie(name) {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/`;
}

function initCookieConsent() {
    // const consent = getCookie('cookieConsent');
    // if (!consent) {
    //     showCookieBanner();
    // } else {
    //     console.log('Cookie consent დაფიქსირებულია:', consent);
    // }
     showCookieBanner();
}

function showCookieBanner() {
    const banner = document.getElementById('cookieBanner');
    if (banner) {
        setTimeout(() => {
            banner.classList.add('show');
        }, 1500);
    }
}

function hideCookieBanner() {
    const banner = document.getElementById('cookieBanner');
    if (banner) {
        banner.classList.remove('show');
    }
}

function acceptCookies() {
    setCookie('cookieConsent', 'accepted', 365);
    setCookie('analytics', 'true', 365);
    setCookie('marketing', 'true', 365);
    setCookie('functional', 'true', 365);
    hideCookieBanner();
    
    console.log('ყველა cookie მიღებულია');
}

function declineCookies() {
    setCookie('cookieConsent', 'declined', 365);
    setCookie('analytics', 'false', 365);
    setCookie('marketing', 'false', 365);
    setCookie('functional', 'false', 365);
    hideCookieBanner();
    
    console.log('არა-აუცილებელი cookie-ები უარყოფილია');
}

document.addEventListener('DOMContentLoaded', initCookieConsent);