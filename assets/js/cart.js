var topics = {};

jQuery.Topic = function (id) {
    var callbacks, method,
        topic = id && topics[id];

    if (!topic) {
        callbacks = jQuery.Callbacks();
        topic = {
            publish: callbacks.fire,
            subscribe: callbacks.add,
            unsubscribe: callbacks.remove
        };
        if (id) {
            topics[id] = topic;
        }
    }
    return topic;
};

function findWithAttr(array, attr, value) {
    for (var i = 0; i < array.length; i += 1) {
        if (array[i][attr] === value) {
            return i;
        }
    }
    return -1;
}

$.getParam = function (name) {
    var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.href);
    if (results == null) {
        return null;
    }
    return decodeURI(results[1]) || 0;
}

var querystring = {
    bp: "firstpage",
    website: "signusup.net",
    offer: "",
}

$.Topic("ProductPage").subscribe(productItems)
$.Topic("ProductPage").subscribe(itemOncart)

$.Topic("RemoveItem").subscribe(removeItemFromcart)
$.Topic("RemoveItem").subscribe(itemOncart)

$.Topic("Addtocart").subscribe(updateCart)
$.Topic("Addtocart").subscribe(itemOncart)

var response = {}

$.post(getAPI_Domain() + '/onlineorder/v2', querystring, function (res) {
    response = res.ProductOptions;
    $.Topic("ProductPage").publish(res)
})


function productItems(res) {
    for (var i in res.ProductOptions) {
        var filterProdName = $("#product").val();
        var parentDiv = $("#productItems");
        if (res.ProductOptions[i].ProductName.indexOf(filterProdName) != -1) {
            var lastDigitKey = !isNaN(res.ProductOptions[i].DefaultKeycode.slice(-2)) ? res.ProductOptions[i].DefaultKeycode.slice(-2) : res.ProductOptions[i].DefaultKeycode.slice(-1);

            parentDiv.find("[data-index='" + lastDigitKey + "'] .price").html("$" + parseFloat(res.ProductOptions[i].ProductPrice).toFixed(2));
            parentDiv.find("[data-index='" + lastDigitKey + "']  a.addToCart").attr("keycode", res.ProductOptions[i].DefaultKeycode);
            parentDiv.find("[data-index='" + lastDigitKey + "']  a.addToCart").attr("prodprice", parseFloat(res.ProductOptions[i].ProductPrice).toFixed(2));
            parentDiv.find("[data-index='" + lastDigitKey + "']  a.addToCart").attr("prodname", res.ProductOptions[i].ProductName);
            parentDiv.find("[data-index='" + lastDigitKey + "'] .rebill-price").html("$" + parseFloat(res.ProductOptions[i].DefaultRebillPrice).toFixed(2));


        }

    }
}

function updateCart(data) {
    if (!!$.cookie('cartItem')) {
        var arr = JSON.parse($.cookie("cartItem"))
        var count = 0
        for (var i in arr) {
            console.log(arr[i].prodName)
            if (arr[i].prodName == data.prodName) {
                count++
            }
        }
        if (count == 0) {
            arr.push(data)
            $.cookie("cartItem", JSON.stringify(arr))

        } else {        

            var index = findWithAttr(arr, "prodName", data.prodName);
            if (arr[index].hasOwnProperty('promoKeycode')) {
                delete arr[index].promoKeycode;     
            } 

            arr[index].prodPrice = data.prodPrice;
            arr[index].prodName = data.prodName;
            arr[index].qty = data.qty;
            arr[index].keycode = data.keycode;
            arr[index].description = data.description;
            arr[index].promo = data.promo;
            arr[index].optionId = data.optionId;
            arr[index].shipping = data.shipping;
            $.cookie("cartItem", JSON.stringify(arr));
        }
        $(".cartCount").text(arr.length)
    } else {
        var arr = [data]
        $.cookie("cartItem", JSON.stringify(arr))
        $(".cartCount").text(1)
    }
}

function itemOncart() {
    var total = 0
    if (!!$.cookie('cartItem')) {
        var arr = JSON.parse($.cookie("cartItem"));
        $(".cartCount").text(arr.length);
        (arr.length > 0) ? $(".cartCount").show() : $(".cartCount").hide();

        $(".cartItem").html("")
        for (var i in arr) {
            var months = !isNaN(arr[i].keycode.slice(-2)) ? arr[i].keycode.slice(-2) : arr[i].keycode.slice(-1);

            $("[data-index='" + months + "'] .addToCart[prodname='" + arr[i].prodName + "']").text("Added to Cart");
            $("[data-index='" + months + "'] .addToCart[prodname='" + arr[i].prodName + "']").addClass("subscribe");
            $(".cartItem").append("<div class='cart_item'><span style='margin:5px;cursor: pointer !important;' prodname='" + arr[i].prodName + "' class='removeItem'>x</span>" + arr[i].prodName + " " + decodeURIComponent(arr[i].description) + "<span style='float:right' class='itemPrice'>$" + ((typeof arr[i].promoKeycode != "undefined") ? parseFloat(arr[i].promoPrice).toFixed(2) : parseFloat(arr[i].prodPrice).toFixed(2))  + "</span></div>")


            if (typeof arr[i].promoKeycode != "undefined") {
                total = total + parseFloat(arr[i].promoPrice);
            } else {
                total = total + parseFloat(arr[i].prodPrice);
            }
        }
        $(".cartCount").text(arr.length)
        $(".cartItem").append("<br/>")
        $(".cartItem").append("<span style='margin-right:10px;cursor: pointer !important;' class='Total'></span>Total<span style='float:right' class='itemPrice'>$" + parseFloat(total).toFixed(2) + "</span><br><br>")
        $(".cartItem").append("<a style='padding: 2px;display: block !important;margin-bottom: 5px;' class='btn btn-lg px-5 mx-auto primary-blue d-inline-block' href='checkout.html'>Checkout</a>");
        //$(".cartItem").append("<a style='padding: 2px;display: block !important;margin-bottom: 5px;color:#4785fc;border: 1px solid #4785fc;background:none' class='btn btn-lg px-5 mx-auto primary-blue d-inline-block' href='cart.html'>Cart</a>");
    } else {
        $(".cartCount").text(0)
    }
    if (total == 0) {
        $(".cartItem").html("")
        $(".cartItem").html("No Item on cart")
    }
}

function removeItemFromcart(prodname) {
    $(".addToCart[prodname='" + prodname + "']").text("Added")
    var arr = JSON.parse($.cookie("cartItem"))
    for (var i in arr) {
        if (arr[i].prodName == prodname) {
            arr.splice(i, 1)
            $(".addToCart[prodname='" + prodname + "']").text("Subscribe and Save").removeClass("subscribe");
        }
    }
    $.cookie("cartItem", JSON.stringify(arr))
}

$(".cartItem").on("click", ".removeItem", function () {
    $.Topic("RemoveItem").publish($(this).attr('prodname'))
});

$(".cartIcon,.cartCount").on("click", function () {
    $(".cartItem").slideToggle("slow")
})


$("#productItems").on("click", ".addToCart", function () {
    var index = findWithAttr(response, "DefaultKeycode", $(this).attr("keycode"));
    var item = response[index];//starting keycode
    var data = {
        prodPrice: item.ProductPrice,
        prodName: $(this).attr("prodName"),
        keycode: item.DefaultKeycode,
        description: item.ProductDescription,
        promo: item.HasPromo,
        optionId: item.OptionID,
        shipping: item.DefaultShippingPrice
    }
    $(".addToCart").html("Subscribe and Save");
    $(".addToCart").removeClass("subscribe");
    $(this).attr("disabled")
    $.Topic("Addtocart").publish(data)
    return false;
})



        // Trigger Chat Window in Many Chat
        $(document).ready(function () {
            $('.chat-link').click(function () {
                FB.CustomerChat.showDialog();
            });
        });
