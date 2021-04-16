const extName = chrome.runtime.getManifest().name;
let step = 0;
chrome.runtime.onMessage.addListener(
    ({ url, statusCode }) => {
        if (statusCode === "403") {
            setMessage("IP BAN ? try clear cache & cookies / change IP", "red");
        }
        if (url.includes("direct-buy/add-to-cart")) {
            if (step === 0) {
                if (statusCode === 200) {
                    step = 1;
                    setMessage("Step 1 OK - Product added to cart.", "green")
                } else {
                    setMessage("Step 1 KO - clic again 'Add to cart'", "yellow")
                }
            } else if (step === 2) {
                if (statusCode === 200) {
                    setMessage("Step 3 OK - Your cart is empty or you can go to checkout.", "green")
                } else {
                    setMessage("Step 3 KO - use 'RETRY ADD TO CART' button at your own risk OR refresh page (F5, CTRL+R, swip) to retry", "yellow");
                    addButton();
                }
            }
        }
        if (url.includes("direct-buy/validate-recaptcha")) {
            if (statusCode === 200) {
                step = 2;
                setMessage("Step 2 OK - Captcha OK.", "green")
            } else {
                step = 1;
                setMessage("Step 2 KO - Captcha validation error => clic again 'Add to cart'", "yellow")
            }
        }
    }
);

const dangerousAddToCart = async (btnElement) => {
    try {
        const productId = document.location.pathname.split("/")[3];
        setMessage("Add to cart in progress, please wait...", "yellow");
        const result = await fetch(`https://www.amd.com/en/direct-buy/add-to-cart/${productId}?_wrapper_format=drupal_ajax`, {
            "headers": {
                "accept": "application/json, text/javascript, */*; q=0.01",
                "accept-language": "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7,it;q=0.6",
                "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
                "x-requested-with": "XMLHttpRequest"
            },
            "body": "js=true&_drupal_ajax=1&ajax_page_state%5Btheme%5D=amd&ajax_page_state%5Btheme_token%5D=&ajax_page_state%5Blibraries%5D=amd%2Famd-scripts%2Camd%2Fglobal-styling%2Camd_core%2Fforms%2Camd_enterprise_recaptcha%2Fgoogle-enterprise-recaptcha%2Camd_shop_product%2Fadd-to-cart-captcha%2Camd_shop_product%2Fdirect-buy%2Camd_shop_product%2Fdirect-buy-analytics%2Camd_shop_product%2Fdirect-buy.pdp%2Camd_shop_product%2Fdirect-buy.url-manager%2Camd_shop_product%2Fset-cart-token%2Camd_shop_product%2Fshopping-cart-actions%2Cchosen%2Fdrupal.chosen%2Cchosen_lib%2Fchosen.css%2Ccore%2Fdrupal.dialog.ajax%2Ccore%2Fhtml5shiv%2Csystem%2Fbase",
            "method": "POST",
            "credentials": "include"
        }).then(e => e.json());
    
        if (Array.isArray(result)) {
            const { data, dialogOptions } = (result || {}).find(({ command }) => command === "openDialog") || {};
    
            if (dialogOptions.title === "Confirm you're not a robot") {
                setTimeout(() => setMessage("refresh page or retry from start :/", "red"), 200)
                return;
            }
            
            if (data) {
                const [, cartUrl] = /"(\/[a-z]{2}\/direct-buy\/checkout\/.+)"/.exec(data) || [];
                if (cartUrl) {
                    window.location.href = cartUrl;
                    setInterval(() => setMessage("Redirecting to CHECKOUT PAGE, WAIT PLEASE", "green"), 200);
                }
            }
        }
    } finally {
        btnElement.disabled = false;
    }
}

const addButton = () => {
    const magicCartBtn = document.getElementById("magic-cart-btn");
    if (magicCartBtn) {
        const button = document.createElement("button");
        button.className = "btn-shopping-cart btn-shopping-neutral use-ajax";
        button.innerHTML = `RETRY ADD TO CART`;
        button.style.margin = "10px";
        button.onclick = function() {
            this.disabled = "disabled";
            dangerousAddToCart(this);
        };
        magicCartBtn.replaceWith(button);
    }
}

const inject = fn => {
    const script = document.createElement('script')
    script.text = `(${fn.toString()})();`
    document.documentElement.appendChild(script)
};
const initButton = () => {
    Drupal.ajax.bindAjaxLinks(document.body);
};

const setMessageWindow = () => { 
    window.setMessage = (message, color) => {
        const rootMagicCart = document.getElementById("magic-cart");
        color && (rootMagicCart.style.backgroundColor = color);
        const messageElement = rootMagicCart.querySelector(".message");
        messageElement.innerHTML = message;
    };
};

const setMessage = (message, color) => {
    const rootMagicCart = document.getElementById("magic-cart");
    color && (rootMagicCart.style.backgroundColor = color);
    const messageElement = rootMagicCart.querySelector(".message");
    messageElement.innerHTML = message;
};

const fixedDiv = `
<div id="magic-cart" style="
    position: sticky;
    width: 100%;
    top: 0;
    z-index: 999999;
    display: flex;
    flex-direction: column;
    align-items: center;
    background-color: #ccc;
    min-height: 50px;
">
    <div style="
        font-size: 12px;
    ">MAGIC CART</div>
    <div class="message" style="
        font-weight: bold;
    "></div>
    <div id="magic-cart-btn"></div>
</div>
`;

const createElementFromHTML = htmlString => {
    const div = document.createElement('div');
    div.innerHTML = htmlString.trim();
    return div.firstChild; 
}

const checkButton = () => {
    let div;
    setTimeout(() => {
        const outOfStock = document.querySelector(".product-out-of-stock");
        if (outOfStock) {
            const productId = document.location.pathname.split("/")[3];
            const button = document.createElement("button");
            button.className = "btn-shopping-cart btn-shopping-neutral use-ajax";
            button.innerHTML = `Add to cart | by ${extName}`;
            button.onclick = function() {
                step = 0;
                setMessage("", "#ccc");
            };
            button.setAttribute("href", `/en/direct-buy/add-to-cart/${productId}`);
            button.setAttribute("data-progress-type", "fullscreen");

            div = document.createElement("div");
            div.appendChild(button);
            outOfStock.replaceWith(div);
            inject(initButton);
            
            try {
                //v2
                document.body.prepend(createElementFromHTML(fixedDiv));
                inject(setMessageWindow);
            } finally {}
        }
    }, 500);
};

checkButton();
