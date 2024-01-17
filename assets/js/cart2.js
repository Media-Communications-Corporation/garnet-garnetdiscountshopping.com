/* pubsub event pattern */
var events = {
    events: {},
    on: function (eventName, fn) {
        this.events[eventName] = this.events[eventName] || [];
        this.events[eventName].push(fn);
    },
    off: function (eventName, fn) {
        if (this.events[eventName]) {
            for (var i = 0; i < this.events[eventName].length; i++) {
                if (this.events[eventName][i] === fn) {
                    this.events[eventName].splice(i, 1);
                    break;
                }
            };
        }
    },
    emit: function (eventName, data) {
        if (this.events[eventName]) {
            this.events[eventName].forEach(function (fn) {
                fn(data);
            });
        }
    }
};

var thankYou = (function () {
    var tyTemplate = $("#ty-summary");
    function displaySummary() {
        if ($.cookie("ty_data") != null) {
            var data = $.cookie("ty_data");
            var res = data.split(",");

            var ty_container = $.parseHTML(tyTemplate.html()), i = 0;

            var $html = $('<div />', {
                html: ty_container
            });

            while (i < res.length) {
                var datum = res[i].split("_");
                var img = datum[0],//image
                    prodName = datum[1], //prod name
                    prodPrice = datum[2], //price
                    shippingPrice = datum[3]; //shipping price
                var total = parseFloat(prodPrice) + parseFloat(shippingPrice);
                var prodImage = "img/" + prodName.split(" ").join("-").toLocaleLowerCase() + "-logo" + ".png";
                $html.find(".prod-img").attr("src", prodImage);
                $html.find(".main-prod").text(prodName);
                $html.find(".prod-price").text(parseFloat(prodPrice).toFixed(2));
                $html.find(".main-total").text(parseFloat(total).toFixed(2));
                if (parseInt(shippingPrice) != 0) {
                    $html.find(".shipping-price").text("$" + parseFloat(shippingPrice).toFixed(2));
                } else {
                    $html.find(".shipping-price").text("FREE");
                }



                $(".ty_summary").append($html.html());
                i++;
            }

        }
    }
    return {
        displaySummary: displaySummary
    }
})();


// cartItem module
var cartItem = (function () {
    var elCount = $(".cartCount"),
        addCart = $(".order-now"),
        orderContainer = $("#order-container"),
        orderSummary = $("#order-summary"),//template for order summary
        prodInCart = [];

    function totalCart() {
        elCount.text(prodInCart.length)
    }

    function checkInCart() {
        var orderButtn = addCart.attr("hierarchy");
        if (prodInCart.indexOf(orderButtn) !== -1) {
            addCart.attr("disabled", "disabled").find("span").text("ADDED");
        }

    }

    function storedOrder() {

        if ($.cookie("prodInCart") != null) {
            var data = $.cookie("prodInCart");
            var res = data.split(",");
            var stored = prodInCart.concat(res);
            stored = stored.filter(function (item, index) {
                return stored.indexOf(item) == index;
            });
            prodInCart = stored;
        }
    }

    function saveToCookie() {
        if (prodInCart.length !== 0) {
            $.cookie("prodInCart", prodInCart.toString());
        } else {
            $.removeCookie("prodInCart");
        }

    }

    function addProduct(prodHierarchy) {
        if (prodHierarchy == undefined)
            return;

        if (prodInCart.indexOf(prodHierarchy) === -1) {
            prodInCart.push(prodHierarchy);
        } else {
            alert("Already Added");
        }

    }

    function removeProduct(removeItem) {
        const index = prodInCart.indexOf(removeItem);
        if (index > -1) {
            prodInCart.splice(index, 1);
        }

        events.emit("addProdToCart");
        events.emit("updateCookie");
        events.emit("displayOrder");

    }

    function startOrder() {
        storedOrder();

        //initiate event        
        events.on("addProdToCart", addProduct);
        events.on("addProdToCart", saveToCookie);
        events.on("addProdToCart", totalCart);
        events.on("addProdToCart", checkInCart);
        events.emit("addProdToCart");

        addCart.on("click", function () {
            var el = $(this);
            events.emit("addProdToCart", el.attr("hierarchy"));
        });
    }

    function displayOrder() {
        storedOrder();
        events.on("displayOrder", displayOrder);
        events.on("updateCookie", saveToCookie);

        var order_container = $.parseHTML(orderSummary.html()),
            i = 0,
            output = "",
            totalOrderAmount = 0;

        var $html = $('<div />', {
            html: order_container
        });

        if ($("input.product-option").length != 0) {
            if (prodInCart.length !== 0) {
                $(".keycode.prod").remove();//remove all to reset
                while (i < prodInCart.length) {

                    var selector = $('.product-option[data-hierarchy="' + prodInCart[i] + '"]');
                    var prod_price = parseFloat(selector.attr("data-product-price")).toFixed(2);
                    var prodName = selector.attr("data-product-name");
                    var keycode = selector.attr("data-keycode");
                    var img = "img/product" + prodInCart[i] + ".png";
                    totalOrderAmount += parseFloat(prod_price);

                    $html.find(".prod-image").attr("src", img);
                    $html.find(".prod_price").text("$" + prod_price);
                    $html.find(".remove").attr("hierarchy", prodInCart[i]);
                    $html.find(".prod-name").text(prodName);

                    $("body").append("<input class='keycode prod' name='" + prodName + "' type='hidden' prodImg='" + img + "' data-keycode='" + keycode + "'>");
                    output += $html.html();
                    i++;
                }
                orderContainer.html("");
                orderContainer.append(output);
                orderContainer.addClass("loaded");
                $(".totalOrder").text("$" + totalOrderAmount.toFixed(2));


            } else {
                orderContainer.html("Cart is empty. Pls click <a href='/'>here</a>");
            }

        } else {
            setTimeout(displayOrder, 1000);
        }

    }

    return {
        startOrder: startOrder,
        displayOrder: displayOrder,
        removeOrder: removeProduct

    }

})();

