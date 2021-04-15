const extName = chrome.runtime.getManifest().name;

const inject = fn => {
    const script = document.createElement('script')
    script.text = `(${fn.toString()})();`
    document.documentElement.appendChild(script)
};
const initButton = () => {
    Drupal.ajax.bindAjaxLinks(document.body);
};

const checkButton = () => {
    let div;
    (async () => {
        if (document.querySelector(".product-out-of-stock")) {
            const productId = document.location.pathname.split("/")[3];
            const button = document.createElement("button");
            button.className = "btn-shopping-cart btn-shopping-neutral use-ajax";
            button.innerHTML = "Add to cart";
            button.setAttribute("href", `/en/direct-buy/add-to-cart/${productId}`);
            button.setAttribute("data-progress-type", "fullscreen");

            const fixedByDiv = document.createElement("div");
            fixedByDiv.innerText = `FIXED by ${extName}`;
            div = document.createElement("div");
            div.appendChild(button);
            div.appendChild(fixedByDiv);

            document.querySelector(".product-out-of-stock").replaceWith(div);
            inject(initButton);
        }
    })();
};

checkButton();
