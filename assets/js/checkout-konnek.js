
var konneckApiCall = KonnekApiInit();
konneckApiCall.setup(setup_); 
var konnekCart = KonnekCart(jQuery, konneckApiCall);
konnekCart.prodSetup(setup);// merge kn setup and setup variable

//override psmr import to boss function
var order_id = "";
var msg_ = "";
var error_psmr = [];
konneckApiCall.importPSMR_to_boss = function (apikey, keycode, callback) {

}



//this function will search property from object else it return -1
window.findWithAttr = function (array, attr, value) {
    for (var i = 0; i < array.length; i += 1) {
        if (array[i][attr] === value) {
            return i;
        }
    }
    return -1;
}

window.removeExtraSpaces = function (str) {
    return str.replace(/\s+/g, " ");
}

window.additionalQuery = function () {
    return '';
}


//check if price exists in the order
window.konnektiveOrderValid = function () {
    var count = 0;
    $("input[type='hidden'].konnecktive-order").each(function () {
        if (typeof $(this).attr("price") == "undefined") {
            count++;
        }
    });
    if (count == 0) { return true }
    return false;
}

var konnekCart = KonnekCart(jQuery, konneckApiCall);
Array.prototype.push.apply(setup);//setup inside setup.js
konnekCart.prodSetup(setup);

//override removeItemFromcart
konnekCart.removeItemFromcart = function (prodname) {
    var arr = JSON.parse($.cookie("cartItem_dw"))
    for (var i in arr) {
        if (arr[i].prodName == prodname) {
            arr.splice(i, 1);
            $("p[prodName='" + prodname + "']").remove();
        }
    }
    $.cookie("cartItem_dw", JSON.stringify(arr))

}

konnekCart.monthly_offer_details = function (out) {
    var offerDetails = out.monthlyOfferDetails;
    offerDetails = offerDetails.split("{{price}}").join("$" + parseFloat(out.price).toFixed(2));
    offerDetails = offerDetails.split("{{rebill-price}}").join("$" + parseFloat(out.price).toFixed(2));
    offerDetails = offerDetails.split("{{prodName}}").join(out.productName);
    return offerDetails;

}

konnekCart.customCode = function (context) {
    for (var i in context.subscriptions) {
        if (typeof context.subscriptions[i].monthlyOfferDetails != "undefined") {
            $(".terms-cart").append("<p prodName='" + context.subscriptions[i].prodName + "' style='font-size: 0.9em!important;'>" + context.subscriptions[i].monthlyOfferDetails + "</p>")
        }

    }

    //merchat_setup variable can be found in setup.js
    for (var i in merchant_setup) {
        $("." + i).html(merchant_setup[i])
    }
}

konnekCart.exec(); //exec cart

var konnekForm = KonnekForm(konneckApiCall);
var psrmCart = [];//psmr prod option
var prodCart = [];//non psmr prod option

var listUpsells = [],//lists of upsells
    wasSubmitted = false,
    error_msg = "",
    additional_params = "",
    checkoutType = konneckApiCall.getCheckoutType(),
    ty_data_obj;

function validateFields(el, ifFalse) {
    var defaultVal = (typeof ifFalse == "undefined" || ifFalse == null) ? "" : ifFalse;
    if (konneckApiCall.getQueryStringByName(el.replace(".", "").replace("#", "")) != "") {
        //console.log(el.replace(".", "").replace("#", ""))
        return konneckApiCall.getQueryStringByName(el.replace(".", "").replace("#", ""));
    }
    return ($(el).val() == "undefined" || $(el).val() == null) ? defaultVal : $(el).val();
}

function customerInfo() {
    var email_address = konneckApiCall.validateFields("#fields_email"),
        phone_number = konneckApiCall.validateFields("#fields_phone"),
        fname = konneckApiCall.validateFields("#fields_fname"),
        lname = konneckApiCall.validateFields("#fields_lname"),
        address1 = konneckApiCall.validateFields("#fields_address1"),
        address2 = konneckApiCall.validateFields("#fields_address2"),
        city = konneckApiCall.validateFields("#fields_city"),
        state = konneckApiCall.validateFields("#fields_state"),
        zip_code = konneckApiCall.validateFields("#fields_zip"),
        country = (konneckApiCall.validateFields("#fields_country_select") == "") ? "US" : konneckApiCall.validateFields("#fields_country_select");

    var data = {
        'emailAddress': email_address,
        'phoneNumber': phone_number,
    };

    data.shipFirstName = fname;
    data.shipLastName = lname;
    data.shipAddress1 = address1;
    data.shipAddress2 = address2;
    data.shipCountry = country;
    data.shipCity = city;
    data.shipState = state;
    data.shipPostalCode = zip_code;

    if (!$("#chkboxSameAddress").is(":checked") && $("#chkboxSameAddress").length != 0) {
        data.billShipSame = 0;
        data.firstName = $("#fields_fname_bill").val();
        data.lastName = $("#fields_lname_bill").val();
        data.address1 = $("#fields_address1_bill").val();
        data.address2 = $("#fields_address2_bill").val();
        data.country = country;
        data.city = $("#fields_city_bill").val();
        data.state = $("#fields_state_bill").val();
        data.postalCode = $("#fields_zip_bill").val();
    } else {
        data.billShipSame = 1;
        data.firstName = fname;
        data.lastName = lname;
        data.address1 = address1;
        data.address2 = address2;
        data.country = country;
        data.city = city;
        data.state = state;
        data.postalCode = zip_code;
    }

    return data;
}



konnekForm.redirectionToPage = function (query_url, data) {
    var psmrOnly = "";
    if (psrmCart.length != 0 && prodCart.length == 0) {
        psmrOnly = "&psmrOnly=true";
    }

    window.location.href = "thankyou.html?fields_step=thankyou" + query_url.params +
        "&descriptor=" + encodeURIComponent(query_url.order_items.toString()) + "&desc_individual=" + encodeURIComponent(query_url.descriptor_individual.toString()) + "&fields_fname=" + data.message.firstName
        + "&fields_lname=" + data.message.lastName + psmrOnly;

}

konnekForm.exec();  //start exec here
