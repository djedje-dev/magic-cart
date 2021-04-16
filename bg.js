let step = 0;

[
    chrome.webRequest.onBeforeRedirect,
    chrome.webRequest.onCompleted
].forEach(fn => {
    fn.addListener(
        ({ type, url, statusCode }) => {
            if (type === "xmlhttprequest" && ["direct-buy/add-to-cart", "direct-buy/validate-recaptcha"].some(partialUrl => url.includes(partialUrl))) {
                chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                    chrome.tabs.sendMessage(tabs[0].id, {
                        url,
                        statusCode
                    });
                });
            }
        },
        {
            urls: ["<all_urls>"],
        }
    );
})
