var exp_entry_global_url = 'https://expressentry.melissadata.net/web/GlobalExpressFreeForm?id=f4hOmE545susi_wOHKsORa**&format=json&maxrecords=10';
var exp_entry_us_url = 'https://expressentry.melissadata.net/web/ExpressFreeForm?id=f4hOmE545susi_wOHKsORa**&format=json&maxrecords=10';
var exp_entry_url = '';
var exp_ajax_req = new Object();
var exp_prev_val_len = new Object();
var json_mexico_states = {};
var json_bahamas_states = {};
var json_canada_states = {};
var json_costa_rica_states = {};
var json_spain_states = {}

function express_entry_start() {
    //load all states from these countries, taken from https://github.com/astockwell/countries-and-provinces-states-regions/tree/master/countries
    $.getJSON(location.protocol + '//' + location.host + '/onlineorder/js/json/mexico.json', function (data) {
        json_mexico_states = data;
    }).fail(function () {
        console.log("Error loading mexico.json.");
    });
    $.getJSON(location.protocol + '//' + location.host + '/onlineorder/js/json/bahamas.json', function (data) {
        json_bahamas_states = data;
    }).fail(function () {
        console.log("Error loading bahamas.json.");
    });
    $.getJSON(location.protocol + '//' + location.host + '/onlineorder/js/json/canada.json', function (data) {
        json_canada_states = data;
    }).fail(function () {
        console.log("Error loading canada.json.");
    });
    $.getJSON(location.protocol + '//' + location.host + '/onlineorder/js/json/costa-rica.json', function (data) {
        json_costa_rica_states = data;
    }).fail(function () {
        console.log("Error loading costa-rica.json.");
    });
    $.getJSON(location.protocol + '//' + location.host + '/onlineorder/js/json/spain.json', function (data) {
        json_spain_states = data;
    }).fail(function () {
        console.log("Error loading spain.json.");
    });

    //load express entry css
    $('head').append('<link rel="stylesheet" href="' + location.protocol + '//' + location.host
        + '/onlineorder/css/express-entry.css" type="text/css" />');

    ExpressEntry('#fields_address1', 5);
    ExpressEntry('#fields_address2', 2);
    ExpressEntry('#fields_city', 2);
    //ExpressEntry('#fields_zip', 2);
}

$(document).ready(function () {
    express_entry_start();
});
function ShowSuggestion(el) {
    if ($.trim($(el).attr('data-suggested')) != '') {
        var type = $(el).attr('id');
        if ($('.control-' + type).length == 0) {
            $('<div class="autocomplete-express control-' + type + '"><ul></ul></div>').insertAfter($(el));
        }
        var len = 0;
        if ($.trim($(el).val()).length > $(el).attr('data-suggested').length) {
            len = $(el).attr('data-suggested').length;
        }
        else {
            len = $.trim($(el).val()).length;
        }
        if ($.trim($(el).val()).substr(0, len).toLowerCase() == $(el).attr('data-suggested').substr(0, len).toLowerCase()) {
            if ($('.control-' + type + ' .autocomplete-suggest').length == 0) {
                $('.control-' + type + ' ul').prepend('<li class="autocomplete-suggest"><strong>Recommended:</strong><br/><span>' + $(el).attr('data-suggested') + '</span></li>');
            }
            else {
                $('.control-' + type + ' .autocomplete-suggest span').text($(el).attr('data-suggested'));
            }
            $('.control-' + type + ' .autocomplete-suggest').attr('data-suggested', $(el).attr('data-suggested'));
            $('.control-' + type).slideDown();
            $('.control-' + type + ' .autocomplete-suggest').unbind('click');
            $('.control-' + type + ' .autocomplete-suggest').bind('click', function () {
                $(el).val($(this).find('span').text());
                $('.control-' + type).fadeOut();
            });
        }
        else {
            $('.control-' + type + ' .autocomplete-suggest').remove();
        }
    }
}
function isDuplicate(addrCollection, newAddress) {

    var result = false;
    if (addrCollection.length > 0) {
        $.each(addrCollection, function (key, value) {
            if (addrCollection.address1 == newAddress.address1 && (addrCollection.address2 == newAddress.address2 && addrCollection.address2 != '' && newAddress.address2 != '') &&
                addrCollection.city == newAddress.city && addrCollection.state == newAddress.state && addrCollection.zip == newAddress.zip &&
                addrCollection.country == newAddress.country) {
                result = true;
            }
        });
    }
    return result;
}

function FindState(el, val) {
    var json = {};
    //get the state name from the dropdownlist
    if ($(el).length > 0) {
        $(el + ' > option').each(function (index) {
            if ($.trim($(this).val().toLowerCase()) == $.trim(val.toLowerCase())) {
                json.state = $(this).val();
                json.stateName = $(this).text();
            }
        });
    }
    return json;
}

function FindStateJSON(el, ISO3Country, state, stateAlt) {
    var json = {};
    switch (ISO3Country.toLowerCase()) {
        case 'mex':
            //Mexico
            $.each(json_mexico_states, function (i, item) {
                if (item.code.toLowerCase() == stateAlt.toLowerCase()) {
                    json.state = item.code;
                    json.stateName = item.name;
                }
            });
            break;
        case 'bhs':
            //Bahamas
            $.each(json_bahamas_states, function (i, item) {
                if (item.code.toLowerCase() == stateAlt.toLowerCase()) {
                    json.state = item.code;
                    json.stateName = item.name;
                }
            });
            break;
        case 'can':
            //Canada
            $.each(json_canada_states, function (i, item) {
                if (item.code.toLowerCase() == stateAlt.toLowerCase()) {
                    json.state = item.code;
                    json.stateName = item.name;
                }
            });
            break;
        case 'cri':
            //Costa Rica
            $.each(json_costa_rica_states, function (i, item) {
                if (item.code.toLowerCase() == stateAlt.toLowerCase()) {
                    json.state = item.code;
                    json.stateName = item.name;
                }
            });
            break;
        case 'gum':
            //Guam
            json.state = 'GU';
            json.stateName = 'Guam'
            break;
    }
    if (json.hasOwnProperty('state')) {
        //state found on the JSON file, find it on the dropdown list by the text name instead of val
        if ($(el).length > 0) {
            $(el + ' > option').each(function (index) {
                if ($.trim($(this).text().toLowerCase()) == $.trim(json.stateName.toLowerCase())) {
                    json.state = $(this).val();
                    json.stateName = $(this).text();
                }
            });
        }
    }
    return json;
}

function ExpressEntry(el, stringTriggerLength, callback) {

    if ($(el).length > 0) {
        $(el).attr('autocomplete', 'off');
        $(el).bind('keyup propertychange paste', function (e) {
            var data_var = {}
            exp_entry_url = exp_entry_global_url;

            if (e.type == 'paste') {
                data_var.type = $(this).attr('id');
                data_var.value = $.trim(e.originalEvent.clipboardData.getData('text'));
            }
            else {
                data_var.type = $(this).attr('id');
                data_var.value = $.trim($(this).val());
            }

            var results_var = {};

            if ($(el).val().length < stringTriggerLength && e.type != 'paste') {
                if ($('.control-' + data_var.type + ' .autocomplete-item').length > 0) {
                    $('.control-' + data_var.type + ' .autocomplete-item').remove();
                }
                return false;
            }

            var searchString = '&ff=';

            if ($('.control-' + data_var.type).length == 0) {
                var cssFloat = $(el).css('float');
                var inputWidth = $('#fields_address1').width();
                var inputPaddingRight = parseInt($('#fields_address1').css("padding-right"));
                var inputPaddingLeft = parseInt($('#fields_address1').css("padding-left"));
                $('<div class="autocomplete-express control-' + data_var.type + '"><ul></ul></div>').insertAfter($(this)).promise().done(function () {
                    $('.control-' + data_var.type + '').parent().css('position', 'relative');
                    $('.control-' + data_var.type + ' ul').css({
                        'width': inputWidth + inputPaddingRight + inputPaddingLeft + 2,
                        'float': cssFloat
                    });
                    if (cssFloat != 'none') {
                        $('.control-' + data_var.type + ' ul').css({
                            'top': '11px'
                        });
                    }
                });
            }
            if ((stringTriggerLength == 0 && data_var.value != '') || (data_var.value.length >= stringTriggerLength /*&& (data_var.value.length != exp_prev_val_len[data_var.type] || typeof (exp_prev_val_len[data_var.type]) == 'undefined')*/) && data_var.value != '') {
                exp_prev_val_len[data_var.type] = data_var.value.length;
                if ($.active == 1 && typeof exp_ajax_req[data_var.type] != "undefined") {
                    exp_ajax_req[data_var.type].abort();
                    if (exp_ajax_req[data_var.type].statusText == 'abort') {
                        //tasks to do after ajax abort
                        console.log('aborted')
                        $('.control-' + data_var.type + ' .autocomplete-loader').remove();
                    }
                }
                if ($('.control-' + data_var.type + ' .autocomplete-item').length > 0) {
                    $('.control-' + data_var.type + ' .autocomplete-item').remove();
                }
                if ($('.control-' + data_var.type + ' .autocomplete-loader').length == 0) {
                    $('.control-' + data_var.type + ' ul').append('<li class="autocomplete-loader"><span>Loading suggestions...</span></li>');
                }
                ShowSuggestion(el);
                $('.control-' + data_var.type).slideDown();

                if ($.trim($('#fields_address1').val()) != '') {
                    data_var.address = $.trim($('#fields_address1').val());
                }
                if ($.trim($('#fields_address2').val()) != '') {
                    data_var.apt = $.trim($('#fields_address2').val());
                }
                if ($.trim($('#fields_city').val()) != '') {
                    data_var.city = $.trim($('#fields_city').val());
                }
                if ($.trim($('#fields_state').val()) != '') {
                    data_var.state = $.trim($('#fields_state').val());
                }
                if ($.trim($('#fields_zip').val()) != '') {
                    data_var.zip = $.trim($('#fields_zip').val());
                }
                if ($.trim($('#fields_country_select').val()) != '') {
                    data_var.country = $.trim($('#fields_country_select').val());
                }

                if (e.type == 'paste') {
                    switch (data_var.type) {
                        case 'fields_address1':
                            data_var.address = data_var.value;
                            break;
                        case 'fields_address2':
                            data_var.apt = data_var.value;
                            break;
                        case 'fields_city':
                            data_var.city = data_var.value;
                            break;
                    }
                }


                //  $('input[type=text], body').unbind('click');
                $('input[type=text], body').bind('click', function () {
                    var id = $(this).attr('id');
                    $('.autocomplete-express').not('.control-' + id).hide();
                    //kill, existing ajax request
                    for (var key in exp_ajax_req) {
                        if (exp_ajax_req.hasOwnProperty(key)) {
                            if (key != id) {
                                exp_ajax_req[key].abort();
                            }
                        }
                    }
                });

                $('#' + data_var.type).bind('click', function () {
                    var id = $(this).attr('id');
                    var fieldVal = $.trim($(this).val());
                    $('.autocomplete-express').not('.control-' + id).hide();
                    //kill, existing ajax request
                    for (var key in exp_ajax_req) {
                        if (exp_ajax_req.hasOwnProperty(key)) {
                            if (key != id) {
                                exp_ajax_req[key].abort();
                            }
                        }
                    }

                    if (fieldVal.length == 0) {
                        //if empty field, remove suggestions
                        if ($('.control-' + data_var.type + ' .autocomplete-item').length > 0) {
                            $('.control-' + data_var.type + ' .autocomplete-item').remove();
                        }
                    }

                    if ($('.control-' + id + ' .autocomplete-item').length > 0 && fieldVal.length > 0) {
                        $('.autocomplete-express.control-' + id).slideDown();
                    }
                });

                if (data_var.hasOwnProperty('address')) {
                    if ($.trim(data_var.address) != '') {
                        searchString += $.trim(data_var.address) + ' ';
                    }
                }
                if (data_var.hasOwnProperty('apt')) {
                    if ($.trim(data_var.apt) != '') {
                        searchString += $.trim(data_var.apt) + ' ';
                    }
                }
                if (data_var.hasOwnProperty('city')) {
                    if ($.trim(data_var.city) != '') {
                        searchString += $.trim(data_var.city) + ' ';
                    }
                }
                if (data_var.hasOwnProperty('state')) {
                    if ($.trim(data_var.state) != '') {
                        searchString += $.trim(data_var.state) + ' ';
                    }
                }
                if (data_var.hasOwnProperty('zip')) {
                    if ($.trim(data_var.zip) != '') {
                        searchString += $.trim(data_var.zip) + ' ';
                    }
                }
                if (data_var.hasOwnProperty('country')) {
                    if (data_var.country.toLowerCase() == 'us' || data_var.country.toLowerCase() == 'usa') {
                        exp_entry_url = exp_entry_us_url;
                        results_var.country = 'usa';
                    }
                    else {
                        searchString = $.trim(searchString) + '&country=' + $.trim(data_var.country) + ' ';
                        results_var.country = data_var.country.toLowerCase();
                    }
                }

                exp_ajax_req[data_var.type] = $.ajax({
                    url: exp_entry_url,
                    data: $.trim(searchString),
                    type: "GET",
                    dataType: "json",
                    cache: false
                });

                exp_ajax_req[data_var.type].done(function (result) {
                    if (result.hasOwnProperty('ResultCode')) {
                        if (result.ResultCode != 'XS03') {
                            $('.control-' + data_var.type + ' .autocomplete-loader').remove();
                            var resultsCollection = [];

                            $.each(result.Results, function (i, item) {
                                var jsonRes = {}
                                if (results_var.country == 'usa') {
                                    jsonRes.address1 = $.trim(result.Results[i].Address.AddressLine1);
                                    jsonRes.address2 = $.trim(result.Results[i].Address.SuiteName);
                                    jsonRes.city = $.trim(result.Results[i].Address.City);
                                    jsonRes.zip = $.trim(result.Results[i].Address.PostalCode);
                                    jsonRes.state = $.trim(result.Results[i].Address.State);
                                    jsonRes.stateAlternate = $.trim(result.Results[i].Address.CountrySubdivisionCode);
                                    jsonRes.countryISO3 = 'USA';
                                    jsonRes.countryISO2 = 'US';
                                }
                                else {
                                    jsonRes.address2 = '';
                                    jsonRes.city = '';
                                    jsonRes.state = '';
                                    jsonRes.address1 = $.trim(result.Results[i].Address.Address1);
                                    if ($.trim(result.Results[i].Address.CityAccepted) != '') {
                                        jsonRes.address2 = $.trim(result.Results[i].Address.Locality);
                                    }
                                    if ($.trim(result.Results[i].Address.CityAccepted) != '') {
                                        jsonRes.city = $.trim(result.Results[i].Address.CityAccepted);
                                    }
                                    else if ($.trim(result.Results[i].Address.Locality) != '') {
                                        jsonRes.city = $.trim(result.Results[i].Address.Locality);
                                    }
                                    jsonRes.zip = $.trim(result.Results[i].Address.PostalCodePrimary);
                                    if (result.Results[i].Address.AdministrativeArea != '') {
                                        jsonRes.state = $.trim(result.Results[i].Address.AdministrativeArea);
                                        jsonRes.stateAlternate = $.trim(result.Results[i].Address.CountrySubdivisionCode);
                                    }
                                    jsonRes.countryISO3 = $.trim(result.Results[i].Address.ISO3166_3);
                                    jsonRes.countryISO2 = $.trim(result.Results[i].Address.ISO3166_2);
                                }
                                if (!isDuplicate(resultsCollection, jsonRes)) {
                                    resultsCollection.push(jsonRes);
                                }
                            });

                            // 
                            $.each(resultsCollection, function (key, item) {
                                var list_item_text = '', list_data = '';
                                var json_state = {};
                                results_var.address1 = item.address1;
                                results_var.address2 = item.address2;
                                results_var.city = item.city;
                                results_var.zip = item.zip;
                                results_var.state = item.state;
                                results_var.countryISO3 = item.countryISO3;
                                results_var.countryISO2 = item.countryISO2;
                                results_var.stateAlternate = item.stateAlternate;//the CountrySubdivisionCode value which sometimes contain the state/province abbreviation returned by Global Express Entry
                                results_var.stateRaw = item.state;//save the original state return by melissa data, useful for debugging
                                results_var.stateName = item.state;//fuse the default abbreviation as the fail-safe state name
                                var dropdownItemFound = false;
                                //get the state name from the dropdownlist
                                if ($('#fields_state').length > 0) {
                                    json_state = FindState('#fields_state', results_var.state);
                                    if (json_state.hasOwnProperty('state'))//state exists on the dropdown list
                                    {
                                        results_var.state = json_state.state;
                                        results_var.stateName = json_state.stateName;
                                    }
                                    else {
                                        //not found, try searching using JSON data
                                        if (results_var.countryISO3.toLowerCase() != 'usa') {
                                            json_state = FindStateJSON('#fields_state', results_var.countryISO3, results_var.state, results_var.stateAlternate);
                                            if (json_state.hasOwnProperty('state'))//state exists on the dropdown list
                                            {
                                                results_var.state = json_state.state;
                                                results_var.stateName = json_state.stateName;
                                            }
                                        }
                                        else {
                                            console.log('cannot find state name for ' + results_var.state);
                                        }
                                    }
                                }

                                switch (data_var.type) {
                                    case 'fields_address12':
                                    case 'fields_address1_bill':
                                    case 'fields_address1':
                                        list_item_text = results_var.address1;
                                        break;
                                    case 'fields_address22':
                                    case 'fields_address2_bill':
                                    case 'fields_address2':
                                        list_item_text = results_var.address2;
                                        break;
                                    case 'fields_city2':
                                    case 'fields_city_bill':
                                    case 'fields_city':
                                        list_item_text = results_var.city;
                                        break;
                                    case 'fields_zip2':
                                    case 'fields_zip_bill':
                                    case 'fields_zip':
                                        list_item_text = results_var.zip;
                                        break;
                                }
                                if (results_var.address1 != '') {

                                    if (data_var.type == 'fields_address1' || data_var.type == 'fields_address12' || data_var.type == 'fields_address1_bill') {
                                        list_data = '&nbsp;<strong>' + results_var.address1 + '</strong>';
                                    }
                                    else {
                                        list_data = '&nbsp;' + results_var.address1;
                                    }
                                }
                                //apt or addressline2
                                if ($.trim(results_var.address2) != '') {
                                    list_data += '&nbsp;<span class="express-apt">' + results_var.address2 + '</span>';
                                }

                                if ($.trim(results_var.city) != '') {
                                    if (data_var.type == 'fields_city' || data_var.type == 'fields_city2' || data_var.type == 'fields_city_bill') {
                                        list_data += '&nbsp;<strong>' + results_var.city + '</strong>';
                                    }
                                    else {
                                        list_data += '&nbsp;' + results_var.city;
                                    }
                                }

                                if (results_var.zip != '') {//zip code
                                    if (data_var.type == 'fields_zip') {
                                        list_data += '&nbsp;<strong><span class="express-zip">' + results_var.zip + '</span></strong>';
                                    }
                                    else {
                                        list_data += '&nbsp;<span class="express-zip">' + results_var.zip + '</span>';
                                    }
                                }


                                if (results_var.state != '') {//state
                                    list_data += '&nbsp;' + results_var.stateName;
                                }
                                if (results_var.countryISO3 != '') { //country
                                    list_data += '&nbsp;' + results_var.countryISO3;
                                }
                                list_item_text += '<div class="autocomplete-details">' + list_data + '</div>';

                                $('.control-' + data_var.type + ' ul').append('<li class="autocomplete-item" data-address="' + results_var.address1 + '" data-apt="' + results_var.address2 + '" data-city="' + results_var.city + '" data-state="' + results_var.state + '" data-stateraw="' + results_var.stateRaw + '" data-statealt="' + results_var.stateAlternate + '" data-zip="' + results_var.zip + '" data-countryiso2="' + results_var.countryISO2 + '" data-countryiso3="' + results_var.countryISO3 + '">' + list_item_text + '</li>');
                            });
                        }
                        else {
                            $('.control-' + data_var.type + ' .autocomplete-loader').text('No suggestions found.').delay(1000).slideUp(500, function () {
                                $('.control-' + data_var.type + ' .autocomplete-loader').delay(10000).remove();
                            });
                        }

                        $('.control-' + data_var.type + ' .autocomplete-item').unbind('click');
                        $('.control-' + data_var.type + ' .autocomplete-item').bind('click', function (e) {
                            //fill up the remaining fields if blank

                            var zip = '';
                            if (data_var.type.indexOf('_bill') > -1) {

                                if (data_var.type.indexOf('_zip') == -1) {
                                    if ($.trim($(this).attr('data-address')) != '') {
                                        $('#fields_address1_bill').val($(this).attr('data-address'));
                                    }
                                    $('#fields_address1_bill').attr('data-suggested', $(this).attr('data-address'));
                                    $('#fields_address2_bill').val($(this).attr('data-apt'));

                                    $('#fields_address2_bill').attr('data-suggested', $(this).attr('data-apt'));
                                }

                                if ($.trim($(this).attr('data-city')) != '') {
                                    $('#fields_city_bill').val($(this).attr('data-city'));
                                }
                                $('#fields_city_bill').attr('data-suggested', $(this).attr('data-city'));

                                if ($.trim($(this).attr('data-state')) != '') {
                                    $('#fields_state_bill').val($(this).attr('data-state'));
                                    $("#fields_state_bill option[value=" + $.trim($(this).attr('data-state')) + "]").attr('selected', 'selected');
                                    //fail-safe, select the - SELECT STATE - if state not found on the dropdownlist
                                    if ($.trim($('#fields_state_bill').val()) == '') {
                                        $("#fields_state_bill").prop("selectedIndex", 0).val();
                                    }
                                }
                                $('#fields_state_bill').attr('data-suggested', $(this).attr('data-state'));
                                $('#fields_zip_bill').val($(this).attr('data-zip'));
                                $('#fields_zip_bill').attr('data-suggested', $(this).attr('data-zip'));
                                $('#fields_zip_bill').rules('remove', 'validZipcode');
                                $('#fields_zip_bill').attr('maxlength', $('#fields_zip_bill').val().length);
                                $('#fields_zip_bill').rules('add', {
                                    maxlength: $('#fields_zip_bill').val().length
                                });
                                if (typeof ExpEntrZip_Key !== "undefined") {
                                    ExpEntrZip_Key('#fields_zip_bill');
                                }

                                $('#fields_address1_bill, #fields_address2_bill, #fields_city_bill, #fields_state_bill, #fields_zip_bill').valid();
                                if ($.trim($(this).attr('data-countryiso2')) != '') {
                                    $('#fields_country_select_bill, #fields_country_select_bill2').val($.trim($(this).attr('data-countryiso2')));
                                    $("#fields_country_select_bill option[value=" + $.trim($(this).attr('data-countryiso2')) + "]").attr('selected', 'selected');
                                    $("#fields_country_select_bill2 option[value=" + $.trim($(this).attr('data-countryiso2')) + "]").attr('selected', 'selected');
                                }

                                if ($.trim($(this).attr('data-countryiso2')) != '') {
                                    $('#fields_country_select_bill, #fields_country_select_bill2').val($.trim($(this).attr('data-countryiso2')));
                                    $("#fields_country_select_bill option[value=" + $.trim($(this).attr('data-countryiso2')) + "]").attr('selected', 'selected');
                                    $("#fields_country_select_bill2 option[value=" + $.trim($(this).attr('data-countryiso2')) + "]").attr('selected', 'selected');
                                    if ($.trim($('#fields_country_select_bill').val()) == '') {
                                        if ($.trim($(this).attr('data-countryiso3')) != '') {
                                            $('#fields_country_select_bill, #fields_country_select_bill2').val($.trim($(this).attr('data-countryiso3')));
                                            $("#fields_country_select_bill option[value=" + $.trim($(this).attr('data-countryiso3')) + "]").attr('selected', 'selected');
                                            $("#fields_country_select_bill2 option[value=" + $.trim($(this).attr('data-countryiso3')) + "]").attr('selected', 'selected');
                                            $('#fields_country_select_bill').trigger('change');
                                        }
                                    }
                                    else {
                                        $('#fields_country_select_bill').trigger('change');
                                    }
                                }
                            }
                            else {
                                if (data_var.type.indexOf('_zip') == -1) {
                                    if ($.trim($(this).attr('data-address')) != '') {
                                        $('#fields_address1, #fields_address12').val($(this).attr('data-address'));
                                    }
                                    $('#fields_address1, #fields_address12').attr('data-suggested', $(this).attr('data-address'));

                                    $('#fields_address2, #fields_address22').val($(this).attr('data-apt'));
                                    $('#fields_address2, #fields_address22').attr('data-suggested', $(this).attr('data-apt'));
                                }
                                if ($.trim($(this).attr('data-city')) != '') {
                                    $('#fields_city, #fields_city2').val($(this).attr('data-city'));
                                }
                                $('#fields_city, #fields_city2').attr('data-suggested', $(this).attr('data-city'));
                                if ($.trim($(this).attr('data-countryiso2')) != '') {
                                    $('#fields_country_select, #fields_country_select2').val($.trim($(this).attr('data-countryiso2')));
                                    $("#fields_country_select option[value=" + $.trim($(this).attr('data-countryiso2')) + "]").attr('selected', 'selected');
                                    $("#fields_country_select2 option[value=" + $.trim($(this).attr('data-countryiso2')) + "]").attr('selected', 'selected');
                                    if ($.trim($('#fields_country_select').val()) == '') {
                                        if ($.trim($(this).attr('data-countryiso3')) != '') {
                                            $('#fields_country_select, #fields_country_select2').val($.trim($(this).attr('data-countryiso3')));
                                            $("#fields_country_select option[value=" + $.trim($(this).attr('data-countryiso3')) + "]").attr('selected', 'selected');
                                            $("#fields_country_select2 option[value=" + $.trim($(this).attr('data-countryiso3')) + "]").attr('selected', 'selected');
                                            $('#fields_country_select').trigger('change');
                                        }
                                    }
                                    else {
                                        $('#fields_country_select').trigger('change');
                                        $('#fields_country_select').focus();
                                    }
                                }
                                if ($.trim($(this).attr('data-state')) != '') {
                                    $('#fields_state, #fields_state2').val($(this).attr('data-state'));
                                    $("#fields_state option[value=" + $.trim($(this).attr('data-state')) + "]").attr('selected', 'selected');
                                    //fail-over, select the first index if unknown state was returned by Melissa Data
                                    if ($.trim($('#fields_state').val()) == '') {
                                        $("#fields_state").prop("selectedIndex", 0).val();
                                    }
                                    if ($.trim($('#fields_state2').val()) == '') {
                                        $("#fields_state2").prop("selectedIndex", 0).val();
                                    }

                                }



                                $('#fields_state, #fields_state2').attr('data-suggested', $(this).attr('data-state'));
                                $('#fields_zip, #fields_zip2').val($(this).attr('data-zip').trim());

                                $('#fields_zip, #fields_zip2, #fields_zip_bill').rules('remove', 'validZipcode');
                                $('#fields_zip, #fields_zip2, #fields_zip_bill').attr('maxlength', $('#fields_zip').val().length);
                                $('#fields_zip, #fields_zip2, #fields_zip_bill').rules('add', {
                                    maxlength: $('#fields_zip').val().length
                                });

                                if (typeof ExpEntrZip_Key !== "undefined") {
                                    ExpEntrZip_Key('#fields_zip');
                                }

                                $('#fields_address1, #fields_address2, #fields_city, #fields_state, #fields_zip').valid();
                            }
                            $('.control-' + data_var.type).fadeOut();
                        });
                        if (typeof TriggerChange !== "undefined") {
                            TriggerChange('fields_address1', 'fields_address12');
                        }

                    }
                    else {
                        $('.control-' + data_var.type + ' .autocomplete-loader').text('No suggestions found.').delay(1000).slideUp(500, function () {
                            $('.control-' + data_var.type + ' .autocomplete-loader').delay(10000).remove();
                        });
                    }
                    if (typeof (callback) == "function") {
                        //reserve for future use if any callbacks needed
                        callback(result);
                    }
                });
            }
            //
        });
        //
    }
}
