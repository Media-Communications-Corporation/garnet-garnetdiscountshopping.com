(function () {
    var Form = function (api) {

        if (typeof api == "undefined") {
            alert("Error: Please pass KonnekApiInit() function as parameter to KonnekForm() function.");
            return false;
        }

        var form_obj = {},
            withPixel = false,
            api = api,
            wasSubmitted = false,
            error_msg = "",
            additional_params = "",
            checkoutType = api.getCheckoutType(),
            coupon_code = "",
            currencySymbol = "$",
            billerNameDomain = "",
            ty_data;
        form_obj.listUpsells = [];//lists of upsells
        form_obj.psmr_ok = false;

        var geo_options = {
            initialCountry: "auto",
            //autoPlaceholder: "aggressive",
            geoIpLookup: function (callback) {
                $.get('https://www.cloudflare.com/cdn-cgi/trace').always(function (data) {
                    data = data.trim().split('\n').reduce(function (obj, pair) {
                        pair = pair.split('=');
                        return obj[pair[0]] = pair[1], obj;
                    }, {});
                    var countryCode = (data.loc) ? data.loc : "US";

                    function check() {
                        if ($("#fields_country_select option").length > 1) {
                            if ($("#fields_country_select option[value='" + countryCode + "']").length != 0) {
                                $("#fields_country_select").val(countryCode).trigger("change").trigger("mouseup");
                            }
                        } else {
                            setTimeout(check, 500);
                        }
                    }
                    check();
                    callback(countryCode);
                })
            },
            //placeholderNumberType: "MOBILE",
            separateDialCode: true,
            utilsScript: "/onlineorder/js/konnek.api/build/js/utils.js",
        }, iti;

        //global function
        window.extractDomain = function (url) {
            var domain;
            if (url.indexOf("://") > -1) {
                domain = url.split('/')[2];
            }
            else {
                domain = url.split('/')[0];
            }
            return $.trim(domain);
        }

        window.getCurrentOffer = function () {
            var currentOffer = window.location.pathname.substr(0, window.location.pathname.lastIndexOf('/')).toLowerCase().replace('/mobile', '');
            var pos = currentOffer.lastIndexOf('/');
            currentOffer = $.trim(currentOffer.substr(pos).replace("/", ""));
            if (currentOffer == extractDomain(window.location.pathname)) {
                currentOffer = '';
            }
            return "/" + currentOffer;
        }

        window.addDays = function (date, days) {
            var copy = new Date(Number(date))
            copy.setDate(date.getDate() + days)
            return copy
        }

        window.getQueryStringValueByName = function (name, str) {
            name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
            var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
                results = regex.exec(str);
            return results == null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
        }


        window.getQueryStringByName = function (name) {
            name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
            var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
                results = regex.exec(location.search);
            return results == null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
        }

        //sets keyboard press to digits only
        window.setInputDigit = function setInputDigit(el_id) {
            $(el_id).unbind("keydown").keydown(function (e) {
                if ($.inArray(e.keyCode, [46, 8, 9, 27, 13, 110]) !== -1 ||
                    (e.keyCode == 65 && e.ctrlKey === true) ||
                    (e.keyCode >= 35 && e.keyCode <= 39)) {
                    return;
                }
                if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
                    e.preventDefault();
                }
            });
        }

        //sets keyboard press to letters only
        window.setInputLetters = function setInputLetters(el_id) {
            //swype keyboard fix
            $(el_id).unbind('input').on('input', function (e) {
                var regExStr = /^[A-Za-z]+$/;
                if (regExStr.test($(el_id).val())) {
                    return;
                }
                else {
                    $(el_id).val($(el_id).val().replace(/[^a-zA-Z-\s]/g, ''));
                    e.preventDefault();
                }
            });
        }

        window.removeQuerystring = function (url, parameter) {
            var urlparts = url.split('?');
            if (urlparts.length >= 2) {
                var prefix = encodeURIComponent(parameter) + '=';
                var pars = urlparts[1].split(/[&;]/g);
                for (var i = pars.length; i-- > 0;) {
                    if (pars[i].lastIndexOf(prefix, 0) !== -1) {
                        pars.splice(i, 1);
                    }
                }
                url = urlparts[0] + '?' + pars.join('&');
                return url;
            } else {
                return url;
            }
        }

        window.findWithAttr = function (array, attr, value) {
            for (var i = 0; i < array.length; i += 1) {
                if (array[i][attr] === value) {
                    return i;
                }
            }
            return -1;
        }

        window.updateQueryStringParameter = function (uri, key, value) {
            var re = new RegExp("([?&])" + key + "=.*?(&|$)", "i");
            var separator = uri.indexOf('?') !== -1 ? "&" : "?";
            if (uri.match(re)) {
                return uri.replace(re, '$1' + key + "=" + value + '$2');
            }
            else {
                return uri + separator + key + "=" + value;
            }
        }

        //get specific product in a campaign either OFFER or UPSELL
        window.getProductOffers = function getProductOffers(response, productOffer) {
            var productsOffers = [];
            //loop to add property monthly and straight sale to response
            for (var i in response) {
                var out = response[i];
                if (out.productType == productOffer) {
                    productsOffers.push(out)
                }
            }
            return productsOffers;
        }

        /******************************************
         *   private functions
         *****************************************/


        function removeExtraSpaces(str) {
            return str.replace(/\s+/g, " ");
        }

        form_obj.firepixel = function (path) {

            var pixel_src = path;
            pixel_src = updateQueryStringParameter(pixel_src, 'adv_sub', getQueryStringByName("orderId"));
            pixel_src = updateQueryStringParameter(pixel_src, 'adv_sub2', getQueryStringByName("transaction_id"));
            pixel_src = updateQueryStringParameter(pixel_src, 'transaction_id', getQueryStringByName("transaction_id"));
            pixel_src = pixel_src.replace("{afid}", getQueryStringByName("afid"));
            pixel_src = pixel_src.replace("{subid2}", getQueryStringByName("subid2"));
            pixel_src = pixel_src.replace("{subid3}", getQueryStringByName("subid3"));

            $('<iframe id="pixel-frame" name="pixel-frame" frameBorder="0" style="width:1px' +
                ';height:0px' + ';border:none;"></iframe>').attr({
                    src: pixel_src
                }).appendTo('body');
        }

        form_obj.test_psmr_api = function () { }


        //add current year to pre-defined end year for card expiration year dropdownlist
        function addYears(el_id, year_span) {
            var curr_year = parseInt(new Date().getFullYear());
            var year_end = curr_year + year_span;
            var pos = -1;
            $(el_id).empty();
            $(el_id).append(
                $('<option></option>').val('').html('YEAR'));
            while (curr_year <= year_end) {
                pos = String(curr_year).length - 2;
                $(el_id).append(
                    $('<option></option>').val(String(curr_year).substr(pos)).html(curr_year));
                curr_year++;
            }
        }

        //add months to the card expiration month dropdownlist
        function addMonths(el_id) {
            var monthList = new Array("(Jan)", "(Feb)", "(Mar)", "(Apr)", "(May)", "(Jun)",
                "(Jul)", "(Aug)", "(Sep)", "(Oct)", "(Nov)", "(Dec)")
            var strVal = '';
            $(el_id).empty();
            $(el_id).append(
                $('<option></option>').val('').html('MONTH'));
            for (i = 0; i < monthList.length; i++) {
                if (String(i + 1).length == 1) {
                    strVal = '0' + String(i + 1);
                }
                else {
                    strVal = String(i + 1);
                }
                $(el_id).append(
                    $('<option></option>').val(strVal).html(strVal + ' ' + monthList[i]));
            }
        }

        //adds countries
        function addCountries(countries, states) {
            $('#fields_country_select, #fields_country_select2').empty();
            if (countries.length > 1) {
                $('#fields_country_select, #fields_country_select2, #fields_country_select_bill').append($('<option></option>').val('').html('-- Country--'));
            }
            // $(countries).each(function (key, val) {
            $.each(countries, function (key, value) {
                if (key != 'CurrencyAbbreviation' && key != 'CurrencyPrefix' && key != 'ExchangeRate') {
                    if (countries.length != 1)//has many countries to select
                    {

                        $('#fields_country_select, #fields_country_select2, #fields_country_select_bill').append($('<option></option>').val(countries[key]['countryCode']).html(countries[key]['countryName']));
                        FormSubmitValidation($.trim($('#fields_country_select').val()), true);
                        if ($('#fields_country_select_bill').length > 0) {
                            FormSubmitValidation($.trim($('#fields_country_select_bill').val()), true);
                        }
                    }
                    else {
                        if ($('#fields_country').length == 0) {
                            $('form:first').append('<input type="hidden" id="fields_country" name="fields_country" value=""/>');
                        }
                        $('#fields_country').val(key);
                        if ($('#fields_country_select > option').length < 1) {  // if the fields_country_select dropdown list is empty --- add the single country entry as the sole <option> sub element
                            $('#fields_country_select').append($('<option/>').val(countries[key]['countryCode']).html(countries[key]['countryName']));
                            FormSubmitValidation($.trim($('#fields_country').val()));
                        }

                        // if ($('#fields_country_select_bill > option').length < 1) {  // if the fields_country_select dropdown list is empty --- add the single country entry as the sole <option> sub element
                        //     $('#fields_country_select_bill').append($('<option/>').val(countries[key]['countryCode']).html(countries[key]['countryName']));
                        //     FormSubmitValidation($.trim($('#fields_country_select_bill').val()));
                        // }
                    }
                }
                // });
            });
            addStatesProvince('#fields_state, #fields_state_bill');
        }

        //adds states/province to the state/province dropdown list
        function addStatesProvince(el_id) {
            var country;
            if ($('#fields_country').length > 0 && $('#fields_country_select').length == 0 && $('#fields_country').val() != null) {
                country = $('#fields_country').val().toUpperCase();
            }
            else if ($.trim(getQueryStringByName('fields_country')) != '') {
                country = $.trim(getQueryStringByName('fields_country'));
            }
            else {
                //then this must be a select box having a country to choose from
                if ($('#fields_country_select').length > 0) {
                    if (!$('#fields_country_select').val()) {
                        $(el_id + ', #fields_state2').empty();
                        $(el_id + ', #fields_state2').append($('<option></option>').val('').html('Select a country'));
                        $('#fields_country_select, #fields_country_select2, #fields_country_select_bill').on('change', function () {
                            addStatesProvince(el_id);
                            var country_val = this.value;
                            FormSubmitValidation(country_val, true);
                            if ($('#fields_country').length == 0) {
                                $('form').append('<input type="hidden" id="fields_country" name="fields_country" value=""/>').promise().done(
                                    function () {
                                        $('#fields_country').val(country_val);
                                    });
                            }
                            else {
                                $('#fields_country').val(this.value);
                            }
                        });
                        return;
                    }
                    else {
                        country = $('#fields_country_select').val().toUpperCase();
                    }
                }
            }
            $(el_id).empty();
            $(el_id).append($('<option></option>').val('').html('-- Select --'));

            $(States).each(function (key, value) {

                $.each(value, function (key, value) {
                    if (key == country) {
                        $.each(value, function (key, value) {
                            $.each(value, function (key, value) {
                                $(el_id).append($('<option></option>').val(key).html(value));
                            });
                        });
                    }
                });
            });
            if ($('#fields_state2').length > 0) {
                $('#fields_state2').empty();
                var options2 = $(el_id).html();
                $('#fields_state2').html(options2);
            }
        }

        //prefill value
        function PreFillForm() {
            //support backwards compatible
            if (getQueryStringByName('field_fn') != '' && getQueryStringByName('field_fn').indexOf('{') == -1) {
                $('#fields_fname').val(getQueryStringByName('field_fn'));
                $('#fields_lname').val(getQueryStringByName('field_ln'));
                if (getQueryStringByName('address1') != '') {
                    $('#fields_address1').val(getQueryStringByName('address1'));
                }
                else {
                    $('#fields_address1').val(getQueryStringByName('field_address'));
                }
                $('#fields_city').val(getQueryStringByName('field_city'));
                $('#fields_zip').val(getQueryStringByName('field_zip'));
                setTimeout(function () {
                    $('#fields_state').val(getQueryStringByName('field_state'));
                }, 1000);
                $('#fields_phone').val(getQueryStringByName('field_phone'));
                $('#fields_email').val(getQueryStringByName('field_email'));
            }
            else {
                //v2
                if (getQueryStringByName('fields_fname').indexOf('{') == -1 && getQueryStringByName('fields_fname') != '') {
                    $('#fields_fname').val(getQueryStringByName('fields_fname'));
                    $('#fields_lname').val(getQueryStringByName('fields_lname'));
                    $('#fields_email').val(getQueryStringByName('fields_email'));
                    if (getQueryStringByName('retcus') != 1) {
                        if (getQueryStringByName('fields_address1') != '') {
                            $('#fields_address1').val(getQueryStringByName('fields_address1'));
                        }
                        else {
                            $('#fields_address1').val(getQueryStringByName('field_address'));
                        }
                        if (getQueryStringByName('fields_address2') != '') {
                            $('#fields_address2').val(getQueryStringByName('fields_address2'));
                        }
                        if (getQueryStringByName('fields_country') != '') {
                            $('#fields_country, #fields_country_select').val(getQueryStringByName('fields_country'));
                        }
                        $('#fields_city').val(getQueryStringByName('fields_city'));
                        $('#fields_zip').val(getQueryStringByName('fields_zip'));
                        if (getQueryStringByName('fields_zip').indexOf('-') > -1) {
                            //full zipcode was provided
                            if ($('#fields_zip').length > 0) {
                                var el = '#fields_zip';
                                if ($('#fields_zip').length > 0) {
                                    el += ' #fields_zip2';
                                }
                                $(el).rules('remove', 'validZipcode');
                                $(el).attr('maxlength', 10);
                                $(el).rules('add', {
                                    maxlength: 10
                                });
                            }

                        }
                        setTimeout(function () {
                            $('#fields_state').val(getQueryStringByName('fields_state'));
                        }, 1000);
                        $('#fields_phone').val(getQueryStringByName('fields_phone'));
                    }
                }
            }
            //billing
            if (getQueryStringByName('fields_fname').indexOf('{') == -1 && getQueryStringByName('fields_fname') != '') {
                $('#fields_fname_bill').val(getQueryStringByName('fields_fname'));
                $('#fields_lname_bill').val(getQueryStringByName('fields_lname'));
                $('#fields_email_bill').val(getQueryStringByName('fields_email'));
                if (getQueryStringByName('retcus') != 1) {
                    if (getQueryStringByName('fields_address1') != '') {
                        $('#fields_address1_bill').val(getQueryStringByName('fields_address1'));
                    }
                    else {
                        $('#fields_address1_bill').val(getQueryStringByName('field_address'));
                    }
                    if (getQueryStringByName('fields_address2') != '') {
                        $('#fields_address2_bill').val(getQueryStringByName('fields_address2'));
                    }
                    $('#fields_city_bill').val(getQueryStringByName('fields_city'));
                    $('#fields_zip_bill').val(getQueryStringByName('fields_zip'));
                    setTimeout(function () {
                        $('#fields_state_bill').val(getQueryStringByName('fields_state'));
                    }, 1000);
                    $('#fields_phone_bill').val(getQueryStringByName('fields_phone'));
                    $('#fields_fname_bill, #fields_lname_bill, #fields_email_bill, #fields_phone_bill').prop('disabled', false);
                }
            }
        }

        function ExpEntrZip_Key(el_id) {
            $(el_id).unbind('keydown');
            $(el_id).keydown(function (e) {
                if (e.keyCode == 173) {
                    //dashes
                    if (($(this).val().match(/-/g) || []).length == 1) {
                        e.preventDefault();
                    }
                }
                if ($.inArray(e.keyCode, [46, 8, 9, 27, 13, 110, 173]) !== -1 ||
                    (e.keyCode == 65 && e.ctrlKey === true) ||
                    (e.keyCode >= 35 && e.keyCode <= 39)) {
                    return;
                }
                if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
                    e.preventDefault();
                }
            });
        }

        function line_loaderCss() {
            var styleSheet = document.createElement("link")
            styleSheet.setAttribute("id", "lineLoader");
            styleSheet.href = "/onlineorder/js/konnek.api/loader.css";
            styleSheet.rel = "stylesheet";
            if ($("#lineLoader").length == 0) {
                document.head.appendChild(styleSheet);
            }
        }

        function testingDisplay() {
            //loading css
            // Your CSS as text
            if (getQueryStringByName("konnektiveTest") == "test") {
                $("div#testing").remove();//remove to append new;
                var styles = "div#testing{background:rgba(0, 0, 0, 0.5);position:fixed;width:40%;top:0;z-index:1000}#testing table {border: 1px solid #ccc;border-collapse: collapse;margin: 0;padding: 0;width: 100%;table-layout: fixed;}#testing div {font-size: 1em;text-align:center;color:white;}#testing table tr {background-color: rgba(255, 255, 255, 0.9);border: 1px solid #ddd;padding: .35em;}#testing table th, #testing table td {padding: .625em;text-align: center;}#testing table th {font-size: .85em;letter-spacing: .1em;text-transform: uppercase;}@media screen and (max-width: 600px) {div#testing{top:unset;width:100%;bottom:0;}#testing table {border: 0;}#testing table caption {font-size: 1em;}#testing table thead {border: none;clip: rect(0 0 0 0);height: 1px;margin: -1px;overflow: hidden;padding: 0;position: absolute;width: 1px;}#testing table tr {border-bottom: 3px solid #ddd;display: block;margin-bottom: .625em;}#testing table td {border-bottom: 1px solid #ddd;display: block;font-size: .6em;text-align: right;}#testing table td::before {content: attr(data-label);float: left;font-weight: bold;text-transform: uppercase;}#testing table td:last-child {border-bottom: 0;}}";
                var styleSheet = document.createElement("style")
                styleSheet.setAttribute("id", "devTesting");
                styleSheet.innerText = styles.toString();

                if ($("#devTesting").length == 0) {
                    document.head.appendChild(styleSheet);
                }

                var trData = `<div id="testing">
                            <div>Item(s) Selected</div>
                            <table>
                                <thead>
                                    <tr>
                                        <th scope="col">Prod Name</th>
                                        <th scope="col">Price</th>
                                        <th scope="col">Ship Price</th>
                                        <th scope="col">Billing Type</th>

                                    </tr>
                                </thead>
                            <tbody>`;

                $("input[type='hidden'].konnecktive-order").each(function () {
                    var option = $("input.product-option[campaignproductid='" + $(this).val() + "']");
                    if (option.length != 0 && $("#productOption-container input[type='radio'].product-selected").length != 0) {
                        trData += `<tr>
                            <td data-label="Prod Name">`+ option.attr('product-name') + `</td>
                            <td data-label="Price">`+ $(this).attr('price') + `</td>
                            <td data-label="Shipping">`+ $(this).attr('shippingprice') + `</td>
                            <td data-label="Billing Type">`+ option.attr('billingcycletype') + `</td>

                        </tr>`;
                    }
                });

                if ($("#productOption-container input[type='radio'].product-selected").length == 0) {
                    trData += `<tr>
                                <td data-label="Prod Name" style="color:red;" colspan="3">No Product Option Selected</td>
                              </tr>`;
                }

                trData += `</tbody>
                        </table>
                        </div>`;
                $("body:first").append(trData);
            }
        }


        function showStraightSaleOption() {

            var el_id = 'prepaid-option-modal';
            $("#" + el_id + " .close-pop").click(function () {
                $("#" + el_id).trigger('closeModal');
            })
            $(".ss_price").html($("input.product-option[campaignproductid='" + api.get_ss_id() + "']").attr("price")); //get the price for straight sale product
            if ($('#' + el_id).length > 0) {
                //has pop-up modal override or modal created previously, then use that pop-up modal instead
                $('#' + el_id).easyModal({
                    overlay: 0.4,
                    overlayClose: false,
                    closeOnEscape: false,
                    autoOpen: true,
                    onOpen: function () {
                        $('#' + el_id).css({ 'zIndex': 99999 });
                        $('#' + el_id + ' .btn-non-prepaid-card').unbind('click');
                        $('#' + el_id + ' .btn-non-prepaid-card').bind('click', function (e) {
                            $('#' + el_id).trigger('closeModal');//when customer select to enter a non-prepaid card, just close the pop-up
                            e.preventDefault();
                        });
                        $('#' + el_id + ' .btn-continue-non-trial').unbind('click');
                        $('#' + el_id + ' .btn-continue-non-trial').bind('click', function (e) {

                            $("input.product-option[campaignproductid='" + api.get_ss_id() + "']").trigger("mouseup");//trigger this to select non trial product if prepaid is used
                            $('#' + el_id).trigger('closeModal');
                            $('form').submit();//submit the form if customer selected the straight sale offer
                            e.preventDefault();
                        });
                    },
                    updateZIndexOnOpen: false,
                    'zIndex': function () {
                        return 100;
                    }
                });
            }
            else {
                var html = '<div id="' + el_id + '" style="font-family:arial;color:#000;display:none;background:rgb(40, 40, 40);padding: 12px;border-radius: 13px;">' +
                    '<p style="color:white!important;">Unfortunately, we are unable to accept prepaid cards for trial offers,<br/>But we don\'t want you to miss out on this amazing deal!</p><br/><br/>' +
                    '<div style="text-align:center;"><input type="button" class="btn-continue-non-trial" style="padding:10px!important;" value="Continue with non-trial offer">&nbsp;&nbsp;' +
                    '<input type="button" class="btn-non-prepaid-card" style="padding:10px!important;" value="Enter non-prepaid card"></div>' +
                    '</div>';
                $('body').append(html).promise().done(function () {
                    $('#' + el_id).easyModal({
                        overlay: 0.4,
                        overlayClose: false,
                        closeOnEscape: false,
                        autoOpen: true,
                        onOpen: function () {
                            $('#' + el_id).css({ 'zIndex': 99999 });
                            $('#' + el_id + ' .btn-non-prepaid-card').unbind('click');
                            $('#' + el_id + ' .btn-non-prepaid-card').bind('click', function (e) {

                                $('#' + el_id).trigger('closeModal');//when customer select to enter a non-prepaid card, just close the pop-up
                                e.preventDefault();
                            });
                            $('#' + el_id + ' .btn-continue-non-trial').unbind('click');
                            $('#' + el_id + ' .btn-continue-non-trial').bind('click', function (e) {

                                $("input.product-option[campaignproductid='" + api.get_ss_id() + "']").trigger("mouseup");//trigger this to select non trial product if prepaid is used
                                $('#' + el_id).trigger('closeModal');
                                $('form').submit();//submit the form if customer selected the straight sale offer
                                e.preventDefault();
                            });
                        },
                        updateZIndexOnOpen: false,
                        'zIndex': function () {
                            return 100;
                        }
                    });
                });
            }

        }

        //function for psmr
        form_obj.psmr = function () {
            if (api.get_psmr_prod_id() != 0 && getQueryStringByName("fields_step") != "upsell" && getQueryStringByName("fields_step") != "thankyou") {
                var psmr_option = $('input.product-option[campaignproductid="' + api.get_psmr_prod_id() + '"]');
                var psmr_content = psmr_option.attr("productdescription");
                var opt_status = api.get_psmr_status().toLowerCase();
                var psmr_text = (opt_status == "opt-in") ? "Opt In" : "Opt Out";

                if (typeof psmr_option.attr('campaignproductid') == "undefined") {
                    // alert("PSMR product id is not defined in the campaign")
                    return false;
                }

                $("#psmr-container").html(psmr_text + "<input type='checkbox' id='opt' style='margin:0px 6px;'/>" + psmr_content);

                function addpsmrToOrder() {
                    if ($("#psmr-data").length == 0) {
                        $('<input>', {
                            type: 'hidden',
                            class: 'konnecktive-psmr-order',
                            id: 'psmr-data',
                            'value': psmr_option.attr('campaignproductid'),
                            'price': psmr_option.attr('price'),
                            'qty': psmr_option.attr('productqty'),
                            'shippingprice': psmr_option.attr('shipping-price'),
                            'productName': psmr_option.attr("product-name")
                        }).insertAfter('#prod_id');
                    }

                }

                if (opt_status == "opt-out") {
                    addpsmrToOrder();//add it as order if opt-out
                }

                $(document).on("click", "#opt", function () {
                    switch (opt_status) {
                        case "opt-in":
                            if ($("#opt").is(":checked")) {
                                $(".psmr").show();
                                addpsmrToOrder();
                            }
                            else {
                                $("input#psmr-data").remove();
                                $(".psmr").hide();
                            }

                            break;
                        case "opt-out":
                            if (!$("#opt").is(":checked")) {
                                $(".psmr").show();
                                addpsmrToOrder();
                            }
                            else {
                                $("input#psmr-data").remove();
                                $(".psmr").hide();
                            }

                            break;
                    }
                    form_obj.totalAmount();
                });
            }
        }

        function warranty() {
            if (api.get_warranty_prod_id() != 0 && getQueryStringByName("fields_step") != "upsell" && getQueryStringByName("fields_step") != "thankyou") {
                var warranty_option = $('input.product-option[campaignproductid="' + api.get_warranty_prod_id() + '"]');
                if (typeof warranty_option.attr('campaignproductid') == "undefined") {
                    // alert("Warranty product id is not defined in the campaign")
                    return false;
                }
                $(".warranty-price").html(warranty_option.attr("price"));

                $(document).on("click", "#warranty", function () {
                    if ($("#warranty").is(":checked")) {
                        $(".warranty-container").show();

                        if ($("#warranty-data").length == 0) {
                            $('<input>', {
                                type: 'hidden',
                                class: 'konnecktive-order',
                                id: 'warranty-data',
                                'value': warranty_option.attr('campaignproductid'),
                                'price': warranty_option.attr('actual_price'),
                                'qty': warranty_option.attr('productqty'),
                                'shippingprice': warranty_option.attr('shipping-price'),
                                'productName': warranty_option.attr("product-name")
                            }).insertAfter('#prod_id');
                        }


                    }
                    else {
                        $("input#warranty-data").remove();
                        $(".warranty-container").hide();
                    }
                    form_obj.totalAmount();
                });
            }

        }

        function populateProductOffer(response) {

            $("#productOption-container, #pay_source").remove();//remove if exists
            if ($("#productOption-container").length == 0) {
                $("form:first").prepend("<div style='display:none!important;' id='productOption-container'></div>");
                if ($("form").length == 0) {
                    $("body:first").prepend("<div style='display:none!important;' id='productOption-container'></div>");
                }
            }

            if ($('#prod_id').length == 0) {
                $('form:first').append('<input type="hidden" id="prod_id" class="konnecktive-order" name="product_id" value=""/>');
                if ($("form").length == 0) {
                    $('body:first').append('<input type="hidden" id="prod_id" class="konnecktive-order" name="product_id" value=""/>');
                }
            } else {
                $('#prod_id').addClass("konnecktive-order");
            }

            if ($('#pay_source').length == 0 && (getQueryStringByName("fields_step") == "" || getQueryStringByName("fields_step") == "second")) {
                $('form:first').prepend('<input type="hidden" id="pay_source" name="pay_source" value="creditcard"/>');
                if ($("form").length == 0) {
                    $('body:first').prepend('<input type="hidden" id="pay_source" name="pay_source" value="creditcard"/>');
                }
            }

            var prodOffer_Count = 0;
            var hierarchy = 1;
            var bNameDomain = (billerNameDomain == "") ? getQueryStringByName("billerNdomain") : billerNameDomain;
            var countCOfferNameOnly = 0;

            for (var i in response) {

                if (bNameDomain != "" && response[i].billerName.toLowerCase().indexOf(bNameDomain.toLowerCase()) == -1 && response[i].baseProductName.toLowerCase().indexOf("psmr") == -1) {
                    //empty/not append prod option if bNameDomain is not empty and match biller name with domain
                } else {

                    if (bNameDomain != "" && response[i].billerName.toLowerCase().indexOf(bNameDomain.toLowerCase()) != -1) {
                        countCOfferNameOnly++;//this will add if domain name found in the gateway if the campaign name value is offername only
                    }
                    //set value to the target element
                    var quantity = response[i].maxOrderQty;
                    if (response[i].maxOrderQty == null || response[i].maxOrderQty == "") {
                        quantity = 1;
                    }

                    var price_ = parseFloat(response[i].price) * parseInt(quantity);
                    var shipping_ = parseFloat(response[i].shippingPrice) * parseInt(quantity);
                    $(".currency").html(currencySymbol);
                    $(".prod_id" + response[i].campaignProductId + "_price, [data-hierarchy=" + hierarchy + "] .price").html(currencySymbol + price_.toFixed(2));
                    $(".prod_id" + response[i].campaignProductId + "_shipping, [data-hierarchy=" + hierarchy + "] .shipping-price").html(currencySymbol + shipping_.toFixed(2));

                    //set value to the target element without currencySymbol
                    $(".prod_id" + response[i].campaignProductId + "_price2, [data-hierarchy=" + hierarchy + "] .price2").html(price_.toFixed(2));
                    $(".prod_id" + response[i].campaignProductId + "_shipping2, [data-hierarchy=" + hierarchy + "] .shipping-price2").html(shipping_.toFixed(2));

                    $("[data-hierarchy=" + hierarchy + "]").attr("prodx-quantity", quantity);


                    $('<input>', {
                        type: 'radio',
                        class: 'product-option',
                        name: 'product-offers',
                        'data-hierarchy': hierarchy,
                        'campaignProductId': response[i].campaignProductId,
                        'product-name': response[i].productName,
                        'product-Type': response[i].productType,
                        'price': price_.toFixed(2),
                        'actual_price': response[i].price,
                        'shipping-price': response[i].shippingPrice,
                        'shipping-price-x-qty': shipping_.toFixed(2),
                        'productQty': quantity,
                        'baseProductName': response[i].baseProductName,
                        'productSku': response[i].productSku,
                        'productDescription': response[i].productDescription,
                        'billerName': response[i].billerName,
                        'billingCycleType': response[i].billingCycleType,
                        'billerId': response[i].billerId,
                        mouseup: function () {
                            $("input[type='radio'].product-options").removeClass("product-selected");
                            $(this).addClass("product-selected");
                            $("#prod_id").val($(this).attr("campaignProductId")).addClass("konnecktive-order");

                            //this will set value to the ff classes once product option selected
                            $(".product-price").text(currencySymbol + $(this).attr("price"));//set value for product price
                            $(".prod-shipping-price").text(currencySymbol + $(this).attr("shipping-price-x-qty"));//set value for shipping price

                            //this will set value to the ff classes once product option selected without currency symbol
                            $(".product-price2").text($(this).attr("price"));//set value for product price
                            $(".prod-shipping-price2").text($(this).attr("shipping-price-x-qty"));//set value for shipping price


                            $("#prod_id").attr({
                                price: $(this).attr("actual_price"),
                                qty: $(this).attr("productQty"),
                                shippingPrice: $(this).attr("shipping-price"),
                                productName: $(this).attr("product-name"),
                                billingcycle: $(this).attr("billingCycleType"),
                                billerId: $(this).attr("billerId"),
                                billerName:  $(this).attr("billerName")
                            });

                            $('.coupon-wrapper').show();
                            $('.congrats-wrapper, .congrats-wrapper-priority').hide();
                            $(".discount-container").hide();//hide discount container class
                            $("#totalDiscount_applied").remove();//remove total discount as default
                            $(".fields_coupon, #fields_coupon").val("");

                            if (typeof ($.cookie('CouponCode')) != 'undefined') {
                                //remove the coupon code if selected other product
                                if ($.cookie('ProductOptionID') != $(this).attr("campaignProductId")) {
                                    $.removeCookie("CouponCode");
                                } else {
                                    $("#fields_coupon").val($.cookie('CouponCode'));
                                    $("#btnCoupon").trigger("click");
                                }
                            }

                            $.cookie('ProductOptionID', $(this).attr("campaignProductId"));
                            form_obj.totalAmount(); //get total amount;


                            //form_obj.customClasses();// this will execute after prices painted to elment
                        }
                    }).appendTo('#productOption-container');
                    prodOffer_Count++;
                    hierarchy++;
                }
            }

            warranty();//warranty
            if (bNameDomain != "" && countCOfferNameOnly == 0) {
                alert("ERROR: Campaign doesn't have assigned product(s) with billername/gateway containing the domain name: " + bNameDomain);
            }

            //check if the defined ids is exists in the campaign
            if ((getQueryStringByName("campaignId") == "" || getQueryStringByName("fields_step") == "second") && $("#is_intro").length == 0
                && location.pathname.toLowerCase().indexOf("/shared_pages/") == -1
                && location.pathname.toLowerCase().indexOf("upsell.html") == -1) {

                if (checkDefinedIds()) {
                    window.location.href = "index.html"; //force redirect to landing page
                    return false;
                }
            }

            //set as default selection once product offer is only 1
            if (prodOffer_Count == 1) {
                $("#productOption-container input").eq(0).trigger("mouseup");
            } else if ($("#prod_id").length != 0) {
                if ($("input.product-option[campaignproductid='" + $("#prod_id").val() + "']").length != 0) {
                    $("input.product-option[campaignproductid='" + $("#prod_id").val() + "']").trigger("mouseup");//trigger as default product selected
                } else if ($("#prod_id").val() != "" && $("input.product-option[campaignproductid='" + $("#prod_id").val() + "']").length == 0 && $("input.product-option").length != 0) {
                    alert("ERROR: Campaign Product Id :" + $("#prod_id").val() + " is not assigned in this campaign");
                }

            }

            //check if there is a product option selected as default
            if ($("#productOption-container input[type='radio'].product-selected").length == 0) {
                testingDisplay();//call this
            }
            form_obj.customCode();// this will execute after prices painted to elment


        }

        form_obj.disableBackHistory = function(){
           if (typeof window.history == "object") {
                window.history.pushState(null, null, window.location.href);
                window.onpopstate = function (e) {
                    e.preventDefault();
                    window.history.go(1);                  
                };
           }       
        }

        form_obj.PageEvent = function (steps) {
            if (getQueryStringByName("PayerID") == "" || getQueryStringByName("paypalAccept") == "") {
                api.importClick();//import click crm.konnektive
            }

            switch (steps) {
                case "welcome":
                    api.queryCampaign(function (data) {
                        if (req_response(data)) {
                            //check the setup if corrent thru campaign name
                            if (!form_obj.checkCampaignName(data.message.data[api.getCompaignId()].campaignName)) {
                                return false;
                            }

                            currencySymbol = data.message.data[api.getCompaignId()].currencySymbol;//set currency symbol accessible to all

                            //works only with NORMAL offer type
                            if (api.getOfferType().toUpperCase() == "NORMAL") {
                                populateProductOffer(getProductOffers(data.message.data[api.getCompaignId()].products, "OFFER"));//create product option on the page by calling this function
                            }
                            form_obj.hideProgress();  //hide loading
                        } else {
                            alert("ERROR: " + data.message + ".")
                        }
                    });

                    break;
                case "first":
                    form_obj.submitHandler();//submitHandler
                    api.queryCampaign(function (data) {
                        if (req_response(data)) {
                            //check the setup if corrent thru campaign name
                            if (!form_obj.checkCampaignName(data.message.data[api.getCompaignId()].campaignName)) {
                                return false;
                            }

                            // if (api.get_psmrToBoss() == 1 && api.get_psmrBoss_key() != "" && getQueryStringByName("psrm_keycode") == "") {
                            //     form_obj.test_psmr_api();//test psmr_api_key
                            // }

                            currencySymbol = data.message.data[api.getCompaignId()].currencySymbol;//set currency symbol accessible to all

                            addCountries(data.message.data[api.getCompaignId()].countries);//add countries and states
                            form_obj.listUpsells = getProductOffers(data.message.data[api.getCompaignId()].products, "UPSALE");//stored upsells to listUpsells

                            firstStepValidation(checkoutType);
                            if (checkoutType == "one-page") {
                                if ($('#cc_number').length == 0) {
                                    error_msg += '- This is a one-page checkout offer.  You should add customer credit card fields on this page.';
                                }
                                secondStepValidation();

                                //works only with NORMAL offer type
                                if (api.getOfferType().toUpperCase() == "NORMAL") {
                                    populateProductOffer(getProductOffers(data.message.data[api.getCompaignId()].products, "OFFER"));//create product option on the page by calling this function
                                }
                            }

                            form_obj.hideProgress();  //hide loading
                        } else {
                            alert("ERROR: " + data.message + ".")
                        }
                    });

                    break;

                case "second":
                    form_obj.submitHandler();//submitHandler
                    api.queryCampaign(function (data) {
                        if (req_response(data)) {
                            // if (api.get_psmrToBoss() == 1 && api.get_psmrBoss_key() != "" && getQueryStringByName("psrm_keycode") == "") {
                            //     form_obj.test_psmr_api();//test psmr_api_key
                            // }
                            //check the setup if corrent thru campaign name
                            // if(!form_obj.checkCampaignName(data.message.data[api.getCompaignId()].campaignName)){
                            //     return false;
                            // }

                            currencySymbol = data.message.data[api.getCompaignId()].currencySymbol;//set currency symbol accessible to all

                            form_obj.listUpsells = getProductOffers(data.message.data[api.getCompaignId()].products, "UPSALE");//stored upsells to listUpsells

                            if ($('#cc_number').length == 0) {
                                error_msg += '- This is a one-page checkout offer.  You should add customer credit card fields on this page.';
                            }
                            secondStepValidation();
                            //works only with NORMAL offer type
                            if (api.getOfferType().toUpperCase() == "NORMAL") {
                                populateProductOffer(getProductOffers(data.message.data[api.getCompaignId()].products, "OFFER"));//create product option on the page by calling this function
                            }
                        } else {
                            alert("ERROR: " + data.message + ".")
                        }
                        form_obj.hideProgress();  //hide loading
                    });

                    break;
                case "upsell":
                    form_obj.disableBackHistory();
                    var get_shared_page = api.get_shared_page();
                    var queryCampaign2;
                    var referrer = getQueryStringByName('referrer');

                    //this will get the referrer offer once paypal
                    if (getQueryStringByName("paypalAccept") == "1") {
                        var upsell_query = sessionStorage.getItem("upsell_query");

                        get_shared_page = getQueryStringValueByName("shared_page", upsell_query);
                        api.setWithAds((getQueryStringValueByName("wAds", upsell_query).toLowerCase() === 'true'));
                        api.setCompaignId(getQueryStringValueByName("campaignId", upsell_query));
                        api.set_corp_type(getQueryStringValueByName("corp_type", upsell_query));
                        queryCampaign2 = api.queryCampaign2();
                        //console.log(api.getWithAds())
                        referrer = getQueryStringValueByName("referrer", upsell_query);
                    } else {
                        queryCampaign2 = api.queryCampaign2();
                    }

                    if (get_shared_page != "") {
                        $.when(queryCampaign2, getPages_shared_setup()).done(function (data, page_setup) {
                            $("#yes-upsell-relink, #no-upsell-relink, #prod_id").remove();
                            var page_name = currentPage(), prod_id = "", yes_link = "", no_link = "", page_setup_error = 0;
                            var folder_name = (get_shared_page.indexOf("/") != -1) ? get_shared_page.substring(get_shared_page.lastIndexOf('/'), -1) + "/" : "";

                            if (typeof page_setup[0][page_name] != "undefined") {
                                var obj_setup = page_setup[0][page_name];

                                //check yes property
                                if (obj_setup.hasOwnProperty("yes")) {
                                    if (obj_setup.hasOwnProperty("yes_link_referrer_path")) {
                                        if (obj_setup.yes_link_referrer_path) {
                                            yes_link = referrer + "/" + obj_setup.yes + ".html";
                                        } else {
                                            yes_link = api.get_shared_page_path() + folder_name + obj_setup.yes + ".html";
                                        }
                                    } else {
                                        yes_link = api.get_shared_page_path() + folder_name + obj_setup.yes + ".html";
                                    }

                                } else {
                                    error_msg += "- yes property is undefined  \n";
                                    page_setup_error++;
                                }

                                //check no property
                                if (obj_setup.hasOwnProperty("no")) {
                                    if (obj_setup.hasOwnProperty("no_link_referrer_path")) {
                                        if (obj_setup.no_link_referrer_path) {
                                            no_link = referrer + "/" + obj_setup.no + ".html";
                                        } else {
                                            no_link = api.get_shared_page_path() + folder_name + obj_setup.no + ".html";
                                        }

                                    } else {
                                        no_link = api.get_shared_page_path() + folder_name + obj_setup.no + ".html";
                                    }
                                } else {
                                    error_msg += "- no property is undefined  \n";
                                    page_setup_error++;
                                }

                                //check prod_id property
                                if (obj_setup.hasOwnProperty("prod_id")) {
                                    prod_id = obj_setup.prod_id;
                                } else {
                                    error_msg += "- prod_id property is undefined  \n";
                                    page_setup_error++;
                                }

                                $("body").append("<input type='hidden' id='yes-upsell-relink' value='" + yes_link + "'/>" +
                                    "<input type='hidden' id='no-upsell-relink' value='" + no_link + "'/>" +
                                    "<input type='hidden' id='prod_id' value='" + prod_id + "'/>");

                                //this will override all link if redirected to specific offer
                                $("a[href='/'],a[href='/index.html'], a[href='/default.html']").each(function () {
                                    $(this).attr("href", referrer);
                                });

                            } else {
                                error_msg += "- " + page_name + " doesn't exists";
                            }


                            if (error_msg == "") {
                                function checkProdId() {
                                    if ($("#prod_id").length != 0) {
                                        form_obj.upsellPageCallback(data[0]);
                                    } else {
                                        setTimeout(checkProdId, 300);
                                    }
                                }
                                checkProdId();
                            } else {
                                error_msg = "Please check shared page setup for " + page_name + "\n" + error_msg;
                                alertError();
                            }

                        }).fail(function (e) {
                            alert("ERROR: Something wrong! Please contact developer.");
                        })
                    } else {

                        api.queryCampaign(form_obj.upsellPageCallback);
                    }
                    break;
                case "thankyou":
                    form_obj.disableBackHistory();
                    if (getQueryStringByName('referrer') != "") {
                        //this will override all link if redirected to specific offer
                        $("a[href='/'],a[href='/index.html'], a[href='/default.html']").each(function () {
                            $(this).attr("href", getQueryStringByName('referrer'));
                        });
                    }

                    api.queryOrder({}, form_obj.thankyouPage);

                    break;
                default:
                    window.location.href = "index.html";
                    break;
            }
        }

        function currentPage() {
            var url = window.location.pathname;
            var filename = url.substring(url.lastIndexOf('/') + 1).split(".")[0];
            return filename;
        }

        function getPages_shared_setup() {
            var referrer = getQueryStringByName('referrer');

            //this will get the referrer offer once paypal
            if (getQueryStringByName("paypalAccept") == "1") {
                var upsell_query = sessionStorage.getItem("upsell_query");
                referrer = getQueryStringValueByName("referrer", upsell_query);
                if (referrer == "/") {
                    referrer = "";
                }
            }
            return $.ajax({
                url: ((getQueryStringByName("referrer") == "/") ? "" : referrer) + "/shared_page_setup/setup.json",
                contentTypeString: 'application/x-www-form-urlencoded',
                dataType: 'json',
                async: true
            });
        }

        function secondStepValidation() {
            var query, keycode, strQuery, country;
            keycode = getQueryStringByName('fields_keycode');

            if ($('#cvv-link').length == 0) {
                error_msg += '- Please add an anchor tag id="cvv-link" with "(What\'s this?)" as the text content.\n\n';
            }
            if (checkoutType == 'compact') {//if compact checkout type (billing info is on payment page)
                error_msg += checkField('fields_address1', 'text', true, false);
                error_msg += checkField('fields_city', 'text', true, false);
                error_msg += checkField('fields_state', 'select', true, false);
                error_msg += checkField('fields_zip', 'text', false, false);
                setInputDigit('#fields_zip');
                setInputDigit('#fields_zip2');
                addStatesProvince('#fields_state');
            }
            error_msg += checkField('cc_type', 'select', true, false);
            error_msg += checkField('cc_number', 'text', false, false);
            error_msg += checkField('fields_expmonth', 'select', true, false);
            error_msg += checkField('fields_expyear', 'select', true, false);
            error_msg += checkField('cc_cvv', 'password', true, false);
            addPaymentOption('#cc_type');
            if ($('#chkboxSameAddress').length != 0) {
                $('#chkboxSameAddress').prop('checked', true);
                $('#billingAddress').hide();
            }
            if (getQueryStringByName('fields_country') != '') {
                FormSubmitValidation($.trim(getQueryStringByName('fields_country')));
            }
            else if ($('.fields_country').length != 0) {
                FormSubmitValidation($.trim($('fields_country').val()));
            }
            PreparePage();
        }

        // function selectProdOption(el,target_el){
        //     if(el.attr("id")=="prod_id"){
        //         target_el.trigger("mouseup"); //update the product selection
        //     }else{
        //         //if other prod_id example warranty option
        //         el.val(target_el.attr("campaignproductid")).attr({
        //             price: target_el.attr("price"),
        //             qty: target_el.attr("productQty"),
        //             shippingPrice: target_el.attr("shipping-price"),
        //             productName: target_el.attr("product-name")
        //         });
        //     }
        // }

        function TriggerChange(parentField, childField) {
            $("#pay_source").val("creditcard");//this is to set back to creditcart the paysource
            //this loop will revert back to select product option that doesn't assign for paypal gateway
            // $("input[type='hidden'].konnecktive-order").each(function(){
            //     var non_paypal_prod= $("input.product-option[campaignproductid='"+$(this).val()+"']").attr("product-name"),
            //         target_el = $("input.product-option[product-name='"+non_paypal_prod+"']").not("[billername*='Paypal']");
            //         selectProdOption($(this),target_el);
            // });
            if ($("#psmr-data").length == 0 && form_obj.psmr_ok) {
                form_obj.psmr();
            }
            testingDisplay();

            if ($("#fields_country_select").val() == "CA") {
                $("#fields_zip").attr({ 'inputmode': 'verbatim', 'pattern': '[A-Za-z0-9]*' });//#37374

            } else {
                $("#fields_zip").attr({ 'inputmode': 'numeric', 'pattern': '[0-9]*' });
            }

            $('#' + childField).val($('#' + parentField).val());
        }

        //checks if form field exists and check if it is using the right field type or contains a value if it is required to have a value
        function checkField(el_id, el_type, checkType, checkValue) {
            var result = '';
            if ($('#' + el_id).length > 0) {
                if (!$('#' + el_id).is("select")) {// the input field is not a select
                    if ($('#' + el_id).attr("type") != el_type && checkType == true) {
                        $('#' + el_id).attr("type", el_type);//change type to what it should be
                    }

                    if ($('#' + el_id).attr("id") != $('#' + el_id).attr("name") && el_type != 'radio') {
                        $('#' + el_id).attr("name", $('#' + el_id).attr("id"));//copy id to name attribute
                    }

                    if (!$('#' + el_id).val() && checkValue == true) {
                        result = '- ' + el_id + ' [type="' + el_type + '"] should have a value.\n';
                    }
                }
                else {
                    $('#' + el_id).attr("name", $('#' + el_id).attr("id"));//copy id to name attribute
                }
                //remove any html5 required attribute if designer added it (IE 7 and below fix)
                $('#' + el_id).removeAttr('required');
            }
            else {
                result = '- ' + el_id + ' is missing.\n  Add it as type="' + el_type + '" with id="' + el_id + '" within the form element.\n\n';
            }
            return result;
        }

        function shippingUpdateValidation(checkoutType) {
            error_msg += checkField('fields_fname', 'text', true, false);
            error_msg += checkField('fields_lname', 'text', true, false);
            if (checkoutType != 'compact') {//if normal or one-page checkout (billing info is not on payment page)
                error_msg += checkField('fields_address1', 'text', true, false);
                error_msg += checkField('fields_city', 'text', true, false);
                error_msg += checkField('fields_state', 'select', true, false);
                error_msg += checkField('fields_zip', 'text', false, false);
                setInputDigit('#fields_zip');
                setInputDigit('#fields_zip2');
            }

            PreparePage();
        }

        function firstStepValidation(checkoutType) {
            error_msg += checkField('fields_fname', 'text', true, false);
            error_msg += checkField('fields_lname', 'text', true, false);
            if (checkoutType != 'compact') {//if normal or one-page checkout (billing info is not on payment page)
                error_msg += checkField('fields_address1', 'text', true, false);
                error_msg += checkField('fields_city', 'text', true, false);
                error_msg += checkField('fields_state', 'select', true, false);
                error_msg += checkField('fields_zip', 'text', false, false);
                setInputDigit('#fields_zip');
                setInputDigit('#fields_zip2');
            }
            error_msg += checkField('fields_phone', 'text', false, false);
            error_msg += checkField('fields_email', 'text', true, false);
            //initialize form field change events if there are 2 signup forms
            $("#fields_fname").change(function () {
                TriggerChange('fields_fname', 'fields_fname2');
            });
            $("#fields_fname2").change(function () {
                TriggerChange('fields_fname2', 'fields_fname');
            });
            $("#fields_lname").change(function () {
                TriggerChange('fields_lname', 'fields_lname2');
            });
            $("#fields_lname2").change(function () {
                TriggerChange('fields_lname2', 'fields_lname');
            });
            $("#fields_address1").change(function () {
                TriggerChange('fields_address1', 'fields_address12');
            });
            $("#fields_address12").change(function () {
                TriggerChange('fields_address12', 'fields_address1');
            });
            $("#fields_address2").change(function () {
                TriggerChange('fields_address2', 'fields_address22');
            });
            $("#fields_address22").change(function () {
                TriggerChange('fields_address22', 'fields_address2');
            });
            $("#fields_city").change(function () {
                TriggerChange('fields_city', 'fields_city2');
            });
            $("#fields_city2").change(function () {
                TriggerChange('fields_city2', 'fields_city');
            });
            $("#fields_zip").change(function () {
                TriggerChange('fields_zip', 'fields_zip2');
            });
            $("#fields_zip2").change(function () {
                TriggerChange('fields_zip2', 'fields_zip');
            });
            $("#fields_phone").change(function () {
                TriggerChange('fields_phone', 'fields_phone2');
            });
            $("#fields_phone2").change(function () {
                TriggerChange('fields_phone2', 'fields_phone');
            });
            $("#fields_email").change(function () {
                TriggerChange('fields_email', 'fields_email2');
            });
            $("#fields_email2").change(function () {
                TriggerChange('fields_email2', 'fields_email');
            });
            $("#fields_state").change(function () {
                TriggerChange('fields_state', 'fields_state2');
            });
            $("#fields_state2").change(function () {
                TriggerChange('fields_state2', 'fields_state');
            });
            $("#fields_country_select").change(function () {
                TriggerChange('fields_country_select', 'fields_country_select2');
            });
            $("#fields_country_select2").change(function () {
                TriggerChange('fields_country_select2', 'fields_country_select');
            });
            PreparePage();
        }

        function unacceptedToTrial(cc) {
            if (api.get_trial_pid() == $("#prod_id").val() && api.get_restrict_trial_cc().toLowerCase().indexOf(cc) != -1) {
                alert("Cards (" + api.get_restrict_trial_cc() + ") are not supported for trial products!");
                $("#cc_number").val('');
                return true;
            }
            return false;
        }

        function checkCardType(e) {
            if (!$("#cc_number").val() && !$.isNumeric($("#cc_number").val())) {
                $('.visa').removeClass("card-on");
                $('.mastercard').removeClass("card-on");
                $('.label-visa').removeClass("blue");
                $('.label-mastercard').removeClass("blue");
            }
            else {
                var firstChar = $("#cc_number").val().substr(0, 1);
                if (firstChar.length > 0 && /^-?\d+$/.test(firstChar)) {
                    switch (parseInt(firstChar)) {
                        case 4:
                            result = 'visa';
                            $('.visa').addClass("card-on");
                            $('.label-visa').addClass("blue");
                            $('.discover, .mastercard, .amex').removeClass("card-on");
                            $('#cc_type').val("visa");
                            $('#cc_cvv').attr('maxlength', '3');
                            break;
                        case 5:
                            result = 'mastercard';
                            $('.mastercard').addClass("card-on");
                            $('.label-mastercard').addClass("blue");
                            $('.visa, .discover, .amex').removeClass("card-on");
                            $('#cc_type').val("mastercard");
                            $('#cc_cvv').attr('maxlength', '3');
                            break;
                        case 6:
                            result = 'discover';
                            $('.discover').addClass("card-on");
                            $('.label-discover').addClass("blue");
                            $('.visa, .mastercard, .amex').removeClass("card-on");
                            $('#cc_type').val("discover");
                            $('#cc_cvv').attr('maxlength', '3');
                            break;
                        case 3:
                            result = 'amex';
                            $('.amex').addClass("card-on");
                            $('.label-amex').addClass("blue");
                            $('.visa, .mastercard, .discover').removeClass("card-on");
                            $('#cc_type').val("amex");
                            $('#cc_cvv').attr('maxlength', '4');
                            break;
                        case 0:
                        case 7:
                            result = 'visa';
                            $('#cc_type').val("visa");
                            break;
                        default:

                            $('#cc_type').val("");
                            $('.visa, .mastercard, .discover, .amex').removeClass("card-on");
                            $('.label-visa, .label-mastercard, .label-discover, .label-amex').removeClass("blue");
                            if (typeof (e) !== 'undefined') {
                                if (e.type == 'keyup') {
                                    alert("Only Visa, Mastercards, Discover and Amex are supported!");
                                }
                            }
                            $("#cc_number").val('');
                    }
                }
                unacceptedToTrial(result);
            }
        }

        //adds cc payment type to cc_type
        function addPaymentOption(el_id) {
            if ($(el_id).length > 0) {
                $(el_id).empty();
                $(el_id).append(
                    $('<option></option>').val('').html('Select'));
                $(el_id).append(
                    $('<option></option>').val('visa').html('VISA'));
                $(el_id).append(
                    $('<option></option>').val('mastercard').html('MASTERCARD'));
                $(el_id).append(
                    $('<option></option>').val('amex').html('AMEX'));
                $(el_id).append(
                    $('<option></option>').val('discover').html('DISCOVER'));
            }
        }

        function PreparePage() {
            if (error_msg != '') {
                alert('NOTE TO DEVELOPER/DESIGNER:\n\n' + error_msg);
            }

            $('#cc_number').attr('maxlength', '16');
            $('#cc_cvv').attr('maxlength', '4');
            $('#cc_cvv').attr('autocomplete', 'off');
            $('#cc_cvv').attr('autocorrect', 'off');
            addYears('#fields_expyear', 20);
            addMonths('#fields_expmonth');
            setInputDigit('#cc_number');
            setInputDigit('#cc_cvv');

            //set element binds
            $("#fields_expyear").bind("change", function () {
                $('#fields_expmonth').valid();
            });
            $("#fields_expmonth").bind("change", function () {
                $('#fields_expyear').valid();
            });
            $('#cc_number').bind('keyup change', function (e) {
                if ($.trim($("#cc_number").val()) != '') {
                    checkCardType(e);
                }
                else {
                    $('#cc_type').val("");
                    $('.visa, .mastercard, .amex, .discover').removeClass("card-on");
                    $('.label-visa, .label-mastercard, .label-amex, .label-discover').removeClass("blue");
                }
                $('#cc_type').trigger('click');
            });

            $('#cc_type').change(function () {
                var cardNumberFirstNumber = $('#cc_number').val().substr(0, 1);
                if (cardNumberFirstNumber.length > 0 && /^-?\d+$/.test(cardNumberFirstNumber)) {
                    switch (parseInt(cardNumberFirstNumber.substr(0, 1))) {
                        case 4: $('#cc_type').val("visa"); break;
                        case 5: $('#cc_type').val("mastercard"); break;
                        case 6: $('#cc_type').val("discover"); break;
                        case 3: $('#cc_type').val("amex"); break;
                    }
                }
            });

            if ($.trim($("#cc_number").val()) != '') {
                checkCardType();
            }
            //set validator custom methods
            var invalidMsg = '- Invalid phone number';

            $.validator.addMethod('phoneValidate', function (value, element, params) {
                var result = this.optional(element);
                if ($.trim(value) == '') {
                    return true;
                }

                if (!api.get_geoLookUp()) {
                    //regex validation but with exemption to test phone numbers (1111111111)
                    switch (params.country) {
                        case 'AU':
                            result = result || /^[0-9][0-9]+$/.test(value) || /^[1]+$/.test(value);
                            invalidMsg = '- Invalid Phone Number - Phone number should not start with 0';
                            break;//Australia
                        case 'NZ':
                            result = result || /^[0-9][0-9]+$/.test(value) || /^[1]+$/.test(value);
                            invalidMsg = '- Invalid Phone Number - Phone number should not start with 0';
                            break;//New Zealand
                        case 'GB':
                            //UK
                            result = result || /^0[1-3578][0-9]+$/.test(value) || /^[1]+$/.test(value);
                            invalidMsg = '- Invalid Phone Number - Did you forgot to add the leading zero?';
                            break;
                        case 'FR':
                            //France
                            result = result || /^0[1-9][0-9]+$/.test(value) || /^[1]+$/.test(value);
                            invalidMsg = '- Invalid Phone Number - Did you forgot to add the leading zero?';
                            break;
                        case 'PH':
                            result = result || /^[0-9][0-9]+$/.test(value) || /^[1]+$/.test(value);
                            invalidMsg = '- Invalid Phone Number - Phone number should not start with 0';
                            break;
                        default:
                            //USA and Canada
                            result = result || /^[2-9][0-9]+$/.test(value) || /^[1]+$/.test(value);
                            invalidMsg = '- Invalid Phone Number - Phone number should not start with 1';
                            break;
                    }
                } else {
                    if (parseInt(value) == 0) {
                        return false;
                    }
                    return true;
                    // if(params.country=="BE" && value.length>=10){ //belgium
                    //     return true;
                    // }else{
                    //     result=iti.isValidNumber();
                    // }

                }
                return result;
            }, function () { return invalidMsg; });
            $.validator.addMethod("FnameValidate", function (value, element) {
                return this.optional(element) || value == value.match(/^[a-zA-Z\s]+$/);
            });
            $.validator.addMethod("LnameValidate", function (value, element) {
                return this.optional(element) || value == value.match(/^[a-zA-Z\s]+$/);
            });

            $.validator.addMethod('expirationYear', function (value, element, params) {
                var payment_type = "creditcard"; //default payment option
                var result = false;
                if ($('#payment_options').length > 0) {
                    payment_type = $('#payment_options option:selected').val();
                }
                if (payment_type.toLowerCase() == 'creditcard' || payment_type.toLowerCase() == 'debitcard') {
                    var minYear = new Date().getFullYear();
                    var year = parseInt($('#' + params.year + ' option:selected').text());
                    result = (year >= minYear);
                }
                else {
                    //cod or bank deposit payment
                    result = true;
                }
                return result;
            }, '- Invalid card expiration year');

            $.validator.addMethod('expirationMonth', function (value, element, params) {
                var payment_type = "creditcard"; //default payment option
                var result = false;
                if ($('#payment_options').length > 0) {
                    payment_type = $('#payment_options option:selected').val();
                }
                if (payment_type.toLowerCase() == 'creditcard' || payment_type.toLowerCase() == 'debitcard') {
                    var minMonth = new Date().getMonth() + 1;
                    var minYear = new Date().getFullYear();
                    var month = -1;
                    if ($('#' + params.month).val() != "") {
                        month = parseInt($('#' + params.month).val());
                    }
                    var year = parseInt($('#' + params.year + ' option:selected').text());
                    result = ((year === minYear && month >= minMonth) || year > minYear && month != -1);
                }
                else {
                    //cod or bank deposit payment
                    result = true;
                }
                return result;
            }, '- Invalid card expiration month');

            $.validator.addMethod('validZipcode', function (value, element, params) {
                if (((params.country == 'USA' && $('#' + params.fields_zip).val().indexOf('-') == -1) || params.country == 'AUS') && isNaN($('#' + params.fields_zip).val())) {
                    return false;
                } else {
                    return true;
                }
            }, '- Invalid zip code');

            $.validator.addMethod('validateCreditCard', function (value, element, params) {
                var payment_type = "creditcard"; //default payment option
                var result = false;
                if ($('#payment_options').length > 0) {
                    payment_type = $('#payment_options option:selected').val();
                }
                if (payment_type.toLowerCase() == 'creditcard' || payment_type.toLowerCase() == 'debitcard') {
                    result = (value != '' && ($.isNumeric($("#cc_number").val())) && ($('#cc_number').val().length >= 13 && $('#cc_number').val().length <= 16));
                }
                else {
                    //cod or bank deposit payment
                    result = true;
                }
                return result;
            }, '- Invalid card number');

            $.validator.addMethod('validateCreditCardType', function (value, element, params) {
                var payment_type = "creditcard"; //default payment option
                var result = false;
                if ($('#payment_options').length > 0) {
                    payment_type = $('#payment_options option:selected').val();
                }
                if (payment_type.toLowerCase() == 'creditcard' || payment_type.toLowerCase() == 'debitcard') {
                    result = (value != '');
                }
                else {
                    //cod or bank deposit payment
                    result = true;
                }
                return result;
            }, '- Invalid card number');

            $.validator.addMethod('validateCreditCardCVV', function (value, element, params) {
                var payment_type = "creditcard"; //default payment option
                var result = false;
                if ($('#payment_options').length > 0) {
                    payment_type = $('#payment_options option:selected').val();
                }
                if (payment_type.toLowerCase() == 'creditcard' || payment_type.toLowerCase() == 'debitcard') {
                    result = (value != '' && ($.isNumeric($("#cc_cvv").val()) && $('#cc_cvv').val().length <= 4));
                }
                else {
                    //cod or bank deposit payment
                    result = true;
                }
                return result;
            }, '- Invalid card cvv');

            if (typeof (byPassExit) !== 'undefined') {
                byPassExit = false
            }

            //set error/valid css class use by jquery validator for every pages
            var style = document.createElement('style');
            var css = '.error { border:1px solid #b63333 !important; color: #b63333 !important;background-color:#ffdcdc !important;}' + '.valid{ background-color: #dff5d9 !important;border: 1px solid #4fb633 !important; }.placeholder { color: #aaa; }' + 'select.form-control { transition: none; }';
            style.setAttribute("type", "text/css");
            var head = document.getElementsByTagName('head')[0];
            head.appendChild(style);
            if (style.styleSheet) {   // IE only
                style.styleSheet.cssText = css;
            }
            else {   // other browsers
                style.appendChild(document.createTextNode(css));
            }
        }

        //compiled handlebars template
        function handleBars_compile(prodDisplayTemp, context) {
            var template = $("#" + prodDisplayTemp).html();
            var theTemplate = Handlebars.compile(template);
            var theCompiledHtml = theTemplate(context);
            return theCompiledHtml;

        }


        var label = {};
        var frmAlert = {}
        function FormSubmitValidation(country, isSelectInput) {
            if ($.fn.mask) {
                setInputDigit('#fields_phone');
                setInputDigit('#fields_phone2');
                setInputDigit('#fields_phone_bill');
                var min_phone_length, zip_min_length, zip_max_length, max_phone_length;
                //default label names
                label.state = 'State';
                label.firstname = 'First Name';
                label.lastname = 'Last Name';
                label.city = 'City';
                label.zip = 'Zip Code';
                label.address = 'Address';
                label.phone = 'Phone';
                label.email = 'Email';

                frmAlert.FnameValidate = '- First name should be letters only';
                frmAlert.LnameValidate = '- Last name should be letters only';
                frmAlert.phonemin = '- Phone number must consist of at least {0} digits';
                frmAlert.phonemax = '- Phone number should not be more than {0} digits';
                frmAlert.email = '- Invalid email';
                switch (country.toUpperCase()) {
                    case 'AU': //AUS
                        //Australia
                        min_phone_length = 9;
                        max_phone_length = 12;
                        zip_min_length = 4;
                        zip_max_length = 4;
                        label.state = 'State';
                        label.zip = 'Zip code';
                        setInputDigit('#fields_zip');
                        setInputDigit('#fields_zip2');
                        setInputDigit('#fields_zip_bill');

                        frmAlert.zipmin = '- ' + label.zip + ' must consist at least ' + zip_min_length + ' characters'
                        frmAlert.zipmax = '- ' + label.zip + ' must consist no more than ' + zip_max_length + ' characters'
                        break;
                    case 'CA': //CAN
                        //Canada
                        min_phone_length = 10;
                        if (api.get_geoLookUp()) {
                            max_phone_length = 12;
                            $("#fields_phone").mask("AAA AAA AAAA");
                        }

                        zip_min_length = 7;
                        zip_max_length = 7;
                        label.state = 'Province';
                        label.zip = 'Postal code';
                        setTimeout(function () {
                            $('#fields_zip, #fields_zip2, #fields_zip_bill').unbind('keydown');
                        }, 300);
                        $("#fields_zip, #fields_zip2, #fields_zip_bill").mask("AAA AAA");
                        frmAlert.zipmin = '- ' + label.zip + ' must consist at least ' + zip_min_length + ' characters';
                        frmAlert.zipmax = '- ' + label.zip + ' must consist no more than ' + zip_max_length + ' characters';
                        break;
                    case 'GB': //GBR
                        //United kingdom
                        min_phone_length = 8;  // there are exceptional UK phone cases where the number is just 8 digits
                        max_phone_length = 15; // changed max to 15 per glen's request
                        zip_min_length = 6;
                        zip_max_length = 10;
                        label.state = 'County';
                        label.zip = 'Zip code';
                        setTimeout(function () {
                            $('#fields_zip, #fields_zip2, #fields_zip_bill').unbind('keydown');
                        }, 300);

                        frmAlert.zipmin = '- ' + label.zip + ' must consist at least ' + zip_min_length + ' characters';
                        frmAlert.zipmax = '- ' + label.zip + ' must consist no more than ' + zip_max_length + ' characters';
                        break;
                    case 'FR': //FRA
                        //France
                        min_phone_length = 10;
                        max_phone_length = 12
                        zip_min_length = 5;
                        zip_max_length = 5;
                        label.state = 'Ville'
                        label.zip = 'Code postal';
                        label.firstname = 'Prénom';
                        label.lastname = 'Nom';
                        label.address = 'Adresse';
                        label.phone = 'Téléphone'
                        setInputDigit('#fields_zip');
                        setInputDigit('#fields_zip2');
                        setInputDigit('#fields_zip_bill');

                        frmAlert.zipmin = '- ' + label.zip + ' Doit comporter au moins ' + zip_min_length + ' caractères';
                        frmAlert.zipmax = '- ' + label.zip + ' Ne doit pas comporter plus de ' + zip_max_length + ' caractères';
                        frmAlert.phonemin = '- Le numéro de téléphone doit comporter au moins {0} chiffres';
                        frmAlert.phonemax = '- Le numéro de téléphone ne doit pas dépasser {0} chiffres';
                        frmAlert.FnameValidate = '- ' + label.firstname + ' Ne doivent être que des lettres';
                        frmAlert.LnameValidate = '- ' + label.lastname + ' Ne doivent être que des lettres';
                        frmAlert.email = '- Invalide ' + label.email;
                        break;
                    case 'PH': //PHL
                        //Phlippines
                        min_phone_length = 10;
                        max_phone_length = 11;
                        zip_min_length = 4;
                        zip_max_length = 4;
                        label.state = 'Province';
                        label.zip = 'Postal code';
                        setTimeout(function () {
                            $('#fields_zip, #fields_zip2, #fields_zip_bill').unbind('keydown');
                        }, 300);
                        frmAlert.zipmin = '- ' + label.zip + ' must consist at least ' + zip_min_length + ' digits';
                        frmAlert.zipmax = '- ' + label.zip + ' must consist no more than ' + zip_max_length + ' digits';
                        break;
                    case 'SG': //SGP
                        //Singapore
                        min_phone_length = 8;
                        max_phone_length = 12;
                        zip_min_length = 6;
                        zip_max_length = 6;
                        label.state = 'Region';
                        label.zip = 'Postal code';
                        setTimeout(function () {
                            $('#fields_zip, #fields_zip2, #fields_zip_bill').unbind('keydown');
                        }, 300);
                        frmAlert.zipmin = '- ' + label.zip + ' must consist at least ' + zip_min_length + ' digits';
                        frmAlert.zipmax = '- ' + label.zip + ' must consist no more than ' + zip_max_length + ' digits';
                        break;
                    case 'IE': //IRL
                        //Ireland
                        min_phone_length = 9;
                        max_phone_length = 12;
                        zip_min_length = 5;
                        zip_max_length = 8;
                        label.state = 'State';
                        label.zip = 'Postal code';
                        setInputDigit('#fields_zip');
                        setInputDigit('#fields_zip2');
                        setInputDigit('#fields_zip_bill');
                        setTimeout(function () {
                            $('#fields_zip, #fields_zip2, #fields_zip_bill').unbind('keydown');
                        }, 300);

                        frmAlert.zipmin = '- ' + label.zip + ' must consist at least ' + zip_min_length + ' characters'
                        frmAlert.zipmax = '- ' + label.zip + ' must consist no more than ' + zip_max_length + ' characters'
                        break;
                    case 'NZ': //NZL
                        //New Zealand
                        min_phone_length = 7;
                        max_phone_length = 12;
                        zip_min_length = 4;
                        zip_max_length = 5;
                        label.state = 'State';
                        label.zip = 'Zip code';
                        setInputDigit('#fields_zip');
                        setInputDigit('#fields_zip2');
                        setInputDigit('#fields_zip_bill');

                        frmAlert.zipmin = '- ' + label.zip + ' must consist at least ' + zip_min_length + ' characters'
                        frmAlert.zipmax = '- ' + label.zip + ' must consist no more than ' + zip_max_length + ' characters'
                        break;
                    case 'ZA': //ZAF
                        //South Africa
                        min_phone_length = 9;
                        max_phone_length = 12;
                        zip_min_length = 4;
                        zip_max_length = 4;
                        label.state = 'State';
                        label.zip = 'Zip code';
                        setInputDigit('#fields_zip');
                        setInputDigit('#fields_zip2');
                        setInputDigit('#fields_zip_bill');

                        frmAlert.zipmin = '- ' + label.zip + ' must consist at least ' + zip_min_length + ' characters'
                        frmAlert.zipmax = '- ' + label.zip + ' must consist no more than ' + zip_max_length + ' characters'
                        break;

                    case 'ES': //ESP
                        min_phone_length = 8;
                        max_phone_length = 12;
                        zip_min_length = 4;
                        zip_max_length = 5;
                        label.state = 'State';
                        label.zip = 'Zip code';
                        setInputDigit('#fields_zip');
                        setInputDigit('#fields_zip2');
                        setInputDigit('#fields_zip_bill');

                        frmAlert.zipmin = '- ' + label.zip + ' must consist at least ' + zip_min_length + ' characters'
                        frmAlert.zipmax = '- ' + label.zip + ' must consist no more than ' + zip_max_length + ' characters'
                        break;


                    case 'CL': //CHL
                        min_phone_length = 9;
                        max_phone_length = 12;
                        zip_min_length = 5;
                        zip_max_length = 7;
                        label.state = 'State';
                        label.zip = 'Zip code';
                        setInputDigit('#fields_zip');
                        setInputDigit('#fields_zip2');
                        setInputDigit('#fields_zip_bill');

                        frmAlert.zipmin = '- ' + label.zip + ' must consist at least ' + zip_min_length + ' characters'
                        frmAlert.zipmax = '- ' + label.zip + ' must consist no more than ' + zip_max_length + ' characters'
                        break;

                    case 'CO': //COL
                        min_phone_length = 8;
                        max_phone_length = 12;
                        zip_min_length = 5;
                        zip_max_length = 6;
                        label.state = 'State';
                        label.zip = 'Zip code';
                        setInputDigit('#fields_zip');
                        setInputDigit('#fields_zip2');
                        setInputDigit('#fields_zip_bill');

                        frmAlert.zipmin = '- ' + label.zip + ' must consist at least ' + zip_min_length + ' characters'
                        frmAlert.zipmax = '- ' + label.zip + ' must consist no more than ' + zip_max_length + ' characters'
                        break;

                    case 'MX': //MEX
                        min_phone_length = 9;
                        max_phone_length = 10;

                        if (api.get_geoLookUp()) {
                            max_phone_length = 12;
                            $("#fields_phone").mask("AA AAAA AAAA");
                        }

                        zip_min_length = 4;
                        zip_max_length = 5;
                        label.state = 'State';
                        label.zip = 'Zip code';
                        setInputDigit('#fields_zip');
                        setInputDigit('#fields_zip2');
                        setInputDigit('#fields_zip_bill');

                        frmAlert.zipmin = '- ' + label.zip + ' must consist at least ' + zip_min_length + ' characters'
                        frmAlert.zipmax = '- ' + label.zip + ' must consist no more than ' + zip_max_length + ' characters'
                        break;
                    case 'PE': //PER
                        min_phone_length = 9;
                        max_phone_length = 12;
                        zip_min_length = 4;
                        zip_max_length = 5;
                        label.state = 'State';
                        label.zip = 'Zip code';
                        setInputDigit('#fields_zip');
                        setInputDigit('#fields_zip2');
                        setInputDigit('#fields_zip_bill');

                        frmAlert.zipmin = '- ' + label.zip + ' must consist at least ' + zip_min_length + ' characters'
                        frmAlert.zipmax = '- ' + label.zip + ' must consist no more than ' + zip_max_length + ' characters'
                        break;

                    case 'CR':
                        min_phone_length = 8;
                        max_phone_length = 12;
                        if (api.get_geoLookUp()) {
                            max_phone_length = 12;
                            $("#fields_phone").mask("AAAA AAAA");
                        }

                        $("#fields_zip, #fields_zip2, #fields_zip_bill").unmask();
                        break;

                    //star here
                    case 'SE':
                        //Sweden
                        min_phone_length = 8;
                        max_phone_length = 12;
                        zip_min_length = 5;
                        zip_max_length = 5;
                        label.state = 'State';
                        label.zip = 'Zip code';
                        setInputDigit('#fields_zip');
                        setInputDigit('#fields_zip2');
                        setInputDigit('#fields_zip_bill');
                        $("#fields_zip, #fields_zip2, #fields_zip_bill").unmask();
                        frmAlert.zipmin = '- ' + label.zip + ' must consist at least ' + zip_min_length + ' characters'
                        frmAlert.zipmax = '- ' + label.zip + ' must consist no more than ' + zip_max_length + ' characters'
                        break;

                    case 'HU':
                        //Hungary
                        min_phone_length = 8;
                        max_phone_length = 12;
                        zip_min_length = 4;
                        zip_max_length = 4;
                        label.state = 'State';
                        label.zip = 'Zip code';
                        setInputDigit('#fields_zip');
                        setInputDigit('#fields_zip2');
                        setInputDigit('#fields_zip_bill');
                        $("#fields_zip, #fields_zip2, #fields_zip_bill").unmask();
                        frmAlert.zipmin = '- ' + label.zip + ' must consist at least ' + zip_min_length + ' characters'
                        frmAlert.zipmax = '- ' + label.zip + ' must consist no more than ' + zip_max_length + ' characters'
                        break;

                    case 'AT':
                        //Austria
                        zip_min_length = 4;
                        zip_max_length = 4;
                        label.state = 'State';
                        label.zip = 'Zip code';
                        setInputDigit('#fields_zip');
                        setInputDigit('#fields_zip2');
                        setInputDigit('#fields_zip_bill');
                        $("#fields_zip, #fields_zip2, #fields_zip_bill").unmask();
                        frmAlert.zipmin = '- ' + label.zip + ' must consist at least ' + zip_min_length + ' characters'
                        frmAlert.zipmax = '- ' + label.zip + ' must consist no more than ' + zip_max_length + ' characters'
                        break;

                    case 'DK': //denmark
                        min_phone_length = 8;
                        max_phone_length = 12;
                        zip_min_length = 4;
                        zip_max_length = 5;
                        label.state = 'State';
                        label.zip = 'Zip code';
                        setInputDigit('#fields_zip');
                        setInputDigit('#fields_zip2');
                        setInputDigit('#fields_zip_bill');
                        $("#fields_zip, #fields_zip2, #fields_zip_bill").unmask();
                        frmAlert.zipmin = '- ' + label.zip + ' must consist at least ' + zip_min_length + ' characters'
                        frmAlert.zipmax = '- ' + label.zip + ' must consist no more than ' + zip_max_length + ' characters'
                        break;

                    case 'BE': //belgium
                        min_phone_length = 8;
                        max_phone_length = 12;
                        zip_min_length = 4;
                        zip_max_length = 5;
                        label.state = 'State';
                        label.zip = 'Zip code';
                        setInputDigit('#fields_zip');
                        setInputDigit('#fields_zip2');
                        setInputDigit('#fields_zip_bill');
                        $("#fields_zip, #fields_zip2, #fields_zip_bill").unmask();
                        frmAlert.zipmin = '- ' + label.zip + ' must consist at least ' + zip_min_length + ' characters'
                        frmAlert.zipmax = '- ' + label.zip + ' must consist no more than ' + zip_max_length + ' characters'
                        break;

                    case 'NL': //Netherlands
                        min_phone_length = 8;
                        max_phone_length = 12;
                        zip_min_length = 4;
                        zip_max_length = 6;
                        label.state = 'State';
                        label.zip = 'Zip code';
                        setTimeout(function () {
                            $('#fields_zip, #fields_zip2, #fields_zip_bill').unbind('keydown');
                        }, 300);
                        frmAlert.zipmin = '- ' + label.zip + ' must consist at least ' + zip_min_length + ' characters'
                        frmAlert.zipmax = '- ' + label.zip + ' must consist no more than ' + zip_max_length + ' characters'
                        break;

                    case 'NO': //Norway
                        min_phone_length = 8;
                        max_phone_length = 12;
                        zip_min_length = 4;
                        zip_max_length = 5;
                        label.state = 'State';
                        label.zip = 'Zip code';
                        setInputDigit('#fields_zip');
                        setInputDigit('#fields_zip2');
                        setInputDigit('#fields_zip_bill');
                        $("#fields_zip, #fields_zip2, #fields_zip_bill").unmask();
                        frmAlert.zipmin = '- ' + label.zip + ' must consist at least ' + zip_min_length + ' characters'
                        frmAlert.zipmax = '- ' + label.zip + ' must consist no more than ' + zip_max_length + ' characters'
                        break;

                    case 'PT': //PORTOGAL
                        min_phone_length = 8;
                        max_phone_length = 12;
                        zip_min_length = 4;
                        zip_max_length = 7;

                        label.state = 'State';
                        label.zip = 'Zip code';
                        setInputDigit('#fields_zip');
                        setInputDigit('#fields_zip2');
                        setInputDigit('#fields_zip_bill');
                        $("#fields_zip, #fields_zip2, #fields_zip_bill").unmask();
                        frmAlert.zipmin = '- ' + label.zip + ' must consist at least ' + zip_min_length + ' characters'
                        frmAlert.zipmax = '- ' + label.zip + ' must consist no more than ' + zip_max_length + ' characters'
                        break;

                    case 'CH'://switcherland
                        zip_min_length = 4;
                        zip_max_length = 5;

                        label.state = 'State';
                        label.zip = 'Zip code';
                        setInputDigit('#fields_zip');
                        setInputDigit('#fields_zip2');
                        setInputDigit('#fields_zip_bill');
                        $("#fields_zip, #fields_zip2, #fields_zip_bill").unmask();
                        frmAlert.zipmin = '- ' + label.zip + ' must consist at least ' + zip_min_length + ' characters'
                        frmAlert.zipmax = '- ' + label.zip + ' must consist no more than ' + zip_max_length + ' characters'
                        break;

                    default:
                        //default, US
                        min_phone_length = 10;
                        max_phone_length = 10;

                        if (api.get_geoLookUp()) {
                            max_phone_length = 12;
                            $("#fields_phone").mask("AAA AAA AAAA");
                        }
                        $("#fields_zip, #fields_zip2, #fields_zip_bill").unmask();
                        zip_min_length = 5;
                        zip_max_length = 5;
                        if ($('#fields_zip_bill').length != 0) {
                            if ($('#fields_zip_bill').val().indexOf('-') > -1) {
                                // zip_min_length = 5;
                                zip_max_length = 10;
                                ExpEntrZip_Key('#fields_zip_bill');
                            }
                            else {
                                setInputDigit('#fields_zip_bill');
                            }
                        }
                        label.state = 'State';
                        label.zip = 'Zip code';
                        setInputDigit('#fields_zip');
                        setInputDigit('#fields_zip2');
                        frmAlert.zipmin = '- ' + label.zip + ' must consist at least ' + zip_min_length + ' characters';
                        frmAlert.zipmax = '- ' + label.zip + ' must consist no more than ' + zip_max_length + ' characters';
                        break;
                }

                setInputLetters('#fields_fname');
                setInputLetters('#fields_fname2');
                setInputLetters('#fields_lname');
                setInputLetters('#fields_lname2');
                setInputLetters('#fields_city');
                setInputLetters('#fields_city2');
                setInputLetters('#fields_fname_bill');
                setInputLetters('#fields_lname_bill');
                setInputLetters('#fields_city_bill');

                $('#fields_zip, #fields_zip2, #fields_zip_bill').attr('minlength', zip_min_length);
                $('#fields_zip, #fields_zip2, #fields_zip_bill').attr('maxlength', zip_max_length);


                var rules = {
                    fields_fname: {
                        required: true,
                        FnameValidate: 'fields_fname'
                    },
                    fields_lname: {
                        required: true,
                        LnameValidate: 'fields_lname'
                    },
                    // fields_phone: {
                    //     required: true,
                    //     digits: true,
                    //     minlength: min_phone_length,
                    //     maxlength: max_phone_length,
                    //     phoneValidate: {
                    //         fields_phone: 'fields_phone',
                    //         country: country
                    //     }
                    // },
                    fields_address1: "required",
                    fields_city: "required",
                    fields_country_select: "required",
                    fields_state: "required",
                    fields_zip: {
                        required: true,
                        minlength: zip_min_length,
                        maxlength: zip_max_length,
                        validZipcode: {
                            fields_zip: 'fields_zip',
                            country: country
                        }
                    },
                    fields_email: {
                        required: true,
                        // email: true,
                        pattern: /^[-a-z0-9~!$%^&*_=+}{\'?]+(\.[-a-z0-9~!$%^&*_=+}{\'?]+)*@([a-z0-9_][-a-z0-9_]*(\.[-a-z0-9_]+)*\.(aero|arpa|biz|com|coop|edu|gov|info|int|mil|museum|name|net|org|pro|travel|mobi|[a-z][a-z])|([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}))(:[0-9]{1,5})?\s*$/i
                    },

                    payment_options: "required",
                    fields_agree: "required",
                    cc_type: {
                        validateCreditCardType: {
                            card: 'cc_type'
                        }
                    },
                    product_option: {
                        required: true
                    },
                    field_product_installment: {
                        //required: validateProductInstallmentOption,
                        validateProductInstallmentOption: {
                            required: true
                        }
                    },
                    cc_number: {
                        validateCreditCard: {
                            card: 'cc_number'
                        }
                    },
                    fields_expyear: {
                        expirationYear: {
                            month: 'fields_expmonth',
                            year: 'fields_expyear'
                        }
                    },
                    fields_expmonth: {
                        expirationMonth: {
                            month: 'fields_expmonth',
                            year: 'fields_expyear'
                        }
                    },
                    cc_cvv: {
                        validateCreditCardCVV: {
                            card: 'cc_cvv'
                        }
                    },
                }



                var ruleGroup = {
                    expiration: 'fields_expmonth fields_expyear'
                }
                var ruleMessages = {
                    fields_fname: {
                        required: '- ' + label.firstname,
                        FnameValidate: frmAlert.FnameValidate
                    },
                    fields_lname: {
                        required: '- ' + label.lastname,
                        LnameValidate: frmAlert.LnameValidate
                    },
                    // fields_phone: {
                    //     required: '- ' + label.phone,
                    //     minlength: $.validator.format(frmAlert.phonemin),
                    //     maxlength: $.validator.format(frmAlert.phonemax)
                    // },
                    fields_address1: '- ' + label.address,
                    fields_country_select: '- Country',
                    fields_city: '- ' + label.city,
                    fields_zip: {
                        required: '- ' + label.zip,
                        minlength: frmAlert.zipmin,
                        maxlength: frmAlert.zipmax
                    },
                    fields_email: {
                        required: '- ' + label.email,
                        // email: frmAlert.email,
                        pattern: frmAlert.email
                    },
                    fields_state: '- ' + label.state,
                    cc_type: '- Credit card type',
                    product_option: {
                        required: '- Choose a product option'
                    },
                    cc_cvv: {
                        required: '- CVV',
                        digits: '- Invalid CVV'
                    },
                    fields_agree: '- Agree to our terms',
                    payment_options: '- Payment options'
                }

                if (!api.get_geoLookUp()) {
                    $('#fields_phone, #fields_phone2, #fields_phone_bill').attr('minlength', min_phone_length);
                    $('#fields_phone, #fields_phone2, #fields_phone_bill').attr('maxlength', max_phone_length);

                    ruleMessages.fields_phone = {
                        required: '- ' + label.phone,
                        minlength: $.validator.format(frmAlert.phonemin),
                        maxlength: $.validator.format(frmAlert.phonemax)
                    }

                    rules.fields_phone = {
                        required: true,
                        digits: true,
                        minlength: min_phone_length,
                        maxlength: max_phone_length,
                        phoneValidate: {
                            fields_phone: 'fields_phone',
                            country: country
                        }
                    };
                } else {
                    rules.fields_phone = {
                        required: true,
                        //digits: true,
                        phoneValidate: {
                            fields_phone: 'fields_phone',
                            country: country
                        }
                    };
                }



                if ($('#fields_phone').length > 0) {
                    //if phone length entered is greater than the maximum phone length allowed, truncate
                    if ($('#fields_phone').val().length > max_phone_length) {
                        $('#fields_phone').val($('#fields_phone').val().substr(0, max_phone_length));

                    }
                }

                if ($('#chkboxSameAddress').length != 0) {
                    var billRuleMessages = {
                        fields_fname_bill: {
                            required: '- Billing ' + label.firstname,
                            FnameValidate: frmAlert.FnameValidate
                        },
                        fields_lname_bill: {
                            required: '- Billing ' + label.lastname,
                            LnameValidate: frmAlert.LnameValidate
                        },
                        fields_phone_bill: {
                            required: '- Billing ' + label.phone,
                            minlength: $.validator.format(frmAlert.phonemin),
                            maxlength: $.validator.format(frmAlert.phonemax)
                        },
                        fields_address1_bill: '- Billing ' + label.address,
                        fields_city_bill: '- Billing ' + label.city,
                        fields_zip_bill: {
                            required: '- Billing ' + label.zip,
                            minlength: frmAlert.zipmin,
                            maxlength: frmAlert.zipmax
                        },
                        fields_email_bill: {
                            required: '- Billing ' + label.email,
                            email: frmAlert.email,
                            pattern: frmAlert.email
                        },
                        fields_state_bill: '- Billing ' + label.state
                    }

                    var billRule = {
                        fields_fname_bill: {
                            required: {
                                depends: function (element) {
                                    return !$('#chkboxSameAddress').is(':checked')
                                }
                            },
                            FnameValidate: 'fields_fname_bill',
                        },
                        fields_lname_bill: {
                            required: {
                                depends: function (element) {
                                    return !$('#chkboxSameAddress').is(':checked')
                                }
                            },
                            LnameValidate: 'fields_lname_bill'
                        },
                        fields_phone_bill: {
                            required: {
                                depends: function (element) {
                                    return !$('#chkboxSameAddress').is(':checked')
                                }
                            },
                            digits: true,
                            minlength: min_phone_length,
                            maxlength: max_phone_length,
                            phoneValidate: {
                                depends: function (element) {
                                    return !$('#chkboxSameAddress').is(':checked')
                                },
                                fields_phone: 'fields_phone_bill',
                                country: country
                            }
                        },
                        fields_address1_bill: {
                            required: {
                                depends: function (element) {
                                    return !$('#chkboxSameAddress').is(':checked')
                                }
                            }
                        },
                        fields_city_bill: {
                            required: {
                                depends: function (element) {
                                    return !$('#chkboxSameAddress').is(':checked')
                                }
                            }
                        },
                        fields_state_bill: {
                            required: {
                                depends: function (element) {
                                    return !$('#chkboxSameAddress').is(':checked')
                                }
                            }
                        },
                        fields_zip_bill: {
                            required: {
                                depends: function (element) {
                                    return !$('#chkboxSameAddress').is(':checked')
                                }
                            },
                            minlength: zip_min_length,
                            maxlength: zip_max_length,
                            validZipcode: {
                                fields_zip: 'fields_zip_bill',
                                country: country
                            }
                        },
                        fields_email_bill: {
                            required: {
                                depends: function (element) {
                                    return !$('#chkboxSameAddress').is(':checked')
                                }
                            },
                            //email: true,
                            pattern: /^ [-a - z0 - 9~!$ %^&* _=+}{ \'?]+(\.[-a-z0-9~!$%^&*_=+}{\'?]+)*@([a-z0-9_][-a-z0-9_]*(\.[-a-z0-9_]+)*\.(aero|arpa|biz|com|coop|edu|gov|info|int|mil|museum|name|net|org|pro|travel|mobi|[a-z][a-z])|([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}))(:[0-9]{1,5})?\s*$/i
                        }
                    }
                    $.extend(rules, billRule);
                    $.extend(ruleMessages, billRuleMessages);
                }

                //if from fields_country_select select dropdown, remove old validation rules to apply new rules set for a country
                if (typeof isSelectInput !== 'undefined' && isSelectInput == true) {
                    var validation = $('form').validate();
                    validation.resetForm();
                    validation.settings.rules = rules;
                    validation.settings.messages = ruleMessages;
                    validation.settings.groups = ruleGroup;
                }
                else {
                    $('form').validate({
                        rules: rules,
                        messages: ruleMessages,
                        groups: ruleGroup
                    });//end of form validate
                }
            }
            else {
                setTimeout(function () {
                    FormSubmitValidation(country, isSelectInput);
                }, 100);
            }
        }

        //validate if success or error
        function req_response(data) {

            if (data.result.toLowerCase() == "success") {
                return true;
            } else {
                wasSubmitted = false;
                form_obj.hideProgress();
                return false;
            }

        }

        function isNullOrEmpty(output) {
            return (output == "" || output == "null" || output == null) ? "" : output;
        }

        //combine and alert all error msgs
        function alertError() {
            if (error_msg != "") {
                alert(error_msg);
            }
        }

        //check if price exists in the order
        function konnektiveOrderValid() {
            var count = 0;
            $("input[type='hidden'].konnecktive-order").each(function () {
                if (typeof $(this).attr("price") == "undefined") {
                    count++;
                }
            });
            if (count == 0) { return true }
            return false;
        }

        function couponCodeEvent() {
            //loading css
            // Your CSS as text
            var styles = "div#wave{display:inline;text-align:center;width:30px;height:10px}div#wave .dot{display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:7px;background:#fbfbfb;animation:1.3s linear infinite wave;position:relative;opacity:.9}div#wave .dot:nth-child(2){animation-delay:-1.1s}div#wave .dot:nth-child(3){animation-delay:-.9s}@keyframes wave{0%,100%,60%{transform:initial}30%{transform:translateY(-6px)}}";
            var styleSheet = document.createElement("style")
            styleSheet.innerText = styles.toString();
            document.head.appendChild(styleSheet);

            $('#fields_coupon').unbind().on('keypress', function (e) {
                e.stopPropagation();
                var code = e.keyCode || e.which;
                if (code == 13) {
                    e.preventDefault();
                    $('#btnCoupon').trigger('click');
                    return false;
                }
            });


            $("#btnCoupon").unbind().on("click", function (e) {
                e.stopPropagation();
                $(this).html('<div id="wave"><span class="dot"></span><span class="dot"></span><span class="dot"></span></div>');
                var coupon = $("#fields_coupon").val();
                if (coupon != "") {
                    api.orderCoupon(coupon, $("#prod_id").val(), form_obj.orderCoupon, $("#prod_id").attr("qty"));
                } else {
                    alert("Please enter coupon code");
                    $(this).text("Apply Coupon");
                }
                return false;

            });

        }

        function hasQueryURL() {
            var params = location.search;
            if (params.indexOf("?") != -1) {
                if (params.length > 1) {
                    return true;
                }
            }
            return false;
        }

        function additionalQuery() {
            var parameter = "";
            if (api.get_paypal_forceMerchantId() != 0 && getQueryStringByName("paypal_forceMerchantId") == "") {
                parameter += "&paypal_forceMerchantId=" + api.get_paypal_forceMerchantId();
            }

            if (api.get_warranty_prod_id() != 0 && getQueryStringByName("warranty_prod_id") == "") {
                parameter += "&warranty_prod_id=" + api.get_warranty_prod_id();
            }

            if (api.get_psmr_prod_id() != 0 && getQueryStringByName("psmr_prod_id") == "") {
                parameter += "&psmr_prod_id=" + api.get_psmr_prod_id() + "&psmr_status=" + api.get_psmr_status() + "&psmrToBoss=" + api.get_psmrToBoss() + "&psmrBoss_key=" + api.get_psmrBoss_key() + "&psrm_keycode=" + api.get_psrm_keycode();
            }

            if (api.get_trial_pid() != 0) {
                parameter += "&trial_pid=" + api.get_trial_pid() + "&r_trial_cc=" + api.get_restrict_trial_cc();
            }

            if (api.get_ss_id() != 0 && getQueryStringByName("ss_id") == "") {
                parameter += "&ss_id=" + api.get_ss_id() + "&ss_onSuccess=" + api.get_ss_onSuccess();
            }

            if (api.get_pixel() != "") {
                parameter += "&pixel=" + api.get_pixel();
            }

            if (api.get_shared_page() != "") {
                parameter += "&shared_page=" + api.get_shared_page();
            }

            if (billerNameDomain != "") {
                parameter += "&billerNdomain=" + billerNameDomain;
            }

            if (api.get_geoLookUp()) {
                parameter += "&geoLookUp=" + api.get_geoLookUp();
            }

            if (api.getWithAds()) {
                parameter += "&wAds=" + api.getWithAds();
            }

            /// defined aff_id for konnektive ------------------------------
            if (api.get_affiliate_id() != null) {
                parameter += "&d_aff_id=" + api.get_affiliate_id();
            }

            if (api.get_affiliate_source1() != "") {
                parameter += "&aff_s1=" + api.get_affiliate_source1();
            }

            if (api.get_affiliate_source2() != "") {
                parameter += "&aff_s2=" + api.get_affiliate_source2();
            }

            if (api.get_affiliate_source3() != "") {
                parameter += "&aff_s3=" + api.get_affiliate_source3();
            }

            if (api.get_affiliate_source4() != "") {
                parameter += "&aff_s4=" + api.get_affiliate_source4();
            }

            if (api.get_affiliate_source5() != "") {
                parameter += "&aff_s5=" + api.get_affiliate_source5();
            }

            if (api.get_corp_type() != "") {
                parameter += "&corp_type=" + api.get_corp_type();
            }



            return parameter;
        }

        function checkDefinedIds() {
            var errorCount = 0;
            error_msg = "Product id(s) not exist in the campaign. Please fix the following: \n\n";
            if (api.get_warranty_prod_id() != 0) {
                var warranty_option = $('input.product-option[campaignproductid="' + api.get_warranty_prod_id() + '"]');
                if (typeof warranty_option.attr('campaignproductid') == "undefined") {
                    error_msg += "- warranty product id (warranty_prod_id) \n";
                    errorCount++;
                }
            }

            if (api.get_psmr_prod_id() != 0) {
                var psmr_option = $('input.product-option[campaignproductid="' + api.get_psmr_prod_id() + '"]');
                if (typeof psmr_option.attr('campaignproductid') == "undefined") {
                    error_msg += "- psmr product id (psmr_prod_id) \n";
                    errorCount++;
                }
            }
            // console.log(api.get_trial_pid())
            if (api.get_trial_pid() != 0) {
                var trial_option = $('input.product-option[campaignproductid="' + api.get_trial_pid() + '"]');
                if (typeof trial_option.attr('campaignproductid') == "undefined") {
                    error_msg += "- trial product id (trial_pid) \n";
                    errorCount++;
                }
            }
            // console.log(api.get_ss_id())
            if (api.get_ss_id() != 0) {
                var ss_option = $('input.product-option[campaignproductid="' + api.get_ss_id() + '"]');
                if (typeof ss_option.attr('campaignproductid') == "undefined") {
                    error_msg += "- straight sale product id (ss_id) \n";
                    errorCount++;
                }
            }

            if (errorCount != 0) {
                alertError(), error_msg = "";
                return true;
            } else {
                error_msg = "";
                return false;
            }

        }

        function checkCampaignID() {
            if (api.getCompaignId() == -1) {
                alert("Missing Campaign id!");
                return false;
            }
            return true;
        }

        form_obj.checkSubdomain = function (url) {
            if (url.length > 3 || (url.length == 3 && url.indexOf("shop") == -1 && url.indexOf("shopdev") == -1)) {
                url.shift();
                url = url.join(".");
                return url;
            } else {
                url = url.join(".");
                return url;
            }
        }

        form_obj.checkCampaignName = function (campName) {
            //this is fix if campName greater 4 in length, example : es.shop.hypeesavers.com
            campName = form_obj.checkSubdomain(campName.split("."));
            var website_name = form_obj.checkSubdomain($("#website").val().split("."));
            var site = form_obj.checkSubdomain(location.hostname.split('.'));

            var currentOffer = ((campName.indexOf("/") == -1 && campName.indexOf(".") == -1) ? getCurrentOffer().replace("/", "") : getCurrentOffer());

            var msg = "Campaign name setup mismatched:\n\n" +
                "#website element: " + ((campName.indexOf("/") == -1 && campName.indexOf(".") == -1) ? currentOffer : website_name + currentOffer) + "\n" +
                "Konnektive Setup: " + campName.trim() + "\n\n" +
                "Please check <input id='website'/> element value. It should be " + campName;

            if (getCurrentOffer() == "/") {
                currentOffer = "";
            }

            if (location.hostname.toLowerCase().indexOf("shopdev.") != -1) {
                site = site.toLowerCase().replace("shopdev.", "shop.");

            } else if (location.hostname.toLowerCase().indexOf("dev.") != -1) {
                site = site.toLowerCase().replace("dev.", "");

            } else if (location.hostname.toLowerCase().indexOf("www.") != -1) {
                site = site.toLowerCase().replace("www.", "");
            }

            console.log(site + currentOffer);
            console.log(website_name + currentOffer)
            if ($("#website").length == 0) {
                alert("Please add <input id='website'/> element with a value of the domain name.");
                return false;

            } else if (campName.indexOf("/") == -1 && currentOffer != campName.trim() && campName.indexOf(".") == -1) {
                alert(msg);
                return false;

            } else if (campName.indexOf("/") == -1 && currentOffer == campName.trim() && campName.indexOf(".") == -1) {      //if campaignName doesn't have domain name on it
                if (location.port == "") {
                    billerNameDomain = site;
                } else {
                    billerNameDomain = website_name;
                }
                return true;
            } else if (website_name + currentOffer != campName.trim()) {
                alert(msg);
                return false;

            } else if (site + currentOffer != campName.trim() && location.port == "") {
                alert(msg);
                return false;
            }

            return true;

        }

        /******************************************
         *   PUBLIC functions
         *****************************************/
        //if you want to add custom class for dynamic pricing just override this
        form_obj.customCode = function (context) {

        }

        form_obj.totalAmount = function () {
            var total = 0;
            $("input[type='hidden'].konnecktive-order").each(function () {
                total += (parseFloat($(this).attr("price")) * parseInt($(this).attr("qty"))) + parseFloat($(this).attr("shippingprice")) * parseInt($(this).attr("qty"));
            });

            //if product has a discount
            if ($("#totalDiscount_applied").length != 0) {
                total = total - parseFloat($("#totalDiscount_applied").val());
            }

            $(".main-total").html(currencySymbol + total.toFixed(2));
            $(".main-total2").html(total.toFixed(2));//without currency
            testingDisplay();// append resut testing once konnektiveTest=test present in url
        }

        form_obj.orderCoupon = function (data) {
            if (req_response(data)) {

                if (data.message.priceDiscount == 0 && data.message.shipDiscount == 0) {
                    alert("Invalid Coupon Code");
                    $("#btnCoupon").html("Apply Coupon");
                    return false;
                }

                var discountedPrice = data.message.priceDiscount;
                var discountedShipping = data.message.shipDiscount;
                var total = discountedPrice + discountedShipping;

                // $("#prod_id").attr("price", discountedPrice);
                // $("#prod_id").attr("shippingprice", discountedShipping);
                $(".totalDiscount").html(currencySymbol + total.toFixed(2));
                $(".totalDiscount2").html(total.toFixed(2));
                $(".discount-container").show();
                $("body").append("<input type='hidden' id='totalDiscount_applied' value='" + total + "'/>")

                $(".dicountedPrice, [campaignproductid='" + $("#prod_id").val() + "'] .dicountedPrice").html(currencySymbol + discountedPrice);//discount price
                $(".dicountedShipping, [campaignproductid='" + $("#prod_id").val() + "'] .dicountedShipping").html(currencySymbol + discountedShipping); //discount shipping

                //without currency symbol
                $(".dicountedPrice2, [campaignproductid='" + $("#prod_id").val() + "'] .dicountedPrice2").html(discountedPrice);//discount price
                $(".dicountedShipping2, [campaignproductid='" + $("#prod_id").val() + "'] .dicountedShipping2").html(discountedShipping); //discount shipping

                if ($('.congrats-wrapper-priority').length == 0) {
                    if ($('.congrats-wrapper').length == 0) {
                        $('.coupon-wrapper').before('<div class="congrats-wrapper" data-promo-product-price="' + parseFloat(data.message.priceDiscount).toFixed(2) +
                            '" data-promo-shipping-price="' + parseFloat(data.message.shipDiscount).toFixed(2) +
                            '"><span style="font-size:16px; font-weight:bold;color:#94C120;">CONGRATULATIONS! Discount Applied.</span><div>');
                    }
                    else {
                        $('.congrats-wrapper').attr('data-promo-product-price', parseFloat(data.message.priceDiscount).toFixed(2));
                        $('.congrats-wrapper').attr('data-promo-shipping-price', parseFloat(data.message.shipDiscount).toFixed(2));
                        $('.congrats-wrapper').fadeIn();
                    }
                }
                else {
                    $('.congrats-wrapper-priority').attr('data-promo-product-price', parseFloat(data.message.priceDiscount).toFixed(2));
                    $('.congrats-wrapper-priority').attr('data-promo-shipping-price', parseFloat(data.message.shipDiscount).toFixed(2));
                    $('.congrats-wrapper-priority').fadeIn();
                }

                coupon_code = $('#fields_coupon').val();
                $.cookie('CouponCode', $('#fields_coupon').val());
                $.cookie('ProductOptionID', $("#prod_id").val());
                $('.coupon-wrapper').hide();

                form_obj.totalAmount();
                $("#btnCoupon").html("Apply Coupon");
            } else {
                alert(data.message);
            }
        }

       

        function upsell_no(params) {
            //added here to url is the upsell no
            if (getQueryStringByName("PayerID") != "" || getQueryStringByName("paypalAccept") != "") {
                var upsell_query = sessionStorage.getItem("upsell_query");
                var upsell_page_no = getQueryStringValueByName("upsell_no", upsell_query);
                var fields_step = getQueryStringValueByName("fields_step", upsell_query);

                if (upsell_page_no == "" && fields_step == "upsell") {
                    params = updateQueryStringParameter(params, 'upsell_no', 2);
                } else if (upsell_page_no != "" && fields_step == "upsell") {
                    var no_ = parseInt(upsell_page_no)
                    params = updateQueryStringParameter(params, 'upsell_no', (1 + no_));
                } else {
                    params = removeQuerystring(params, 'upsell_no');
                }

            } else {
                if (getQueryStringByName("upsell_no") == "" && getQueryStringByName("fields_step") == "upsell") {
                    params = updateQueryStringParameter(params, 'upsell_no', 2);
                } else if (getQueryStringByName("upsell_no") != "" && getQueryStringByName("fields_step") == "upsell") {
                    var no_ = parseInt(getQueryStringByName("upsell_no"))
                    params = updateQueryStringParameter(params, 'upsell_no', (1 + no_));
                } else {
                    params = removeQuerystring(params, 'upsell_no');
                }
            }

            return params;
        }

        form_obj.upsell_number=function(params){
            return upsell_no(params)
        }

        form_obj.cleanQueryURL = function (data) {

            //add query url
            var params = location.search;
            params = removeQuerystring(params, 'descriptor');
            params = removeQuerystring(params, 'desc_individual');
            params = removeQuerystring(params, 'fields_step');
            params = removeQuerystring(params, 'confirm_upsell');
            params = removeQuerystring(params, 'from_page');



            if (getQueryStringByName("fields_step") == "second" || (getQueryStringByName("fields_step") == "" && $("#cc_number").length != 0)) {
                params = removeQuerystring(params, 'warranty_prod_id');
                params = removeQuerystring(params, 'psmr_prod_id');
                params = removeQuerystring(params, 'psmr_status');
                params = removeQuerystring(params, 'psmrToBoss');
                params = removeQuerystring(params, 'psmrBoss_key');
                params = removeQuerystring(params, 'psrm_keycode');
                params = removeQuerystring(params, 'geoLookUp');

            }

            params = removeQuerystring(params, 'paypalAccept');
            params = removeQuerystring(params, 'token');
            params = removeQuerystring(params, 'ba_token');
            params = removeQuerystring(params, 'PayerID');
            params = updateQueryStringParameter(params, 'wAds', api.getWithAds());//added this to set if the offer has ads campaign

            if (typeof data.message.paySource != "undefined") {
                if (data.message.paySource.toLowerCase() == "paypal") {
                    var paypalArray = [];
                    paypalArray.push(JSON.parse(sessionStorage.getItem("paypalExpress")));

                    var salesUrl = "?" + paypalArray[0].salesUrl.split('?')[1];
                    //remove query string in paypalExpress session to avoid duplicate
                    salesUrl = removeQuerystring(salesUrl, 'descriptor');
                    salesUrl = removeQuerystring(salesUrl, 'desc_individual');
                    salesUrl = removeQuerystring(salesUrl, 'fields_step');
                    salesUrl = removeQuerystring(salesUrl, 'warranty_prod_id');
                    salesUrl = removeQuerystring(salesUrl, 'psmr_prod_id');
                    salesUrl = removeQuerystring(salesUrl, 'psmr_status');
                    salesUrl = removeQuerystring(salesUrl, 'confirm_upsell');
                    salesUrl = removeQuerystring(salesUrl, 'from_page');
                    salesUrl = updateQueryStringParameter(salesUrl, 'campaignId', data.message.campaignId);

                    if (salesUrl.toLowerCase().indexOf("checkouttype") == -1) {
                        salesUrl = updateQueryStringParameter(salesUrl, 'checkoutType', api.getCheckoutType());
                    }

                    if (salesUrl.toLowerCase().indexOf("offertype") == -1) {
                        salesUrl = updateQueryStringParameter(salesUrl, 'offerType', api.getOfferType().toLowerCase());
                    }

                    if (api.get_pixel() != '') {
                        salesUrl = updateQueryStringParameter(salesUrl, 'pixel', api.get_pixel());
                    }

                    if (api.getWithAds()) {
                        salesUrl = updateQueryStringParameter(salesUrl, 'wAds', api.getWithAds());
                    }

                    salesUrl = updateQueryStringParameter(salesUrl, 'orderId', data.message.orderId);
                    salesUrl = updateQueryStringParameter(salesUrl, 'PayerID', getQueryStringByName('PayerID'));
                    salesUrl = updateQueryStringParameter(salesUrl, 'country', data.message.country);
                    salesUrl = updateQueryStringParameter(salesUrl, 'corp_type', api.get_corp_type());
                    if (api.get_paypal_forceMerchantId() != 0) {
                        salesUrl = updateQueryStringParameter(salesUrl, 'paypal_forceMerchantId', api.get_paypal_forceMerchantId());
                    }

                    params = salesUrl;

                } else {
                    params = updateQueryStringParameter(params, 'orderId', data.message.orderId);
                    params = updateQueryStringParameter(params, 'checkoutType', api.getCheckoutType());
                    params = updateQueryStringParameter(params, 'offerType', api.getOfferType().toLowerCase());
                    params = updateQueryStringParameter(params, 'campaignId', data.message.campaignId);
                    params = updateQueryStringParameter(params, 'paypal_forceMerchantId', api.get_paypal_forceMerchantId());
                    params = updateQueryStringParameter(params, 'country', data.message.country);
                    params = updateQueryStringParameter(params, 'corp_type', api.get_corp_type());
                    if (api.get_pixel() != '') {
                        params = updateQueryStringParameter(params, 'pixel', api.get_pixel());
                    }
                }
                //update paysource
                params = updateQueryStringParameter(params, 'paysource', data.message.paySource.toLowerCase());
                //add/update shared_page if set
                if (api.get_shared_page() != '') {
                    params = updateQueryStringParameter(params, 'shared_page', api.get_shared_page());
                    if (getQueryStringByName("referrer") == "") {
                        params = updateQueryStringParameter(params, 'referrer', getCurrentOffer());
                    }

                }
            } 

            params = upsell_no(params);//assign upsell number to upsell


            if (params.indexOf("?") != -1) {
                if (params.length > 1) {
                    params = "&" + params.substring(1);
                }
            }

            //get descriptor
            var order_items = [];
            var desc_individual = [];
            var desc = getQueryStringByName("descriptor");
            if (desc != "") {
                order_items = desc.split(",");
            }

            if (typeof data != "undefined") {
                for (var i in data.message.items) {
                    var item = data.message.items[i];
                    for (var key in item) {
                        if (key == "descriptor") {
                            if (order_items.indexOf(item[key]) == -1) {
                                order_items.push(item[key]);
                            }
                            desc_individual.push(item[key]);
                        }
                    }
                }
            }

            return {
                "params": params,
                "order_items": order_items,
                "descriptor_individual": desc_individual
            }
        }

        //check if product id for upsale exists in the campaign
        form_obj.checkUpsellProdId = function (prod_id) {

            if (findWithAttr(form_obj.listUpsells, "campaignProductId", parseInt(prod_id)) == -1) {
                // error_msg+="NOTE: assigning product id directly to <input id='prod_id'/>is applicable only for upsale pages with multiple product selection.\n\n";
                error_msg += "The following are product upsale ids that are only available in this campaign. \nAdd the product id directly in the <input id='prod_id'/> as value.\n\n";
                var billerName_ = getQueryStringByName("billerNdomain");
                for (var i in form_obj.listUpsells) {
                    if (billerName_ != "" && form_obj.listUpsells[i].billerName.toLowerCase().indexOf(billerName_.toLowerCase()) == -1) {
                    } else {
                        error_msg += "- Product id: " + form_obj.listUpsells[i].campaignProductId + " - " + form_obj.listUpsells[i].productName + " (" + form_obj.listUpsells[i].billingCycleType + ")" + "\n\n";
                    }

                }
                error_msg += "Example: <input type='hidden' id='prod_id' value='22'/>\n";
                error_msg += "-------------------------------------------------------\n\n";
                error_msg += "Your current value of prod_id is " + prod_id + "\n\n";
                return false;
            } else {
                return true;
            }
        }

        //icheck dire kun mo yes sya sa upsell kun mo yes istoresa confirm_upsell ang page sa yes button
        form_obj.checkYesUpsell = function () {
            var page = $("#yes-upsell-relink").val().trim().toLowerCase().split("/").pop();
            var stock_pages = [];
            var confirm_page = getQueryStringByName("confirm_upsell");
            if (confirm_page != "") {
                if (confirm_page.indexOf(",") != -1) {
                    stock_pages = confirm_page.split(",");
                } else {
                    stock_pages.push(confirm_page)
                }

                if (stock_pages.indexOf(page) == -1) {
                    stock_pages.push(page);
                }
            } else {
                stock_pages.push(page)
            }
            return stock_pages.toString();
        }


        form_obj.upsellClick_response = function (data) {
            var url = window.location.pathname;
            var file_name = url.substring(url.lastIndexOf('/') + 1);//file name

            if (req_response(data)) {
                var query_url = form_obj.cleanQueryURL(data);

                if ($("#yes-upsell-relink").val().trim().toLowerCase().indexOf("thankyou.html") != -1) {
                    //redirect to ty page
                    window.location.href = $("#yes-upsell-relink").val().trim() + "?fields_step=thankyou" + removeQuerystring(query_url.params, 'upsell_no') +
                        "&descriptor=" + encodeURIComponent(query_url.order_items.toString()) + "&desc_individual=" + encodeURIComponent(query_url.descriptor_individual.toString())
                        + "&confirm_upsell=" + form_obj.checkYesUpsell() + "&from_page=" + file_name;
                } else {
                    //redirect to to upsell page
                    window.location.href = $("#yes-upsell-relink").val().trim() + "?fields_step=upsell" + query_url.params +
                        "&descriptor=" + encodeURIComponent(query_url.order_items.toString()) + "&desc_individual=" + encodeURIComponent(query_url.descriptor_individual.toString())
                        + "&confirm_upsell=" + form_obj.checkYesUpsell() + "&from_page=" + file_name;
                }
            } else {
                if (data.message.toLowerCase().indexOf("already taken") != -1 || data.message.toLowerCase().indexOf("captured") != -1) {
                    alert(data.message + " Redirecting to the next page...");

                    var query_url = form_obj.cleanQueryURL(data);
                    var upsell_query = sessionStorage.getItem("upsell_query");
                    //for paypal if order already taken
                    if (getQueryStringByName("PayerID") != "") {
                        if ($("#yes-upsell-relink").val().trim().toLowerCase().indexOf("thankyou.html") != -1) {
                            upsell_query = removeQuerystring(upsell_query, 'fields_step');
                            upsell_query = removeQuerystring(upsell_query, 'upsell_no');
                            //redirect to ty page
                            window.location.href = $("#yes-upsell-relink").val().trim() + "?fields_step=thankyou" + "&" + upsell_query.substring(1);
                        } else {
                            //redirect to to upsell page
                            window.location.href = $("#yes-upsell-relink").val().trim() + upsell_no(upsell_query);
                        }
                    } else {
                        //if none paypal
                        if ($("#yes-upsell-relink").val().trim().toLowerCase().indexOf("thankyou.html") == -1) {
                            //redirect to upsell page
                            window.location.href = $("#yes-upsell-relink").val().trim() + upsell_no(location.search);
                        } else {
                            //redirect to thankyou page
                            window.location.href = $("#yes-upsell-relink").val().trim() + updateQueryStringParameter(removeQuerystring(location.search, 'upsell_no'), 'fields_step', 'thankyou');
                        }
                    }
                } else {
                    alert("ERROR: " + data.message + ".");
                }
            }
        }

        form_obj.upsellPageCallback = function (data) {
            form_obj.hideProgress();
            if (req_response(data)) {
                currencySymbol = data.message.data[api.getCompaignId()].currencySymbol;//set currency symbol accessible to all

                populateProductOffer(getProductOffers(data.message.data[api.getCompaignId()].products, "UPSALE"));//populate product ids as product ooptions and append to page
                form_obj.listUpsells = getProductOffers(data.message.data[api.getCompaignId()].products, "UPSALE"); //stored upsells to listUpsells

                if (getQueryStringByName('paypalAccept') == '1') {
                    //paypal return on success
                    //upsell pages
                    var paypalArray = [];
                    paypalArray.push(JSON.parse(sessionStorage.getItem("paypalExpress")));
                    paypalArray[0].token = getQueryStringByName("token");
                    paypalArray[0].payerId = getQueryStringByName("PayerID");
                    paypalArray[0].paypalAccept = getQueryStringByName("paypalAccept");
                    form_obj.showProgress();
                    console.log("show progress")
                    api.importUpsell(paypalArray, "", form_obj.upsellClick_response);
                    return false;
                }

                if ($("#yes-upsell-relink").length == 0) {
                    error_msg += 'Add #yes-upsell-relink with a redirection path as value.\n Example:\n\n' +
                        '<input type="hidden" id="yes-upsell-relink" value="upsell2.html"/>\n\n';

                }

                if ($("#no-upsell-relink").length == 0) {
                    error_msg += 'Add #no-upsell-relink with a redirection path as value.\n Example:\n\n' +
                        '<input type="hidden" id="no-upsell-relink" value="downsell.html"/>\n\n';

                }

                if ($(".yes-upsell-link").length == 0) {
                    error_msg += 'Add .yes-upsell-link to an element.\n Example:\n\n' +
                        '<span class="yes-upsell-link> Yes, Add it to my order.</span>\n\n';
                }

                if ($(".no-upsell-link").length == 0) {
                    error_msg += 'Add .no-upsell-link to a link element.\n Example:\n\n' +
                        '<a href="upsell1.html" class="no-upsell-link> No thanks</span>\n\n';
                }

                if (error_msg != "") {
                    alertError();//check if error exists
                } else if ($("#prod_id").length != 0) {
                    if (form_obj.checkUpsellProdId($("#prod_id").val())) {
                        //$("input.product-option[campaignproductid='"+$("#prod_id").val()+"']").trigger("mouseup");//trigger as default product selected

                        //for no thank links
                        $(".no-upsell-link").unbind().on("click", function (e) {
                            e.preventDefault();
                            form_obj.showProgress();
                            var href = $("#no-upsell-relink").val().trim();
                            if (href.toLowerCase().indexOf("thankyou.html") != -1) {
                                window.location.href = href.trim() + updateQueryStringParameter(removeQuerystring(location.search, 'upsell_no'), 'fields_step', "thankyou");
                            } else {
                                window.location.href = href.trim() + upsell_no(location.search);
                            }

                            return false;
                        });

                        if (getQueryStringByName("paysource").toLowerCase() == "paypal") {
                            form_obj.upsellCustomCode();
                            return false; //this prevent yes-upsell-link event to register if paysource is paypal
                        }

                        $(".yes-upsell-link, #yes-upsell-link").unbind().on("click", function (e) {
                            e.preventDefault();
                            form_obj.showProgress();

                            if ($("#prod_id").val() != "" && typeof $("#prod_id").attr("price") != "undefined") {
                                //call importUpsell function to submit to api konnektive
                                api.importUpsell([{ 'productQty': $("#prod_id").attr("qty") }], $("#prod_id").val().trim(), function (data) {
                                    form_obj.upsellClick_response(data);
                                })
                            } else {
                                form_obj.hideProgress();
                                alert("ERROR: Missing Campaign Id");
                                return false;
                            }
                        });




                    }
                    alertError();//check if error exists
                } else {
                    alert("Please add <input type='hidden' id='prod_id'/>")
                }

                form_obj.upsellCustomCode();

            } else {
                alert("ERROR: " + data.message + ".")
            }

        }

        form_obj.upsellCustomCode=function(){
            
        }

        //hide progress bar
        form_obj.hideProgress = function () {
            //close progress dialog function
            function closeModal() {
                $('#progress-dialog').trigger('closeModal');
            }

            if (getQueryStringByName("transaction_id") != "" && getQueryStringByName("fields_step") == "upsell" && withPixel) {
                function checkPixelFrame() {
                    if ($("#pixel-frame").length != 0) {
                        //close/hide progress modal once pixel loaded the page
                        $('#pixel-frame').on('load', function () {
                            closeModal();
                        });
                    } else {
                        setTimeout(checkPixelFrame, 100);
                    }
                }
                checkPixelFrame();
            } else {
                closeModal();
            }

        }

        //show progress bar
        form_obj.showProgress = function (msg) {
            if (typeof msg === 'undefined') {
                msg = 'Processing your request...Please wait.';
            }
            if ($('#progress-dialog').length == 0) {
                $('<div id="progress-dialog" style="opacity: 0.85;min-height:20px; min-width:250px;font-family:arial;background:#454545;color:#fff;border:2px solid #fff; padding:10px;border-radius:10px;font-size:12px;font-weight:bold;"><div id="progress-loading" style="margin-top: 1px;position: absolute;left:10px;"><img src="/onlineorder/images/loading.gif" alt="loading" width="16" height="16" /></div><div style="margin-left:25px;text-align:left;" id="progress-text">' + msg + '</div></div>').appendTo('body');
            }
            else {
                $('#progress-text').text(msg);
            }
            $('#progress-dialog').easyModal({
                autoOpen: true,
                overlayOpacity: 0.5,
                overlayColor: "#000",
                overlayClose: false,
                closeOnEscape: false,
                updateZIndexOnOpen: false,
                'zIndex': function () {
                    return 9999999;
                }
            });
        }


        //paypal callback after clicking paypal button express at checkout page
        form_obj.paypalCallback = function (data) {
            if (data.result.toLowerCase() == "success") {
                if (data.message && data.message.paypalUrl) {
                    window.location.href = data.message.paypalUrl;
                }
            } else {
                alert(data.message);
                form_obj.hideProgress();
            }
        }



        //this will post request to importUpsell  at upsellpage /imporOrderPaypalExpress at checkout page
        form_obj.choosePaypalProd = function () {
            testingDisplay();
            form_obj.showProgress();
            if (getQueryStringByName("fields_step") != "" && getQueryStringByName("fields_step") != "second") {
                if (getQueryStringByName("PayerID") != "") {
                    var upsellData = {
                        'salesUrl': location.href,
                        'errorRedirectsTo': location.href,
                        'paySource': 'PAYPAL',
                        'paypalBillerId': api.get_paypal_forceMerchantId(),
                        'orderId': getQueryStringByName("orderId"),
                        'productId': $("#prod_id").val().trim(),
                        'productQty': $("#prod_id").attr("qty"),
                    };

                    sessionStorage.setItem("paypalExpress", JSON.stringify(upsellData));  //this will be used later after successful import Upsell
                    sessionStorage.setItem("redirection_paypal", location.href);   //this link will be used if user click no on paypal

                    sessionStorage.setItem("upsell_query", location.search); //query string attached to url. this will be used if user click the back page button, thisll will auto redirect to another page

                    api.importUpsell([upsellData], "", form_obj.paypalCallback);//upsell page importUpsell call

                } else {
                    api.importUpsell([{
                        'paySource': 'PAYPAL',
                        'forceMerchantId': getQueryStringByName("paypal_forceMerchantId"),
                        'productQty': $("#prod_id").attr("qty"),
                    }], $("#prod_id").val().trim(), form_obj.upsellClick_response);//upsell page importUpsell call
                }

            } else {
                //checkout page importOrder call for paypal express
                api.importOrderPaypalExpress(form_obj.cartItems(), form_obj.paypalCallback);
            }
        }


        //this function contain the paypal click event
        form_obj.paypalTrigger = function () {
            //just to validate the forceMerchantID if exist for paypal
            if (api.get_paypal_forceMerchantId() != 0 && api.get_paypal_forceMerchantId() != "") {
                if (getQueryStringByName("fields_step") == "thankyou") {
                    return false;
                } else if ($(".paypal-btn").length == 0) {
                    alert("Please add a button with assign class of .paypal-btn");
                }

                $(".paypal-btn").unbind().on("click", function (e) {
                    e.preventDefault();

                    //psmr should not be added as order
                    $("#psmr-data").remove();//remove psmr
                    $("#opt").prop("checked", false); //unchecked psmr button

                    $("#pay_source").val("paypal");
                    form_obj.choosePaypalProd();
                })

            } else if ($(".paypal-btn").length != 0 && api.get_paypal_forceMerchantId() == 0) {
                alert("You have paypal button assign to .paypal-btn but you don't have paypal_forceMerchantId value.");
            }
        }

        form_obj.delivery_date = function () {
            $(".delivery-date").text(addDays(new Date(), 7).toLocaleDateString("en-US", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
        }

        form_obj.initilizeGeolookup = function () {
            form_obj.geoLookUp_();
            var addressDropdown = document.querySelector("#fields_country_select");

            // listen to the telephone input for changes
            $("#fields_phone").on('countrychange', function (e) {
                var c_code = iti.getSelectedCountryData().iso2.toUpperCase();
                $("#fields_phone").val('');
                if (c_code != $("#fields_country_select").val()) {
                    if (c_code == 'MX') {
                        $("#fields_phone").mask("AA AAAA AAAA");
                        $("#fields_phone").attr('maxlength', 12);
                    } else if (c_code == 'CR') {
                        $("#fields_phone").mask("AAAA AAAA");
                        $("#fields_phone").attr('minlength', 9);
                    } else {
                        $("#fields_phone").mask("AAA AAA AAAA");
                        $("#fields_phone").attr('maxlength', 12);
                    }
                } else {
                    if (c_code == 'MX') {
                        $("#fields_phone").mask("AA AAAA AAAA");
                        $("#fields_phone").attr('maxlength', 12);
                    } else if (c_code == 'CR') {
                        $("#fields_phone").mask("AAAA AAAA");
                        $("#fields_phone").attr('minlength', 9);
                    } else {
                        $("#fields_phone").mask("AAA AAA AAAA");
                        $("#fields_phone").attr('maxlength', 12);
                    }
                }
                // var country_selected= $("#fields_country_select option[value='"+c_code+"']");
                // if(country_selected.length==0){
                //     $("#fields_country_select").prop("selectedIndex", 0);
                // }else{
                //     $("#fields_country_select").val(c_code).trigger("change");
                // }
            });

            // listen to the address dropdown for changes
            addressDropdown.addEventListener('change', function () {
                iti.setCountry(this.value.toLowerCase());
            });
        }

        form_obj.wrapForm = function () {
            if (getQueryStringByName('fields_step') != 'upsell' && getQueryStringByName('fields_step') != 'thankyou') {
                //reposition form tag
                $('form').contents().unwrap();//this will removed unwanted position of the form tag or multiple form tags
                $("body").wrapInner('<form></form>');
                $('form').attr('method', "post");
            }
        }

        form_obj.initPage = function () {
            var fields_step;
            var pixel_setup = $.cookie("pixel_setup");
            var pixel_ = $.cookie("pixel");
            var location_path = location.pathname.toLowerCase();

            form_obj.wrapForm();

            $('input, select').removeAttr('required');//removed "required" attributes so that it wont conflict with jQuery Validation

            // $('form').attr('action', "");
            if ($('#modal-popup').length == 0) {
                $('body').append('<div id="modal-popup"></div>');
            }
            $('input, select').removeClass('required');
            $("#fields_zip, #cc_cvv, #fields_phone, #cc_number").attr({ 'inputmode': 'numeric', 'pattern': '[0-9]*' });


            $('form').unbind().on('keypress', function (e) {
                var code = e.keyCode || e.which;
                if (code == 13) {
                    e.preventDefault();
                    //$('#btnSubmitCoupon').blur();
                    $('form').submit();//payment.html
                    return false;
                }
            });

            form_obj.delivery_date();

            //coupon event here
            couponCodeEvent();//register coupon events
            //end coupon event here

            //paypal trigger here
            form_obj.paypalTrigger();
            //end paypal

            //added line_loaderCSS
            line_loaderCss();
            //end line_loaderCSS

            if (api.get_geoLookUp() && api.get_geoLookUp_delay() == false) {
                form_obj.initilizeGeolookup();
            }

            //pixel here
            //fire if pixel property is in the setting
            if (location_path.indexOf('upsell.html') != -1 && (getQueryStringByName("afid") != "" || getQueryStringByName("affId") != "") && pixel_ != null && getQueryStringByName("pixel") == "pix") {
                withPixel = true;
                form_obj.hideProgress();
                $.removeCookie("pixel_setup");//remove existing pixel_setup
                form_obj.firepixel(pixel_); //fire pixel
            } else if (pixel_setup != null && (getQueryStringByName("afid") != "" || getQueryStringByName("affId") != "") && getQueryStringByName("pixel") == "pix_setup") {

                //fire if pixel_setup property is in the setting
                $.removeCookie("pixel");//remove existing pixel

                function execPixel(from_page, pixel) {
                    //execute kun ideclare kun asa gikan sya nga page.
                    if (typeof from_page != "undefined") {
                        if (getQueryStringByName("from_page") == from_page + ".html") {
                            withPixel = true;
                            form_obj.hideProgress();
                            form_obj.firepixel(pixel); //fire upsell.html
                        }
                    } else {
                        withPixel = true;
                        form_obj.hideProgress();
                        form_obj.firepixel(pixel); //fire upsell.html
                    }
                }

                try {
                    var pixel = JSON.parse(pixel_setup);
                    if (Object.keys(pixel).length != 0) {
                        var index = findWithAttr(pixel, 'page', location_path.split("/").pop());

                        if (index != -1 && location_path.split("/").pop() == "upsell.html") {
                            execPixel(pixel[index].from_page, pixel[index].pixel_path);
                        } else if (index != -1 && getQueryStringByName("confirm_upsell").toLowerCase().indexOf(location_path.split("/").pop()) != -1) { //fire anything as long as present in the confirm_upsell url query
                            execPixel(pixel[index].from_page, pixel[index].pixel_path);
                        } else if (index != -1 && getQueryStringByName("confirm_upsell") == "") {
                            execPixel(pixel[index].from_page, pixel[index].pixel_path);
                        }
                    }
                } catch (e) {
                    console.log(e)
                }
            }

            //end pixel code

            if ($('#chkboxSameAddress').length != 0) {
                $('#chkboxSameAddress').click(function (e) {
                    if ($(this).is(':checked') == false) {
                        if (getQueryStringByName('fields_step') == 'second') {
                            $('#fields_address1_bill').val(getQueryStringByName('fields_address1'));
                            if (getQueryStringByName('fields_address2') != '') {
                                $('#fields_address2_bill').val(getQueryStringByName('fields_address2'));
                            }
                            $('#fields_city_bill').val(getQueryStringByName('fields_city'));
                            $('#fields_state_bill').val(getQueryStringByName('fields_state'));
                            $('#fields_zip_bill').val(getQueryStringByName('fields_zip'));
                        }
                        else {
                            $('#fields_address1_bill').val($('#fields_address1').val());
                            if ($('#fields_address2').val() != '') {
                                $('#fields_address2_bill').val($('#fields_address2').val());
                            }
                            $('#fields_city_bill').val($('#fields_city').val());
                            $('#fields_state_bill').val($('#fields_state').val());
                            $('#fields_zip_bill').val($('#fields_zip').val());

                            $('#fields_zip_bill').rules('remove', 'validZipcode');
                            if ($('#fields_zip_bill').val().length > 0 && $('#fields_zip_bill').val().indexOf('-') > 0) {
                                $('#fields_zip_bill').attr('maxlength', 10);
                                $('#fields_zip_bill').rules('add', {
                                    maxlength: 10
                                });
                            }
                        }
                    }
                    $('#billingAddress').slideToggle();
                });

                if ($('.billingAddress-input-format').length > 0) {
                    var className = $(".billingAddress-input-format input").attr("class");
                    var inputLabel = [
                        { label: "First Name", input: "<input class='" + className + "' id='fields_fname_bill' name='fields_fname_bill' placeholder='First Name'/>" },
                        { label: "Last Name", input: "<input class='" + className + "' id='fields_lname_bill' name='fields_lname_bill' placeholder='Last Name'/>" },
                        { label: "Address 1", input: "<input class='" + className + "' id='fields_address1_bill' name='fields_address1_bill' placeholder='Address 1'/>" },
                        { label: "Address 2", input: "<input class='" + className + "' id='fields_address2_bill' name='fields_address2_bill' placeholder='Address 2'/>" },
                        // { label: "Country", input: "<select class='" + className + "' name='fields_country_select_bill' id='fields_country_select_bill'></select>" },
                        { label: "State", input: "<select class='" + className + "' name='fields_state_bill' id='fields_state_bill'></select>" },
                        { label: "City", input: "<input class='" + className + "' id='fields_city_bill' name='fields_city_bill' placeholder='City'/>" },
                        { label: "Zip", input: "<input class='" + className + "' id='fields_zip_bill' name='fields_zip_bill' placeholder='Zip'/>" },
                    ];

                    $(".billingAddress-input-format input").remove();
                    var inputFormat = $(".billingAddress-input-format").html();
                    $(".billingAddress-input-format").remove();
                    $.each(inputLabel, function (key, value) {
                        var newFormat = inputFormat.replace("{{label}}", value["label"]).replace("{{input}}", value["input"]);
                        $("#billingAddress").append(newFormat);
                    });
                    addStatesProvince('#fields_state_bill');
                }

                PreFillForm();

            }

            $("input[id*='fields'], select").unbind('blur').blur(function () {
                if (getQueryStringByName("fields_step") == "thankyou") {
                    return;// donot import lead if thankyou page
                }

                function import_lead() {
                    if (api.get_geoLookUp()) {
                        var phoneNumber = iti.getNumber();
                        api.importLead(phoneNumber);//import lead to konnektive with iti phone number
                    } else {
                        api.importLead();//import lead to konnektive
                    }
                }
                if ($("#fields_phone").length != 0 && $("#fields_phone").val() != "") {
                    if ($("#fields_phone").valid()) {
                        import_lead();
                    }
                } else if ($("#fields_phone").length == 0 || $("#fields_phone").val() == "") {
                    import_lead();
                }
            });

            //get the step
            if ($('#fields_step').length > 0) {
                fields_step = $('#fields_step').val();
            } else {
                //check first if this is payment, upsell or thank you page
                fields_step = getQueryStringByName('fields_step');
            }

            if (fields_step == '') {
                fields_step = 'first';
                if ($('#fields_step').length == 0) {
                    $('form:first').append('<input type="hidden" id="fields_step" name="fields_step" value="first"/>');
                }
            }

            if (error_msg != '') {
                if (fields_step != 'first' && fields_step != '') {
                    alert("Page Invalid");
                }
                else {
                    alert(error_msg);
                }
            }
            else {
                if ($('#is_intro').length > 0 && $('#is_intro').val() == '1') {
                    form_obj.PageEvent('welcome');
                }
                else {
                    form_obj.PageEvent(fields_step);
                }

            }

        }

        //get Coupon Code
        form_obj.getCouponCode = function () {
            return coupon_code;
        }

        //set Coupon Code
        form_obj.setCouponCode = function (coupon) {
            coupon_code = coupon;
        }

        //select where the cart item stored either cookie or localStorage
        form_obj.getCartStoredItems =function(){     
            if ($.cookie("cartItem_dw") != null && form_obj.cartInLocalStorage()==0) {
                return $.cookie("cartItem_dw")
            }else{
                return form_obj.cartStorage();
            }
        }


        //get all selected product option. From CART or NORMAL as offer pages
        form_obj.cartItems = function () {
            if (api.getOfferType() == "CART") {
                //if cart it should have items in cart
                if (api.getOfferType() == "CART") {
                    if (form_obj.getCartStoredItems() == null) {
                        alert("No Item on cart");
                        form_obj.hideProgress();  //hide loading
                        return false;
                    }
                    if (JSON.parse(form_obj.getCartStoredItems()).length == 0) {
                        alert("No Item on cart");
                        form_obj.hideProgress();  //hide loading
                        return false;
                    }
                }

                var productIds = [];
                var arr = JSON.parse(form_obj.getCartStoredItems());
                var o = 1, registerPromo = false;
                for (var i in arr) {
                    var cartItem = {}, keycode = 0, prodPrice = 0, qty = 0, shipPrice = 0;
                    keycode = arr[i].keycode;
                    qty = arr[i].qty;
                    var price_ = parseFloat(arr[i].prodPrice) / parseInt(qty);
                    var shipping_price_ = parseFloat(arr[i].shippingPrice) / parseInt(qty);
                    //apply promo discount here
                    if (typeof (arr[i].coupon) != "undefined") {
                        if (arr[i].coupon.hasOwnProperty("discounted") && registerPromo == false) {
                            cartItem['couponCode'] = arr[i].coupon.couponCode;
                            registerPromo = true;
                        // } else if (arr[i].coupon.hasOwnProperty("discounted") && registerPromo) {
                        //     price_ = (parseFloat(price_) - parseFloat(arr[i].coupon.priceDiscount)).toFixed(2);
                        //     shipping_price_ = (parseFloat(shipping_price_) - parseFloat(arr[i].coupon.shipDiscount)).toFixed(2);
                        }
                    }

                    cartItem['product' + o + '_id'] = keycode;
                    cartItem['product' + o + '_price'] = price_;
                    cartItem['product' + o + '_qty'] = qty;
                    cartItem['product' + o + '_shipPrice'] = shipping_price_;
                    productIds.push(cartItem);
                    o++;
                }



                return productIds;
            } else {
                var data = [];
                var i = 1;
                $("input[type='hidden'].konnecktive-order").each(function () {
                    var pushData = {};
                    pushData['product' + i + '_id'] = $(this).val();
                    pushData['product' + i + '_price'] = $(this).attr("price");
                    pushData['product' + i + '_qty'] = $(this).attr("qty");
                    pushData['product' + i + '_shipPrice'] = $(this).attr("shippingprice");
                    pushData['billerId'] = $(this).attr("billerId");
                    data.push(pushData);
                    i++;
                });

                if (coupon_code != "") {
                    data.push({ "couponCode": coupon_code });
                }

                return data;
            }
        }

        form_obj.prefillShippingInfo = function (data) {
            var info = data.message.data[0];
            $("#fields_fname").val(info.shipFirstName);
            $("#fields_lname").val(info.shipLastName);
            $("#fields_address1").val(info.shipAddress1);
            $("#fields_city").val(info.shipCity);
            $("#fields_zip").val(info.shipPostalCode);
            $("#fields_country_select").val(info.shipCountry).trigger("change");
            $("#fields_state").val(info.shipState).trigger("change");

        }

        form_obj.updateShipping = function (shipInfo) {
            if ($("#fields_fname").length != 0 && $("#fields_lname").length != 0) {
                if ($("#update-form").length == 0) {
                    alert("Please add an id of #update-form that wrap the text fields")
                    return false;
                }

                $('form').contents().unwrap();//this will removed unwanted position of the form tag or multiple form tags
                $("#update-form").wrapInner('<form></form>');
                $('form').attr('method', "post");

                api.queryCampaign(function (data) {
                    addCountries(data.message.data[api.getCompaignId()].countries);//add countries and states              
                    shippingUpdateValidation(checkoutType);
                    form_obj.prefillShippingInfo(shipInfo);//prefill shipping info
                });

                form_obj.submitUpdateShipping(shipInfo.message.data[0].orderId);
            }
        }

        form_obj.updateShippingSuccess = function () { }

        form_obj.submitUpdateShipping = function (orderId) {
            form_obj.showProgress();
            $.validator.setDefaults({
                ignore: [],
                errorPlacement: function (error, element) {
                    //override, prevent showing errors in html
                },
                invalidHandler: function (event, validator) {
                    if (error_msg != '') {
                        alert('PAGE WILL NOT PROCEED UNLESS DEVELOPER/DESIGNER WILL CORRECT THE FF:\n\n' + error_msg);
                    }
                    else {
                        var error_summary = '';
                        $.each(validator.errorList, function () { error_summary += this.message + "\n"; });
                        if (error_summary != '') {
                            //*** if there is an exit pop-up for this page, reset it
                            if (typeof (byPassExit) !== 'undefined') {
                                byPassExit = false
                            }
                            //***
                            setTimeout(function (e) {
                                alert('Please enter/correct the following required fields:\n\n' + error_summary);
                            }, 1);
                        }
                    }
                },
                submitHandler: function (form, event) {
                    if (wasSubmitted == false) {
                        api.updateCustomer(orderId, function (data) {
                            if (data.result.toLowerCase() == "success") {
                                $(".cs-shipping-name").html($("#fields_fname").val() + " " + $("#fields_lname").val());
                                $(".shipping-address").html(
                                    $("#fields_address1").val() + ", " +
                                    $("#fields_city").val() + ", " +
                                    $("#fields_state").val() + ", " +
                                    $("#fields_zip").val() + ", " +
                                    $("#fields_country_select").val());
                                form_obj.updateShippingSuccess();

                            } else {
                                alert(data.message);
                            }
                            form_obj.hideProgress();
                        });
                    }
                }
            });

        }

        form_obj.thankyouPage = function (data) {

            if (req_response(data)) {
                form_obj.updateShipping(data);//update shipping info

                var info;
                if (data.message.data.length != 1) {
                    info = data.message.data[data.message.data.length - 1];
                } else {
                    info = data.message.data[0];
                }

                var descriptor_individual = decodeURIComponent(getQueryStringByName("desc_individual")).split(",");
                var discount = (info.hasOwnProperty("totalDiscount")) ? info.totalDiscount : 0;

                $(".cs-billing-name").html(isNullOrEmpty(info.firstName) + " " + isNullOrEmpty(info.lastName));
                $(".cs-shipping-name").html(isNullOrEmpty(info.shipFirstName) + " " + isNullOrEmpty(info.shipLastName));
                $(".email, .cs-email").html(isNullOrEmpty(info.emailAddress));
                $(".phone-number, .phone").html(isNullOrEmpty(info.phoneNumber));
                $(".currencySymbol").html(info.currencySymbol);
                $(".currencyCode").html(info.currencyCode);
                $(".descriptor").html((getQueryStringByName("descriptor").split('').pop() == ",") ? getQueryStringByName("descriptor").slice(0, -1) : getQueryStringByName("descriptor"));
                $(".order-number").html(getQueryStringByName("orderId"))
                $(".totalAmount").html(info.totalAmount)

                var options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
                var today = new Date(info.dateCreated);
                $(".order-date").html(today.toLocaleDateString("en-US", options))


                if (isNullOrEmpty(info.address1) != "") {
                    $(".billing-address").text(isNullOrEmpty(info.address1) + ", " + isNullOrEmpty(info.city) + ", " + isNullOrEmpty(info.state) + ", " + isNullOrEmpty(info.postalCode) + ", " + isNullOrEmpty(info.country))
                } else {
                    $(".billing-address").text(isNullOrEmpty(info.address2) + ", " + isNullOrEmpty(info.city) + ", " + isNullOrEmpty(info.state) + ", " + isNullOrEmpty(info.postalCode) + ", " + isNullOrEmpty(info.country))
                }

                if (isNullOrEmpty(info.shipAddress1) != "") {
                    $(".shipping-address").text(isNullOrEmpty(info.shipAddress1) + ", " + isNullOrEmpty(info.shipCity) + ", " + isNullOrEmpty(info.shipState) + ", " +
                        isNullOrEmpty(info.shipPostalCode) + ", " + isNullOrEmpty(info.shipCountry))
                } else {
                    $(".shipping-address").text(isNullOrEmpty(info.shipAddress2) + ", " + isNullOrEmpty(info.shipCity) + ", " + isNullOrEmpty(info.shipState) + ", " +
                        isNullOrEmpty(info.shipPostalCode) + ", " + isNullOrEmpty(info.shipCountry))
                }

                var context = {}, prods = [];

                if (api.getOfferType() == "CART") {
                    if (form_obj.getCartItemsThankyou() != null) {
                        var arr = JSON.parse(form_obj.getCartItemsThankyou());
                        for (var i in arr) {
                            if (typeof arr[i].coupon != "undefined") {
                                if (arr[i].coupon.hasOwnProperty("discounted")) {
                                    var productDiscount = 0;
                                    productDiscount += parseFloat(arr[i].coupon.priceDiscount);
                                    productDiscount += parseFloat(arr[i].coupon.shipDiscount);
                                    arr[i].productDiscount = productDiscount.toFixed(2);
                                }
                            }
                            if (typeof arr[i].alias != "undefined") {
                                if (arr[i].alias.toLowerCase().indexOf("subscription") != -1) {
                                    arr[i].subscription = true;
                                } else {
                                    arr[i].subscription = false;
                                }
                            } else {
                                arr[i].subscription = false;
                            }
                            arr[i].currencySymbol = info.currencySymbol;
                            prods.push(arr[i]);
                        }
                    }
                } else {
                    // console.log(info.items)
                    for (var i in info.items) {
                        for (var key in info.items[i]) {
                            if (key == "name") {
                                info.items[i].filename = info.items[i][key].toLowerCase().split(' ').join('-').replace(/([†*%?^=!:${}()|\[\]\/\\])/g, '-');
                            }
                            info.items[i].currencySymbol = info.currencySymbol;
                            if (key == "productType" && info.items[i][key] == "OFFER") {
                                info.items[i].discountPrice = discount;
                            }
                        }

                        prods.push(info.items[i]);
                    }
                }

                context.ty_data = prods;
                ty_data = prods;

                if ($.cookie("confirmSent") != info.orderId) {
                    api.confirmOrder();
                }
                $.cookie("confirmSent", info.orderId);
                if (typeof Handlebars != "undefined" && $("#ty-summary").length != 0) {
                    $(".ty-summary ").html(handleBars_compile("ty-summary", context));

                }
                //paint individual descriptor here
                for (var i = 0; i < descriptor_individual.length; i++) {
                    $(".descriptor_" + i + ",#descriptor_" + i).text(descriptor_individual[i]);
                }

                form_obj.customCode(context);// call this function after ty summary painted in the page

            } else {
                alert("ERROR:" + data.message + ".")
            }


            form_obj.hideProgress();  //hide loading
        }

        //get ty_data
        form_obj.getTyData = function () {
            return ty_data;
        }

        form_obj.redirectionToPage = function (query_url, data) {
            var session_id = sessionStorage.getItem("sessionId");
            if (sessionStorage.getItem(session_id) == null && session_id != null) {
                sessionStorage.setItem(session_id, 1);//set to 1 if successfull this to determine if session id already purchase an order
            }

            if (api.get_shared_page() != "") {
                var url_path = api.get_shared_page_path();
                if (api.get_ss_id() != 0 && api.get_ss_onSuccess().toLowerCase().indexOf("thankyou") == -1 && data.message.cardIsPrepaid) {//if prepaid card used
                    var folder_name = "";
                    if (api.get_shared_page().indexOf("/") != -1) {
                        folder_name = api.get_shared_page().substring(api.get_shared_page().lastIndexOf('/'), -1) + "/";
                    }
                    window.location.href = url_path + folder_name + api.get_ss_onSuccess() + ".html?fields_step=upsell" + query_url.params + "&descriptor=" + encodeURIComponent(query_url.order_items.toString())
                        + "&desc_individual=" + encodeURIComponent(query_url.descriptor_individual.toString());
                } else if (form_obj.listUpsells.length != 0) {
                    window.location.href = url_path + api.get_shared_page() + ".html?fields_step=upsell" + query_url.params +
                        "&descriptor=" + encodeURIComponent(query_url.order_items.toString()) +
                        "&desc_individual=" + encodeURIComponent(query_url.descriptor_individual.toString()) +
                        "&fields_fname=" + data.message.firstName +
                        "&fields_lname=" + data.message.lastName;
                } else {
                    window.location.href = url_path + api.get_shared_page() + ".html?fields_step=thankyou" + query_url.params +
                        "&descriptor=" + encodeURIComponent(query_url.order_items.toString()) +
                        "&desc_individual=" + encodeURIComponent(query_url.descriptor_individual.toString()) +
                        "&fields_fname=" + data.message.firstName +
                        "&fields_lname=" + data.message.lastName;
                }

            } else if (api.get_ss_id() != 0 && api.get_ss_onSuccess().toLowerCase().indexOf("thankyou") == -1 && data.message.cardIsPrepaid) {//if prepaid card used
                window.location.href = api.get_ss_onSuccess() + ".html?fields_step=upsell" + query_url.params + "&descriptor=" + encodeURIComponent(query_url.order_items.toString())
                    + "&desc_individual=" + encodeURIComponent(query_url.descriptor_individual.toString());
            } else if (form_obj.listUpsells.length != 0) {
                window.location.href = "upsell.html?fields_step=upsell" + query_url.params +
                    "&descriptor=" + encodeURIComponent(query_url.order_items.toString()) + "&desc_individual=" + encodeURIComponent(query_url.descriptor_individual.toString()) + "&fields_fname=" + data.message.firstName + "&fields_lname=" + data.message.lastName;
            } else {
                window.location.href = "thankyou.html?fields_step=thankyou" + query_url.params +
                    "&descriptor=" + encodeURIComponent(query_url.order_items.toString()) + "&desc_individual=" + encodeURIComponent(query_url.descriptor_individual.toString()) + "&fields_fname=" + data.message.firstName + "&fields_lname=" + data.message.lastName;
            }
        }

        form_obj.secondSubmit_Callback = function (data) {
            if (req_response(data)) {
                var query_url = form_obj.cleanQueryURL(data);
                // save data to boss database               
                form_obj.redirectionToPage(query_url, data);
            } else {
                form_obj.hideProgress();
                //ss_id is the id for straight sale product option subtitute for trial if prepaid card is use
                if (api.get_ss_id() != 0 && data.message.toLowerCase().indexOf("prepaid") != -1) {
                    if (data.message.toLowerCase().indexOf("already purchased") != -1) {
                        alert(data.message);
                    } else {
                        showStraightSaleOption();
                    }
                } else {
                    alert("ERROR: " + data.message)
                }

            }
        }

        
        //get storage name for cart
        form_obj.getCartStorageName= function () {
            var currentOffer = window.location.pathname.substr(0, window.location.pathname.lastIndexOf('/')).toLowerCase().replace('/mobile', '');
            var pos = currentOffer.lastIndexOf('/');
            currentOffer = $.trim(currentOffer.substr(pos).replace("/", ""));
            if (currentOffer == extractDomain(window.location.pathname)) {
                currentOffer = '';
            }
            return location.hostname.trim()+ "/" + currentOffer;
        }
        
        //select storage either cookie or localStorage
        form_obj.cartStorage=function(){           
                if(typeof localStorage !== 'undefined'){
                    //use local storage 
                    return localStorage.getItem(form_obj.getCartStorageName())
                }else{
                    //use cookie
                    return $.cookie("cartItem_dw");
                }           
        }

        //this will check if cart uses localStorage for cart
        form_obj.cartInLocalStorage = function(){
            var cartInLocalStorage = 0;
            var ty_data=""
            if(getQueryStringByName("fields_step")=="thankyou"){
                ty_data="ty_data";
            }
           
            if(typeof localStorage !== 'undefined'){
                if(localStorage.getItem(form_obj.getCartStorageName()+ty_data)==null) {
                    return cartInLocalStorage =0;
                }else{
                   
                    return cartInLocalStorage =  Object.keys(JSON.parse(localStorage.getItem(form_obj.getCartStorageName()+ty_data))).length;           
                }                
            }
            return cartInLocalStorage;
        }

        //this well set ty_data 
        form_obj.cartItemsThankyou=function(){ 
            if ($.cookie("cartItem_dw") != null && form_obj.cartInLocalStorage()==0) {
                    $.removeCookie("ty_data");
                    $.cookie("ty_data", $.cookie("cartItem_dw"))
                    $.removeCookie("cartItem_dw");
            }else{                    
                    localStorage.removeItem(form_obj.getCartStorageName()+"ty_data");
                    localStorage.setItem(form_obj.getCartStorageName()+"ty_data", form_obj.cartStorage())
                    localStorage.removeItem(form_obj.getCartStorageName());
            }
        }

        //this get cookie ty_data or localstorage ty_data
        form_obj.getCartItemsThankyou=function(){ 
            if ($.cookie("cartItem_dw") != null && form_obj.cartInLocalStorage()==0) {  
                     
                    return $.cookie("ty_data");
            }else{                    
                    return localStorage.getItem(form_obj.getCartStorageName()+"ty_data");                    
            }
        }


        form_obj.firstSubmit_Callback = function (data) {
            if (req_response(data)) {
                var query_url = form_obj.cleanQueryURL(data);
                //check if CART
                if (api.getOfferType() == "CART") {
                    form_obj.cartItemsThankyou();
                }
                switch (checkoutType) {
                    case "compact":
                    case "normal":
                        additional_params = updateQueryStringParameter(additional_params, 'geoLookUp', '');
                        additional_params = updateQueryStringParameter(additional_params, 'orderId', data.message.orderId);
                        additional_params = updateQueryStringParameter(additional_params, 'checkoutType', api.getCheckoutType());
                        additional_params = updateQueryStringParameter(additional_params, 'offerType', api.getOfferType().toLowerCase());
                        additional_params = updateQueryStringParameter(additional_params, 'campaignId', data.message.campaignId);


                        window.location.href = "checkout.html?fields_step=second" + additional_params.replace("?geoLookUp", "&geoLookUp") + "&fields_fname=" + data.message.firstName + "&fields_lname=" + data.message.lastName;
                        break;
                    default:
                        // save data to boss database
                        form_obj.redirectionToPage(query_url, data);
                        break;
                }

            } else {
                form_obj.hideProgress();
                //ss_id is the id for straight sale product option subtitute for trial if prepaid card is use
                if (api.get_ss_id() != 0 && data.message.toLowerCase().indexOf("prepaid") != -1) {
                    if (data.message.toLowerCase().indexOf("already purchased") != -1) {
                        alert(data.message);
                    } else {
                        showStraightSaleOption();
                    }

                } else {
                    alert("ERROR: " + data.message)
                }

            }

        }

        form_obj.geoLookUpOptions = function (options_) {
            for (var key in options_) {
                geo_options[key] = options_[key];
            }
            return geo_options;
        }

        form_obj.geoLookUp_ = function () {
            var input = document.querySelector("#fields_phone");
            iti = window.intlTelInput(input, form_obj.geoLookUpOptions());

        }

        form_obj.getNumber_iti = function () {
            return iti.getNumber();
        }

        form_obj.submitHandler = function () {
            $.validator.setDefaults({
                ignore: [],
                errorPlacement: function (error, element) {
                    //override, prevent showing errors in html
                },
                invalidHandler: function (event, validator) {
                    if (error_msg != '') {
                        alert('PAGE WILL NOT PROCEED UNLESS DEVELOPER/DESIGNER WILL CORRECT THE FF:\n\n' + error_msg);
                    }
                    else {

                        //if cart it should have items in cart
                        if (api.getOfferType() == "CART") {
                            if (form_obj.getCartStoredItems() == null) {
                                alert("No Item on cart");
                                return false;
                            }
                            if (JSON.parse(form_obj.getCartStoredItems()).length == 0) {
                                alert("No Item on cart");
                                return false;
                            }
                        }

                        var error_summary = '';
                        $.each(validator.errorList, function () { error_summary += this.message + "\n"; });
                        if (error_summary != '') {
                            //*** if there is an exit pop-up for this page, reset it
                            if (typeof (byPassExit) !== 'undefined') {
                                byPassExit = false
                            }
                            //***
                            setTimeout(function (e) {
                                alert('Please enter/correct the following required fields:\n\n' + error_summary);
                            }, 1);
                        }
                    }
                },
                submitHandler: function (form, event) {

                    //if cart it should have items in cart
                    if (api.getOfferType() == "CART") {
                        if (form_obj.getCartStoredItems() == null) {
                            alert("No Item on cart");
                            return false;
                        }
                        if (JSON.parse(form_obj.getCartStoredItems()).length == 0) {
                            alert("No Item on cart");
                            return false;
                        }
                    }

                    if (error_msg != '') {
                        alert('PAGE WILL NOT PROCEED UNLESS DEVELOPER/DESIGNER WILL CORRECT THE FF:\n\n' + error_msg);
                    }
                    else if (wasSubmitted == false) {
                        wasSubmitted = true;
                        form_obj.showProgress();//show loading

                        //*** if there is an exit pop-up for this page, bypass it
                        if (typeof (byPassExit) !== 'undefined') {
                            byPassExit = true;
                        }

                        var iti_phoneNumber = "";
                        if (api.get_geoLookUp()) {
                            iti_phoneNumber = iti.getNumber().replace(/ /g, "").trim();
                        }

                        if ($('#fields_step').val() == "first") {//if signup page
                            additional_params = "";
                            if ($('#fields_address2').length > 0) {
                                additional_params += '&fields_address2=' + encodeURIComponent($('#fields_address2').val());
                            }
                            additional_params += '&fields_fname=' + encodeURIComponent(removeExtraSpaces($('#fields_fname').val()))
                                + '&fields_lname=' + encodeURIComponent(removeExtraSpaces($('#fields_lname').val()))
                                + '&fields_country=' + encodeURIComponent($('#fields_country_select').val())
                                + '&fields_email=' + encodeURIComponent($.trim($('#fields_email').val()))
                                + '&orderId=' + encodeURIComponent($.trim($('#fields_email').val()))
                                + '&checkoutType=' + encodeURIComponent($.trim(api.getCheckoutType()))
                                + '&offerType=' + encodeURIComponent($.trim(api.getOfferType().toLowerCase()))
                                + '&campaignId=' + additionalQuery();

                            if (checkoutType != 'compact') {
                                additional_params += '&fields_address1=' + encodeURIComponent(removeExtraSpaces($('#fields_address1').val()))
                                    + '&fields_city=' + encodeURIComponent(removeExtraSpaces($('#fields_city').val()))
                                    + '&fields_zip=' + encodeURIComponent($('#fields_zip').val());
                                additional_params += '&fields_state=' + encodeURIComponent($('#fields_state option:selected').val());
                            }
                            if (api.get_geoLookUp()) {
                                additional_params += '&fields_phone=' + encodeURIComponent(iti.getNumber().replace(/ /g, "").trim());
                            } else {
                                additional_params += '&fields_phone=' + encodeURIComponent($('#fields_phone').val().replace(/ /g, "").trim());
                            }

                            var params = removeQuerystring(location.search, 'fields_fname');
                            params = removeQuerystring(params, 'fields_lname');
                            params = removeQuerystring(params, 'fields_phone');
                            params = removeQuerystring(params, 'fields_lname');
                            params = removeQuerystring(params, 'fields_product_name');
                            params = removeQuerystring(params, 'fields_country');
                            params = removeQuerystring(params, 'fields_email');
                            if (checkoutType != 'compact') {
                                params = removeQuerystring(params, 'fields_address1');
                                if (getQueryStringByName('fields_address2') != '') {
                                    params = removeQuerystring(params, 'fields_address2');
                                }
                                params = removeQuerystring(params, 'fields_city');
                                params = removeQuerystring(params, 'fields_zip');
                                params = removeQuerystring(params, 'fields_state');
                            }
                            params = removeQuerystring(params, 'fields_country');
                            additional_params += "&" + params.replace('?', '');

                            if (checkoutType == "one-page" && $("#cc_number").length != 0) {
                                if (konnektiveOrderValid()) {

                                    api.importOrder(form_obj.cartItems(), $("#pay_source").val(), function (importOrder_data) {
                                        form_obj.firstSubmit_Callback(importOrder_data);
                                    }, iti_phoneNumber);
                                } else {
                                    alert("Missing Campaign Id");
                                    form_obj.hideProgress();
                                }
                            } else if (checkoutType == "one-page" && $("#cc_number").length == 0) {
                                alert("Please check the funnel, must have credit card number field for one page checkout");
                                form_obj.hideProgress();
                            } else {
                                api.importLead(form_obj.firstSubmit_Callback);//import lead to konnektive
                            }

                        }
                        else if (getQueryStringByName('fields_step') == "second") {

                            if (getQueryStringByName("campaignId") == "" && $("#cc_number").length != 0) {
                                alert("Missing Campaign Id");
                                form_obj.hideProgress();
                                return false;
                            }

                            if (konnektiveOrderValid()) {
                                api.importOrder(form_obj.cartItems(), $("#pay_source").val(), function (importOrder_data) {
                                    form_obj.secondSubmit_Callback(importOrder_data);
                                }, "");
                            } else {
                                alert("Missing Campaign Id");
                                form_obj.hideProgress();
                            }
                        }
                    }

                }
            });


        }

        form_obj.additionalHandlebarsFunctions = function () {
            //this is intentionally empty
            // use to override this function incase you add handlebars function
            // you can add spices here
        }

        //handlebars js functions templating
        form_obj.initHandlebarsFuntions = function () {


            Handlebars.registerHelper('contains', function (needle, haystack, options) {
                needle = Handlebars.escapeExpression(needle).toLowerCase();
                haystack = Handlebars.escapeExpression(haystack);
                return (haystack.toLowerCase().indexOf(needle) > -1) ? options.fn(this) : options.inverse(this);
            });

            Handlebars.registerHelper('notcontains', function (needle, haystack, options) {
                needle = Handlebars.escapeExpression(needle).toLowerCase();
                haystack = Handlebars.escapeExpression(haystack);
                return (haystack.toLowerCase().indexOf(needle) == -1) ? options.fn(this) : options.inverse(this);
            });


            Handlebars.registerHelper("xif", function (expression, options) {
                return Handlebars.helpers["x"].apply(this, [expression, options]) ? options.fn(this) : options.inverse(this);
            });

            Handlebars.registerHelper("len", function (json) {
                return Object.keys(json).length;
            });

            Handlebars.registerHelper("toFixed", function (val) {
                return parseFloat(val).toFixed(2);
            });

            Handlebars.registerHelper("lowerCase", function (str) {
                return str.toLowerCase();
            });

            Handlebars.registerHelper("indexOf", function (str, contain) {
                return str.indexOf(contain);
            });

            Handlebars.registerHelper("math", function (lvalue, operator, rvalue, options) {
                if (arguments.length < 4) {
                    // Operator omitted, assuming "+"
                    options = rvalue;
                    rvalue = operator;
                    operator = "+";
                }

                lvalue = parseFloat(lvalue);
                rvalue = parseFloat(rvalue);

                return {
                    "+": lvalue + rvalue,
                    "-": lvalue - rvalue,
                    "*": lvalue * rvalue,
                    "/": lvalue / rvalue,
                    "%": lvalue % rvalue
                }[operator].toFixed(2);
            });

            Handlebars.registerHelper('ifCond', function (v1, operator, v2, options) {

                switch (operator) {
                    case '==':
                        return (v1 == v2) ? options.fn(this) : options.inverse(this);
                    case '===':
                        return (v1 === v2) ? options.fn(this) : options.inverse(this);
                    case '!=':
                        return (v1 != v2) ? options.fn(this) : options.inverse(this);
                    case '!==':
                        return (v1 !== v2) ? options.fn(this) : options.inverse(this);
                    case '<':
                        return (v1 < v2) ? options.fn(this) : options.inverse(this);
                    case '<=':
                        return (v1 <= v2) ? options.fn(this) : options.inverse(this);
                    case '>':
                        return (v1 > v2) ? options.fn(this) : options.inverse(this);
                    case '>=':
                        return (v1 >= v2) ? options.fn(this) : options.inverse(this);
                    case '&&':
                        return (v1 && v2) ? options.fn(this) : options.inverse(this);
                    case '||':
                        return (v1 || v2) ? options.fn(this) : options.inverse(this);
                    default:
                        return options.inverse(this);
                }


            });

            Handlebars.registerHelper("x", function (expression, options) {
                var result;

                // you can change the context, or merge it with options.data, options.hash
                var context = this;

                // yup, i use 'with' here to expose the context's properties as block variables
                // you don't need to do {{x 'this.age + 2'}}
                // but you can also do {{x 'age + 2'}}
                // HOWEVER including an UNINITIALIZED var in a expression will return undefined as the result.
                with (context) {
                    result = (function () {
                        try {
                            return eval(expression);
                        } catch (e) {
                            console.warn('•Expression: {{x \'' + expression + '\'}}\n•JS-Error: ', e, '\n•Context: ', context);
                        }
                    }).call(context); // to make eval's lexical this=context
                }
                return result;
            });

            Handlebars.registerHelper("xif", function (expression, options) {
                return Handlebars.helpers["x"].apply(this, [expression, options]) ? options.fn(this) : options.inverse(this);
            });
        }

        form_obj.exec = function () {

            form_obj.showProgress();
            $(document).ready(function () {

                if (typeof Handlebars != "undefined") {
                    form_obj.initHandlebarsFuntions();
                    form_obj.additionalHandlebarsFunctions();
                }

                if (typeof intlTelInput == "undefined" && api.get_geoLookUp()) {
                    alert("Error: You're using geoLookUp but required script is not loaded successfully." +
                        "Please add the ff. required script and style in your page:\n\n" +
                        "- <script src='/onlineorder/js/konnek.api/build/js/intlTelInput.min.js'></script>\n" +
                        "- <link rel='stylesheet' href='/onlineorder/js/konnek.api/build/css/intlTelInput.min.css'>");
                    return false;
                }

                if (typeof api == "undefined") {
                    alert("Error: Please pass KonnekApiInit() function as parameter to KonnekForm() function.");
                    return false;
                }

                if (api.get_psmrToBoss() == 1 && api.get_psmrBoss_key() == "" && api.get_psmr_prod_id() != 0) {
                    alert("Page has psmr but psmr api key is empty. Please add it.");
                    return false;
                }

                // if (api.get_psmrToBoss() == 1 && api.get_psmrBoss_key() != "" && api.get_psrm_keycode() != "") {
                //     form_obj.test_psmr_api();
                // }

                if (getQueryStringByName('paypalAccept') == '' && getQueryStringByName("token") != "") {  //paypal return on failed
                    if (sessionStorage.getItem("redirection_paypal") != null) {
                        window.location.href = sessionStorage.getItem("redirection_paypal");
                    }

                } else if (getQueryStringByName('paypalAccept') == '1') {
                    //paypal return on success
                    //checkout page
                    if ((getQueryStringByName("fields_step") == "" || getQueryStringByName("fields_step") == "second") && $("#yes-upsell-relink").length == 0
                        && location.pathname.toLowerCase().indexOf("/shared_pages/") == -1
                        && location.pathname.toLowerCase().indexOf("/shared_pages") == -1
                        && location.pathname.toLowerCase().indexOf("upsell.html") == -1) {
                        var paypalArray = [];
                        paypalArray.push(JSON.parse(sessionStorage.getItem("paypalExpress")));
                        api.confirmPaypal(paypalArray, function (res) {
                            if (res.result.toLowerCase() == "success") {
                                api.setCompaignId(paypalArray[0].campaignId)
                                api.queryCampaign(function (data) {
                                    form_obj.listUpsells = getProductOffers(data.message.data[paypalArray[0].campaignId].products, "UPSALE");//stored upsells to listUpsells
                                    if (getQueryStringByName('fields_step') == "second") {
                                        form_obj.secondSubmit_Callback(res);
                                    } else {
                                        form_obj.firstSubmit_Callback(res);
                                    }
                                });
                            } else {
                                alert(res.message);
                                form_obj.hideProgress();
                                //if(res.message.indexOf('already')!=-1){
                                window.location.href = sessionStorage.getItem("redirection_paypal");
                                //}
                            }
                        });
                    } else {
                        form_obj.PageEvent("upsell");
                    }

                    //presell page
                } else if ($("#fields_fname").length == 0 && $("#cc_number").length == 0 && getQueryStringByName("fields_step") == "") {

                    if (!checkCampaignID()) {
                    } else {
                        //trigger importClick as presell page
                        if (getQueryStringByName("PayerID") == "" || getQueryStringByName("paypalAccept") == "") {
                            api.importClick();
                        }

                        api.queryCampaign(function () {
                            var params = location.search;
                            params = removeQuerystring(params, 'campaignId');
                            params = removeQuerystring(params, 'checkoutType');
                            params = removeQuerystring(params, 'offerType');

                            $("a").unbind();
                            $("a").each(function () {
                                var defaultHref = $(this).attr("href");
                                if (hasQueryURL()) {
                                    $(this).attr("href", defaultHref + params + "&campaignId=" + api.getCompaignId() + "&checkoutType=" + api.getCheckoutType()
                                        + "&offerType=" + api.getOfferType().toLowerCase() + additionalQuery())
                                } else {
                                    $(this).attr("href", defaultHref + "?campaignId=" + api.getCompaignId() + "&checkoutType=" + api.getCheckoutType() + "&offerType=" + api.getOfferType().toLowerCase() + additionalQuery())
                                }
                            });
                            //load product option if is_intro is exists and has a value of 1
                            if ($('#is_intro').length > 0 && $('#is_intro').val() == '1') {
                                form_obj.PageEvent('welcome');
                            }

                            form_obj.hideProgress();
                        }); //initialized query


                    }

                } else {
                    if (!checkCampaignID()) {
                    } else {
                        form_obj.initPage();
                    }
                }
            })

        }

        return form_obj;
    }

    var init = 'KonnekForm';
    /**
     * Make Form object accessible globally
     */
    if (typeof window[init] !== 'function') {
        window[init] = Form;
    }
})();
