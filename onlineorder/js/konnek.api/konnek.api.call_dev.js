(function () {
    var konnek = function () {
        var obj = {},
            user_config = {},
            orderId_lead = "",
            konneckTiveSetup,
            psrm_keycode = "", //product sku
            psrm_afid = 2, //clientProductId
            shared_page_path = "/shared_pages/",
            shared_page = ""; // shared page like upsell1.html or thankyou.html
        obj.withAds = false; //set to true if there is an ads campaign of the site



        function isLocalApiStrict() {
            //
            // check if the page contains a meta element named 'localapi-strict' with content of 'true'
            // e.g. <meta name='localapi-strict' content='true' />
            //
            // this indicates that regardless of whether the site is on dev or live, regardless, it should
            // not do GET/POST requests to an external orders API. instead it should GET/POST to local '/onlineorder/v2'
            //
            var elems = document.getElementsByName('localapi-strict');
            if (!elems.length)
                return false;

            var meta = elems[0];
            return meta.content == 'true';
        }
        function loginId() {
            return "";
        }

        function pass() {
            return "";
        }

        function pass_cred(data) {
            // if (location.port != "") {
            //     data.loginId = config.loginId;
            //     data.password = config.password;
            // }
            return data;
        }

        obj.pass_cred_auth = function(data){
            return pass_cred(data);
        }

        function affiliate_id_defined(data) {
            if (config.affiliate_id != null) {
                data.affId = config.affiliate_id;
                data.sourceValue1 = config.affiliate_source1;
                data.sourceValue2 = config.affiliate_source2;
                data.sourceValue3 = config.affiliate_source3;
                data.sourceValue4 = config.affiliate_source4;
                data.sourceValue5 = config.affiliate_source5;
            } else if (getQueryStringByName('affId') != "") {
                data.affId = getQueryStringByName('affId');
                data.sourceValue1 = getQueryStringByName('c1');
                data.sourceValue2 = getQueryStringByName('c2');
                data.sourceValue3 = getQueryStringByName('c3');
                data.sourceValue4 = getQueryStringByName('c4');
                data.sourceValue5 = getQueryStringByName('c5');
            }
            if (getQueryStringByName('transaction_id') != "") {
                data.custom_transaction_id = getQueryStringByName('transaction_id');
                data.custom1 = getQueryStringByName('transaction_id');
            }
            return data;
        }

        obj.affiliate_id_defined_set= function(data){
            return affiliate_id_defined(data);
        }

        function getQueryStringValueByName(name, str) {
            name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
            var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
                results = regex.exec(str);
            return results == null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
        }

        function registerTransID_Paypal(data) {
            var paypalArray = [];
            paypalArray.push(JSON.parse(sessionStorage.getItem("paypalExpress")));
            var salesUrl = paypalArray[0].salesUrl;

            if (getQueryStringValueByName('affId', salesUrl) != "") {
                data.affId = getQueryStringValueByName('affId', salesUrl);
                data.sourceValue1 = getQueryStringValueByName('c1', salesUrl);
                data.sourceValue2 = getQueryStringValueByName('c2', salesUrl);
                data.sourceValue3 = getQueryStringValueByName('c3', salesUrl);
                data.sourceValue4 = getQueryStringValueByName('c4', salesUrl);
                data.sourceValue5 = getQueryStringValueByName('c5', salesUrl);
            }
            if (getQueryStringValueByName('transaction_id', salesUrl) != "") {
                data.custom_transaction_id = getQueryStringValueByName('transaction_id', salesUrl);
                data.custom1 = getQueryStringValueByName('transaction_id', salesUrl);
            }

            return data;

        }

        var config = {
            'loginId': loginId(),
            'password': pass(),
            'api_path': 'https://api.konnektive.com/',
            'campaignId': -1,
            'checkoutType': "one-page",//normal, one-page or compact
            'offerType': 'CART', // value: CART or NORMAL,
            'corp_type': '',

            'paypal_forceMerchantId': 0, //this will force target to merchant gateway and this will override paypal_sandbox_id and paypal_production_id once assigned
            'paypal_sandbox_id': 0, // paypal gateway sandbox id (in the konnektive gateway lists)
            'paypal_production_id': 0, // paypal gateway production id (in the konnektive gateway lists)

            'warranty_prod_id': 0, //set here prod id for warranty product

            'psmrToBoss': 1, //1 true , 0 false;
            'psmrBoss_key': "", // if psmrToBoss is 1 this is required to not ""
            'psmr_prod_id': 0, //set here prod id for psmr
            'psmr_status': 'opt-out',// either opt-out or opt-in (default: opt-out)

            'trial_pid': 0, // either prod id for trial
            'restrict_trial_cc': "amex,discover", // default not accepted on trial (amex, discover)

            'ss_id': 0, //straight sale option id for  prepaid id
            'ss_onSuccess': "upsell1", //default: upsell1.html -this will be the page after successful purchase using ss_id (no need to add .html)

            'pixel': '', //pixel that will fire in the upsell page
            'geoLookUp': false, //geo lookup IP
            'geoLookUp_delay': false,//set to execute the intlphone plugin
            'affiliate_id': null, //defined affId for konnektive
            'affiliate_source1': '',
            'affiliate_source2': '',
            'affiliate_source3': '',
            'affiliate_source4': '',
            'affiliate_source5': ''
        };

        //global function
        window.getQueryStringByName = function (name) {
            name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
            var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
                results = regex.exec(location.search);
            return results == null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
        }

        //find something and return found index in the array
        window.findWithAttr = function (array, attr, value) {
            for (var i = 0; i < array.length; i += 1) {
                if (array[i][attr] === value) {
                    return i;
                }
            }
            return -1;
        }

        window.extractDomain_ = function (url) {
            var domain;
            if (url.indexOf("://") > -1) {
                domain = url.split('/')[2];
            }
            else {
                domain = url.split('/')[0];
            }
            return $.trim(domain);
        }

        window.getCurrentOffer_ = function () {
            var currentOffer = window.location.href.substr(0, window.location.href.lastIndexOf('/')).toLowerCase().replace('/mobile', '');
            var pos = currentOffer.lastIndexOf('/');
            currentOffer = $.trim(currentOffer.substr(pos).replace("/", ""));
            if (currentOffer == extractDomain_(window.location.href)) {
                currentOffer = '';
            }
            return "/" + currentOffer;
        }

        var setConfig = function (_user_config) {
            /**
             * Make user configuration globally available
             */
            user_config = _user_config;
         

            //console.log("Leads Setting [CONFIG]: received_config_settings ", user_config);
            if (typeof user_config['shared_page'] === "string")
                shared_page = user_config['shared_page'];

            //pixel setup accept only object with property {'page': 'upsell', 'pixel_path': 'https://jumpto.track.com'}
            $.removeCookie("pixel_setup"); //remove the cookie first for pixel_setup

            if (typeof user_config['pixel_setup'] === "object" && Array.isArray(user_config['pixel_setup'])) {
                var pixel_setup = [];
                var date = new Date();
                date.setTime(date.getTime() + 24 * 60 * 60 * 1000);

                for (var i in user_config['pixel_setup']) {
                    if (user_config['pixel_setup'][i].hasOwnProperty('page') && user_config['pixel_setup'][i].hasOwnProperty('pixel_path')) {
                        user_config['pixel_setup'][i].page = user_config['pixel_setup'][i].page + ".html";//add .html here
                        pixel_setup.push(user_config['pixel_setup'][i]);
                    }
                }
                if (shared_page == "") {
                    $.cookie("pixel_setup", JSON.stringify(pixel_setup), { expires: date }); //push as cookie
                } else {
                    $.cookie("pixel_setup", JSON.stringify(pixel_setup), { path: shared_page_path, expires: date }); //push as cookie
                }

                config.pixel = "pix_setup"; // gituyo ni og comment kay ako na gicookie
            }

            // setup for corp_type
            if (typeof user_config['corp_type'] === "string")
               config.corp_type = user_config['corp_type'];

            if (typeof user_config['geoLookUp'] === "boolean")
                config.geoLookUp = user_config['geoLookUp'];

            if (typeof user_config['geoLookUp_delay'] === "boolean")
                config.geoLookUp_delay = user_config['geoLookUp_delay'];



            // if (typeof user_config['loginId'] === "string")
            //     config.loginId = user_config['loginId'];

            // if (typeof user_config['password'] === "string")
            //     config.password = user_config['password'];

            if (typeof user_config['api_path'] === "string")
                config.api_path = user_config['api_path'];

            if (config['api_path'] == "")
                console.log("Please setup api path");

            if (typeof user_config['campaignId'] === "number")
                config.campaignId = user_config['campaignId'];


            if (typeof user_config['offerType'] === "string") {
                if (user_config['offerType'].toUpperCase() == "NORMAL") {
                    config.offerType = user_config['offerType'].toUpperCase();
                }
            }

            if (getQueryStringByName("testmode") == 1) {
                if (typeof user_config['paypal_sandbox_id'] === "number") {
                    config.paypal_sandbox_id = user_config['paypal_sandbox_id'];
                }
                config.paypal_forceMerchantId = config.paypal_sandbox_id;

            } else {
                if (typeof user_config['paypal_production_id'] === "number") {
                    config.paypal_production_id = user_config['paypal_production_id'];
                }
                config.paypal_forceMerchantId = config.paypal_production_id;
            }

            //this will override paypal_sandbox_id and paypal_production_id once assigned
            if (typeof user_config['paypal_forceMerchantId'] === "number")
                config.paypal_forceMerchantId = user_config['paypal_forceMerchantId'];


            if (typeof user_config['warranty_prod_id'] === "number")
                config.warranty_prod_id = user_config['warranty_prod_id'];

            if (typeof user_config['psmr_prod_id'] === "number")
                config.psmr_prod_id = user_config['psmr_prod_id'];


            if (typeof user_config['psmrToBoss'] === "number") {
                if (user_config['psmrToBoss'] == 0) {
                    config.psmrToBoss = user_config['psmrToBoss'];
                }
            }

            if (typeof user_config['psmrBoss_key'] === "string") {
                config.psmrBoss_key = user_config['psmrBoss_key'];
            }

            $.removeCookie("pixel"); //remove cookie
            if (typeof user_config['pixel'] === "string") {
                var date = new Date();
                date.setTime(date.getTime() + 24 * 60 * 60 * 1000);
                if (shared_page == "") {
                    $.cookie("pixel", user_config['pixel'], { expires: date }); //push as cookie
                } else {
                    $.cookie("pixel", user_config['pixel'], { path: shared_page_path, expires: date }); //push as cookie
                }

                config.pixel = "pix"; // gituyo ni og comment kay ako na gicookie
            }


            if (typeof user_config['trial_pid'] === "number")
                config.trial_pid = user_config['trial_pid'];

            if (typeof user_config['restrict_trial_cc'] === "string")
                config.restrict_trial_cc = user_config['restrict_trial_cc'];

            if (typeof user_config['ss_id'] === "number")
                config.ss_id = user_config['ss_id'];

            if (typeof user_config['ss_onSuccess'] === "string")
                config.ss_onSuccess = user_config['ss_onSuccess'];


            //set psmr stat
            if (typeof user_config['psmr_status'] === "string") {
                switch (user_config['psmr_status'].toLowerCase()) {
                    case "opt-in":
                        config.psmr_status = user_config['psmr_status'].toLowerCase();
                        break;
                    default:
                        config.psmr_status = "opt-out";
                        break;
                }
            }

            //set checkoutType
            if (typeof user_config['checkoutType'] === "string") {
                switch (user_config['checkoutType'].toLowerCase()) {
                    case "normal":
                    case "compact":
                    case "one-page":
                        config.checkoutType = user_config['checkoutType'].toLowerCase();
                        break;
                }
            }

            //affId defined setup
            if (typeof user_config['affiliate_id'] === "number") {
                if (user_config['affiliate_id'] != 0 && user_config['affiliate_id'] != null) {
                    config.affiliate_id = user_config['affiliate_id'];
                }
            }

            //affid source value1 setup
            if (typeof user_config['affiliate_source1'] === "string") {
                config.affiliate_source1 = user_config['affiliate_source1'];
            }

            //affid source value2 setup
            if (typeof user_config['affiliate_source2'] === "string") {
                config.affiliate_source2 = user_config['affiliate_source2'];
            }

            //affid source value3 setup
            if (typeof user_config['affiliate_source3'] === "string") {
                config.affiliate_source3 = user_config['affiliate_source3'];
            }

            //affid source value4 setup
            if (typeof user_config['affiliate_source4'] === "string") {
                config.affiliate_source4 = user_config['affiliate_source4'];
            }

            //affid source value5 setup
            if (typeof user_config['affiliate_source5'] === "string") {
                config.affiliate_source5 = user_config['affiliate_source5'];
            }

        }

        obj.setWithAds = function (option) {
            if (typeof option == "boolean" && option == true) {
                obj.withAds = true;
            }

        }

        obj.getWithAds = function () {
            return obj.withAds;
        }

        obj.url_apiPath = function () {

            if (location.port == "") {
                return "/api/konnektive/v2/";
            } else {
                return "http://dev.apiorders.com/api/konnektive/v2/";
            }

        }

        //get get corp_type
        obj.get_corp_type = function () {
            return config.corp_type;
        }

        //get set corp_type
        obj.set_corp_type = function (corp_type) {
             config.corp_type = corp_type;
        }

        //set shared folder name  
        obj.set_shared_page_path = function (folder) {
            if (folder === "" || typeof folder === "undefined") return;
            shared_page_path = "/" + folder + "/";
        }

        //set paypal_forceMerchantId
        obj.set_paypal_forceMerchantId = function(billerId){
            config.paypal_forceMerchantId= billerId;
        }

        //get get_affiliate_id value page
        obj.get_affiliate_id = function () {
            return config.affiliate_id;
        }

        //get get_affiliate_source1 value page
        obj.get_affiliate_source1 = function () {
            return config.affiliate_source1;
        }

        //get get_affiliate_source2 value page
        obj.get_affiliate_source2 = function () {
            return config.affiliate_source2;
        }

        //get get_affiliate_source3 value page
        obj.get_affiliate_source3 = function () {
            return config.affiliate_source3;
        }

        //get get_affiliate_source4 value page
        obj.get_affiliate_source4 = function () {
            return config.affiliate_source4;
        }

        //get get_affiliate_source5 value page
        obj.get_affiliate_source5 = function () {
            return config.affiliate_source5;
        }


        //get geoLookUp value page
        obj.get_geoLookUp = function () {
            return config.geoLookUp;
        }

        //get geoLookUp_delay value page
        obj.get_geoLookUp_delay = function () {
            return config.geoLookUp_delay;
        }

        //get shared_page page
        obj.get_shared_page = function () {
            return shared_page;
        }

        //get shared_page path
        obj.get_shared_page_path = function () {
            var shared_folder = "/" + location.pathname.split("/")[1] + "/";

            if (shared_folder !== shared_page_path && (location.pathname.toLowerCase().indexOf("/shared_pages") != -1 || getQueryStringByName("fields_step") == "upsell" || getQueryStringByName("fields_step") == "thankyou")) {
                return shared_folder;
            }
            return shared_page_path;
        }


        // configure all parameters
        obj.setup = function (user_config) {
            setConfig(user_config);
            return obj;//object as whole
        }

        //get pixel path
        obj.get_pixel = function () {
            return config.pixel;
        }

        //get checkoutType
        obj.getCheckoutType = function () {
            return config.checkoutType;
        }

        //get api path
        obj.getApi_path = function () {
            return config.api_path;
        }

        //get campaignID
        obj.getCompaignId = function () {
            return config.campaignId;
        }

        //set campaignID
        obj.setCompaignId = function (val) {
            config.campaignId = val;
        }

        //get offerType: cart/normal
        obj.getOfferType = function () {
            return config.offerType;
        }

        //set konnecktiveSetup
        obj.setkonnecktiveSetup = function (data) {
            return konneckTiveSetup = data;
        }


        //get konnecktiveSetup
        obj.getkonnecktiveSetup = function () {
            return konneckTiveSetup;
        }

        //get paypal_forceMerchantId
        obj.get_paypal_forceMerchantId = function () {
            return config.paypal_forceMerchantId;
        }

        //get warranty_prod_id
        obj.get_warranty_prod_id = function () {
            return config.warranty_prod_id;
        }

        //get psmr_status
        obj.get_psmr_status = function () {
            return config.psmr_status;
        }

        //get psmrToBoss
        obj.get_psmrToBoss = function () {
            return config.psmrToBoss;
        }

        //get psmrBoss_key
        obj.get_psmrBoss_key = function () {
            return config.psmrBoss_key;
        }



        //get psmr_prod_id
        obj.get_psmr_prod_id = function () {
            return config.psmr_prod_id;
        }

        //get orderId
        obj.getOrderId = function () {
            return orderId_lead;
        }

        //get trial_pid
        obj.get_trial_pid = function () {
            return config.trial_pid;
        }

        //get restricted cc on trial prod
        obj.get_restrict_trial_cc = function () {
            return config.restrict_trial_cc;
        }

        //get straight sale id
        obj.get_ss_id = function () {
            return config.ss_id;
        }

        //get page redirection using straight sale id
        obj.get_ss_onSuccess = function () {
            return config.ss_onSuccess;
        }

        obj.get_psrm_keycode = function () {
            return psrm_keycode;
        }

        obj.getQueryStringByName = function (name) {
            name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
            var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
                results = regex.exec(location.search);
            return results == null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
        }

        obj.getIPCloudflare = function () {
            $.get('https://www.cloudflare.com/cdn-cgi/trace', function (data) {
                data = data.trim().split('\n').reduce(function (obj, pair) {
                    pair = pair.split('=');
                    return obj[pair[0]] = pair[1], obj;
                }, {});
                sessionStorage.setItem('local_ip', data.ip);
            }).always(function () {
                if (sessionStorage.getItem('local_ip') == null) {
                    sessionStorage.setItem('local_ip', '127.0.0.1');
                }
            });
        }

        obj.validateFields = function (el, ifFalse) {
            var defaultVal = (typeof ifFalse == "undefined" || ifFalse == null) ? "" : ifFalse;
            if (obj.getQueryStringByName(el.replace(".", "").replace("#", "")) != "") {
                //console.log(el.replace(".", "").replace("#", ""))
                return obj.getQueryStringByName(el.replace(".", "").replace("#", "")).trim();
            }
            return ($(el).val() == "undefined" || $(el).val() == null) ? defaultVal : $(el).val().trim();
        }

        obj.updateQueryStringParameter = function (uri, key, value) {
            var re = new RegExp("([?&])" + key + "=.*?(&|$)", "i");
            var separator = uri.indexOf('?') !== -1 ? "&" : "?";
            if (uri.match(re)) {
                return uri.replace(re, '$1' + key + "=" + value + '$2');
            }
            else {
                return uri + separator + key + "=" + value;
            }
        }

        obj.removeQuerystring = function (url, parameter) {
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

        obj.getResponse2 = function (url, params, callback) {
            var postQ = {
                type: "POST",
                url: url,
                dataType: 'json',
                async: true,
                data: JSON.stringify(params),
                headers: {
                    'Content-Type': 'application/json; charset=utf-8'
                }
            };
            var headerMsg = "BOSS API SAVING DATA ERROR: \n\n";

            $.ajax(postQ).done(function (data) {
                if (!data.isSuccess) {
                    if (data.hasOwnProperty('message')) {
                        alert(headerMsg + data.message);
                    } else {
                        alert(headerMsg + JSON.stringify(data.errors));
                    }
                }
            }).fail(function (jqXHR, textStatus, errorThrown) {
                if (errorThrown != '') {
                    alert(headerMsg + errorThrown);
                }
            }).always(function () {
                if (typeof callback == "function") {
                    console.log("exec callback");
                    callback.call(this);
                }
            });

        }



        /**********************************************
         * Post Request function and get Response
         **********************************************/
        obj.getResponse = function (url, params, callback) {
            var call_type = (typeof params.call_type != "undefined") ? params.call_type : "";
            var postQ = {
                type: "POST",
                url: url + "?call_type=" + call_type+"&corp_type="+ config.corp_type,
                dataType: 'json',
                async: true,
                data: params,
                contentTypeString: 'application/x-www-form-urlencoded'
            };

            $.ajax(postQ).done(function (data) {
                if (url.indexOf("campaign/query") != -1 || call_type == "campaign_query") {
                    if (data.result.toLowerCase() == "success") {
                        konneckTiveSetup = data;
                        var prod_lists = data.message.data[obj.getCompaignId()].products;
                        var campName = data.message.data[obj.getCompaignId()].campaignName;
                        var bNameDomain = (getQueryStringByName("billerNdomain") != "") ? getQueryStringByName("billerNdomain") : $("#website").val();

                        function codeSelectProdId(prod_lists, campName, bNameDomain) {
                            //auto select psmr product id
                            if (prod_lists[i].baseProductName.toLowerCase().indexOf("psmr") != -1 && prod_lists[i].productType == "OFFER"
                                && campName.toLowerCase().indexOf("/") == -1
                                && prod_lists[i].billerName.toLowerCase().indexOf(bNameDomain) != -1) {

                                config.psmr_prod_id = prod_lists[i].campaignProductId;
                            } else if (prod_lists[i].baseProductName.toLowerCase().indexOf("psmr") != -1
                                && prod_lists[i].productType == "OFFER") {

                                config.psmr_prod_id = prod_lists[i].campaignProductId;
                            }

                            //auto select warranty product id
                            if (prod_lists[i].baseProductName.toLowerCase().indexOf("warranty") != -1 && prod_lists[i].productType == "OFFER"
                                && campName.toLowerCase().indexOf("/") == -1
                                && prod_lists[i].billerName.toLowerCase().indexOf(bNameDomain) != -1) {

                                config.warranty_prod_id = prod_lists[i].campaignProductId;
                            } else if (prod_lists[i].baseProductName.toLowerCase().indexOf("warranty") != -1
                                && prod_lists[i].productType == "OFFER"
                                && campName.toLowerCase().indexOf("/") != -1) {

                                config.warranty_prod_id = prod_lists[i].campaignProductId;
                            }

                            //auto select straight sale product id
                            if (prod_lists[i].productName.toLowerCase().indexOf("ss") != -1
                                && prod_lists[i].productType == "OFFER"
                                && campName.toLowerCase().indexOf("/") == -1
                                && prod_lists[i].billerName.toLowerCase().indexOf(bNameDomain) != -1) {

                                config.ss_id = prod_lists[i].campaignProductId;
                            } else if (prod_lists[i].productName.toLowerCase().indexOf("ss") != -1
                                && prod_lists[i].productType == "OFFER"
                                && campName.toLowerCase().indexOf("/") != -1) {

                                config.ss_id = prod_lists[i].campaignProductId;
                            }

                            //auto select trial product id
                            if (prod_lists[i].productName.toLowerCase().indexOf("trial") != -1
                                && prod_lists[i].productType == "OFFER"
                                && campName.toLowerCase().indexOf("/") == -1
                                && prod_lists[i].billerName.toLowerCase().indexOf(bNameDomain) != -1) {

                                config.trial_pid = prod_lists[i].campaignProductId;
                            } else if (prod_lists[i].productName.toLowerCase().indexOf("trial") != -1
                                && prod_lists[i].productType == "OFFER"
                                && campName.toLowerCase().indexOf("/") != -1) {

                                config.trial_pid = prod_lists[i].campaignProductId;
                            }
                        }

                        if (getQueryStringByName("campaignId") == "" || getQueryStringByName("fields_step") == "second") {
                            
                            for (var i in prod_lists) {
                                if(prod_lists[i].billerName==null){
                                    codeSelectProdId(prod_lists, campName, bNameDomain);
                                }else{
                                    if (prod_lists[i].billerName.toLowerCase().indexOf("paypal") == -1) {
                                        codeSelectProdId(prod_lists, campName, bNameDomain);
                                    }
                                }
                            }

                            var index = findWithAttr(data.message.data[obj.getCompaignId()].products, 'campaignProductId', obj.get_psmr_prod_id());
                            if (index != -1) {
                                psrm_keycode = data.message.data[obj.getCompaignId()].products[index].productSku;
                                psrm_afid = data.message.data[obj.getCompaignId()].products[index].clientProductId;
                                obj.getIPCloudflare();//get Ip
                            }
                        }

                    }
                }

                if (url.indexOf("leads/import") != -1 || call_type == "leads_import") {
                    if (data.result.toLowerCase() == "success") {
                        orderId_lead = data.message.orderId;
                    }
                }

                if (typeof callback == "function") {
                    callback.call(this, data);
                }
            }).fail(function (jqXHR, textStatus, errorThrown) {
                if (errorThrown != '') {
                    alert("ERROR: " + errorThrown);
                } else {
                    console.log("Something went wrong. Auto-reloading the page.");
                    // location.reload(true);
                }
            }).always(function () {
                console.log("trial:" + config.trial_pid)
                console.log("ss:" + config.ss_id);
                console.log("psmr:" + psrm_keycode)
                // //console.log(psrm_keycode)
            });
        }




        /**********************************************
         * Import importClick Call to konnecktive api
         **********************************************/
        obj.importClick = function () {
            //get IP address
            // if(obj.get_psmr_prod_id()!=0){
            //     obj.getIPCloudflare();
            // }

            var url = obj.url_apiPath(),
                data = {
                    'call_type': 'landers_clicks_import'
                };
            data = pass_cred(data);//add credentials


            if (location.pathname.toLowerCase().indexOf("/thankyou.html") != -1) {
                data.pageType = "thankyouPage";
            } else if (location.pathname.toLowerCase().indexOf("/upsell") != -1 || getQueryStringByName("fields_step") == "upsell") {
                var upsell_no = getQueryStringByName("upsell_no");
                data.pageType = "upsellPage" + ((upsell_no == "") ? "1" : upsell_no);
            } else if ($("#fields_fname").length == 0 && $("#cc_number").length == 0) {
                data.pageType = "presellPage";
                // sessionStorage.removeItem("sessionId");
            } else if ($("#fields_fname").length != 0 && $("#cc_number").length == 0) {
                data.pageType = "leadPage";
                if (getQueryStringByName("fields_step") == "") {
                    sessionStorage.removeItem("sessionId");//remove it to renew session id
                }
                //sessionStorage.removeItem("sessionId");
            } else if ($("#cc_number").length != 0) {
                sessionStorage.removeItem("upsell_query");
                data.pageType = "checkoutPage";
                data.fraudPixel = 1;

                if (getQueryStringByName("fields_step") == "") {
                    sessionStorage.removeItem("sessionId");//remove it to renew session id
                }
            }


            if (sessionStorage.getItem("sessionId") != null && sessionStorage.getItem("sessionId") != "undefined") {
                var session_id = sessionStorage.getItem("sessionId");
                if (sessionStorage.getItem(session_id) == 1 && (data.pageType == "leadPage" || data.pageType == "checkoutPage" || data.pageType == "presellPage") && getQueryStringByName('paypalAccept') != '1') {
                    sessionStorage.removeItem("sessionId");//remove it to renew session id
                    sessionStorage.removeItem(session_id);//remove it to renew session id

                    data.campaignId = config.campaignId;
                    data.requestUri = encodeURIComponent(location.href);
                } else {
                    data.sessionId = session_id;
                }

            } else {
                data.campaignId = config.campaignId;
                data.requestUri = encodeURIComponent(location.href);
            }

            obj.getResponse(url, data, function (data) {
                if ((sessionStorage.getItem("sessionId") == null || sessionStorage.getItem("sessionId") == "undefined") && data.result.toLowerCase() == "success") {
                    sessionStorage.setItem("sessionId", data.message.sessionId);
                }

                //this will append kount iframe in the checkout page.
                if ($("#cc_number").length != 0 && data.message.hasOwnProperty('pixel')) {
                    var node = document.createElement("DIV");
                    node.style.display = "none";
                    node.innerHTML = data.message.pixel;
                    document.body.appendChild(node);
                }
            })

        }

        /**************************************
         * confirm Paypal Call to konnecktive api for paypal express
         *************************************/

        obj.confirmPaypal = function (obj_add, callback) {
            if (typeof obj_add != "object" || typeof obj_add == "undefined") {
                console.error("ImportOrderPaypalExpress Error function: pass {} to obj parameter if no property")
                return false;
            }
            var url = obj.url_apiPath();
            var data = {
                'call_type': 'transactions_confirmPaypal',
                'paypalAccept': getQueryStringByName("paypalAccept").trim(),
            };

            if (getQueryStringByName("PayerID") != "") {
                data.token = getQueryStringByName('token').trim();
                data.payerId = getQueryStringByName("PayerID").trim();
            } else if (getQueryStringByName("baToken") != "") {
                data.baToken = getQueryStringByName('ba_token').trim();
            }

            if (sessionStorage.getItem("sessionId") != null && sessionStorage.getItem("sessionId") != "undefined") {
                data.sessionId = sessionStorage.getItem("sessionId");
            }

            data = registerTransID_Paypal(data);

            //merge object being passed
            if (obj_add.length != 0) {
                for (var i in obj_add) {
                    for (var key in obj_add[i]) {
                        if (key == "call_type") { //this will not replace the declared call_type which transactions_confirmPaypal
                        } else {
                            data[key] = obj_add[i][key];
                        }
                    }
                }
            }

            obj.getResponse(url, data, callback);
        }


        /**************************************
        * importOrderPaypalExpress  Call to konnecktive api for paypal express
        *
        *************************************/

        obj.importOrderPaypalExpress = function (obj_add, callback) {
            if (typeof obj_add != "object" || typeof obj_add == "undefined") {
                console.error("ImportOrderPaypalExpress Error function: pass {} to obj parameter if no property")
                return false;
            }
            var url = obj.url_apiPath();
            var data = {
                'call_type': 'order_import',
                'campaignId': config.campaignId,
                //'orderId'       : orderId_lead,
                'sessionId': sessionStorage.getItem("sessionId"),
                'paySource': 'PAYPAL',
                'paypalBillerId': obj.get_paypal_forceMerchantId(),
                'salesUrl': location.href,
                'errorRedirectsTo': location.href,

            };
            data = pass_cred(data);//add credentials
            data = affiliate_id_defined(data); //affiliate check if defined
            // if(getQueryStringByName('affId')!=""){
            //     data.affId=getQueryStringByName('affId');
            //     data.sourceValue1=getQueryStringByName('c1');
            //     data.sourceValue2=getQueryStringByName('c2');
            //     data.sourceValue3=getQueryStringByName('c3');
            //     data.sourceValue4=getQueryStringByName('c4');
            //     data.sourceValue5=getQueryStringByName('c5');
            // }

            //merge object being passed
            if (obj_add.length != 0) {
                for (var i in obj_add) {

                    for (var key in obj_add[i]) {
                        data[key] = obj_add[i][key];
                    }
                }
            }

            sessionStorage.removeItem("paypalExpress");//remove first paypal express session

            //store data to session storage -use later for confirm paypal
            if (sessionStorage.getItem("paypalExpress") == null) {
                sessionStorage.setItem("paypalExpress", JSON.stringify(data));
                sessionStorage.setItem("redirection_paypal", location.href);
            }

            obj.getResponse(url, data, callback);
        }

        /**************************************
         * Import Lead Call to konnecktive api
         *************************************/
        obj.importLead = function (callback) {  //callback parameter can be function or value

            var url = obj.url_apiPath(),
                email_address = obj.validateFields("#fields_email"),
                phone_number = (typeof callback == "function" || typeof callback == "undefined") ? obj.validateFields("#fields_phone").replace(/ /g, "") : callback,
                fname = obj.validateFields("#fields_fname"),
                lname = obj.validateFields("#fields_lname"),
                address1 = obj.validateFields("#fields_address1"),
                address2 = obj.validateFields("#fields_address2"),
                city = obj.validateFields("#fields_city"),
                state = obj.validateFields("#fields_state"),
                zip_code = obj.validateFields("#fields_zip"),
                country = (obj.validateFields("#fields_country_select") == "") ? "US" : obj.validateFields("#fields_country_select");

            var data = {
                'call_type': 'leads_import',
                'campaignId': config.campaignId,
                //'ipAddress'     : "",
                'emailAddress': email_address,
                'phoneNumber': phone_number,
                //'disableCustomerDedup' : 1,
            };
            data = pass_cred(data);//add credentials


            if (sessionStorage.getItem("sessionId") != null && sessionStorage.getItem("sessionId") != "undefined") {
                data.sessionId = sessionStorage.getItem("sessionId");
            }

            if (getQueryStringByName('transaction_id') != "") {
                data.custom_transaction_id = getQueryStringByName('transaction_id');
                data.custom_aff_sub = getQueryStringByName('aff_sub');
                data.custom_aff_sub2 = getQueryStringByName('aff_sub2');
                data.custom_aff_sub3 = getQueryStringByName('aff_sub3');
            }

            data = affiliate_id_defined(data); //affiliate check if defined
            // if(getQueryStringByName('affId')!=""){
            //     data.affId=getQueryStringByName('affId');
            //     data.sourceValue1=getQueryStringByName('c1');
            //     data.sourceValue2=getQueryStringByName('c2');
            //     data.sourceValue3=getQueryStringByName('c3');
            //     data.sourceValue4=getQueryStringByName('c4');
            //     data.sourceValue5=getQueryStringByName('c5');
            // }


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
                data.firstName = $("#fields_fname_bill").val().trim();
                data.lastName = $("#fields_lname_bill").val().trim();
                data.address1 = $("#fields_address1_bill").val().trim();
                data.address2 = $("#fields_address2_bill").val().trim();
                data.country = country;
                data.city = $("#fields_city_bill").val().trim();
                data.state = $("#fields_state_bill").val().trim();
                data.postalCode = $("#fields_zip_bill").val().trim();
            } else {
                data.billShipSame = 1;
            }

            if ($("#fields_fname").length != 0 || $("#fields_lname").length != 0 || $("#fields_phone").length != 0 || $("#fields_email").length != 0) {
                if (typeof callback == "function") {
                    obj.getResponse(url, data, callback);
                } else {
                    obj.getResponse(url, data, function (data) {
                        console.log(data)
                    });
                }
            }
        }

        /**************************************
        * Import Order Call to konnecktive api
        * obj - incase you add additional props ex.{'redirectsTo':'index.html'} / just add {} REQUIRED
        * paySource- 'paypal' or 'creditcard' REQUIRED
        * productId- campaign product Id (found on campaign page) REQUIRED
        * callback function
        *************************************/
        obj.importOrder = function (obj_add, paySource, callback, iti_phoneNumber) {
            if (typeof obj_add != "object" || typeof obj_add == "undefined") {
                console.error("ImportOrder Error function: pass {} to obj parameter if no property")
                return false;
            } else if (typeof paySource != "undefined") {
                if (paySource.toLowerCase() != "creditcard") {
                    console.error("ImportOrder Error function: accepts only 'creditcard'")
                    return false;
                }
            }


            var url = obj.url_apiPath(),
                email_address = obj.validateFields("#fields_email"),
                phone_number = (iti_phoneNumber != "") ? iti_phoneNumber : obj.validateFields("#fields_phone"),

                fname = obj.validateFields("#fields_fname"),
                lname = obj.validateFields("#fields_lname"),
                address1 = obj.validateFields("#fields_address1"),
                address2 = obj.validateFields("#fields_address2"),
                city = obj.validateFields("#fields_city"),
                state = obj.validateFields("#fields_state"),
                zip_code = obj.validateFields("#fields_zip"),
                country = (obj.validateFields("#fields_country_select") == "") ? "US" : obj.validateFields("#fields_country_select");



            var data = {
                'call_type': 'order_import',
                'campaignId': config.campaignId,
                //'sessionId'     : sessionStorage.getItem("sessionId"),
                //'ipAddress'     : "",
                'emailAddress': email_address,
                'phoneNumber': phone_number,
                //'disableCustomerDedup' : 1,
            };
            data = pass_cred(data);//add credentials

            if (sessionStorage.getItem("sessionId") != null && sessionStorage.getItem("sessionId") != "undefined") {
                data.sessionId = sessionStorage.getItem("sessionId");
            }

            // if(getQueryStringByName('transaction_id')!=""){
            //     data.custom_transaction_id=getQueryStringByName('transaction_id')
            // }

            data = affiliate_id_defined(data); //affiliate check if defined
            // if(getQueryStringByName('affId')!=""){
            //     data.affId=getQueryStringByName('affId');
            //     data.sourceValue1=getQueryStringByName('c1');
            //     data.sourceValue2=getQueryStringByName('c2');
            //     data.sourceValue3=getQueryStringByName('c3');
            //     data.sourceValue4=getQueryStringByName('c4');
            //     data.sourceValue5=getQueryStringByName('c5');
            // }

            //merge object being passed

            if (obj_add.length != 0) {
                for (var i in obj_add) {

                    for (var key in obj_add[i]) {
                        data[key] = obj_add[i][key];
                    }
                }
            }


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
            }

            if (getQueryStringByName("orderId") != "") {
                data.orderId = getQueryStringByName("orderId");
            }

            switch (paySource.toLowerCase()) {
                default:
                    data.paySource = 'CREDITCARD';
                    data.cardNumber = $("#cc_number").val();
                    data.cardMonth = $("#fields_expmonth").val();
                    data.cardSecurityCode = $("#cc_cvv").val();
                    data.cardYear = $("#fields_expyear").val();
                    break;
            }

            obj.getResponse(url, data, callback);
        }

        /**************************************
        * Import Upsell Call to konnecktive api
        * obj - incase you add additional props ex.{'redirectsTo':'index.html'} / just add {} REQUIRED
        * productId- campaign product Id (found on campaign page) REQUIRED
        * callback function
        *************************************/
        obj.importUpsell = function (obj_add, productId, callback) {
            var url = obj.url_apiPath(),
                orderId = obj.validateFields("#orderId");

            if (typeof obj_add != "object" || typeof obj_add == "undefined") {
                console.error("importUpsell Error function: pass {} to obj parameter if no property")
                return false;
            } else if (typeof productId == "undefined") {
                console.error("importUpsell Error function: pass productId a value");
                return false;
            }

            var data = {
                'call_type': 'upsale_import',
                //'sessionId'     : sessionStorage.getItem("sessionId"),
                'productId': productId,
                'orderId': orderId,
            }
            data = pass_cred(data);//add credentials

            if (sessionStorage.getItem("sessionId") != null && sessionStorage.getItem("sessionId") != "undefined") {
                data.sessionId = sessionStorage.getItem("sessionId");
            }

            //merge object being passed
            if (obj_add.length != 0) {
                for (var i in obj_add) {

                    for (var key in obj_add[i]) {
                        data[key] = obj_add[i][key];
                    }
                }
            }
            //  console.log(data)

            obj.getResponse(url, data, callback)
        }

        /**************************************
       * Update shipping data to konnecktive api     
       * productId- campaign product Id (found on campaign page) REQUIRED
       * callback function
       *************************************/
        obj.updateCustomer = function (orderId, callback) {
            var url = obj.url_apiPath(),
                data = {},
                fname = $("#fields_fname").val().trim(),
                lname = $("#fields_lname").val().trim(),
                address1 = $("#fields_address1").val().trim(),
                city = $("#fields_city").val().trim(),
                state = $("#fields_state").val().trim(),
                zip_code = $("#fields_zip").val().trim(),
                country = ($("#fields_country_select") == "") ? "US" : $("#fields_country_select").val().trim();


            data.call_type = 'update_customer_shipping';
            data.orderId = orderId;
            data.shipFirstName = fname;
            data.shipLastName = lname;
            data.shipAddress1 = address1;
            data.shipCountry = country;
            data.shipCity = city;
            data.shipState = state;
            data.shipPostalCode = zip_code;

            data = pass_cred(data);//add credentials          
            obj.getResponse(url, data, callback)
        }

        /**************************************
         * Query Order Call to konnecktive api
         * obj - incase you add additional props ex.{'redirectsTo':'index.html'} / just add {} REQUIRED
         * callback function
         *************************************/

        obj.queryOrder = function (obj_add, callback) {
            var url = obj.url_apiPath(),
                orderId = obj.validateFields("#orderId");

            if (typeof obj_add != "object" || typeof obj_add == "undefined") {
                console.log("queryOrder Error function: pass {} to obj parameter if no property")
                return false;
            }

            var data = {
                'call_type': 'order_query',
                'orderId': orderId
            }
            data = pass_cred(data);//add credentials

            //merge object being passed
            if (obj_add.length != 0) {
                for (var i in obj_add) {
                    for (var key in obj_add[i]) {
                        data[key] = obj_add[i][key];
                    }
                }
            }

            obj.getResponse(url, Object.assign(obj_add, data), callback)
        }

        /**************************************
        * Confirm Order Call to konnecktive api
        *************************************/
        obj.confirmOrder = function (id) {
            var url = obj.url_apiPath(), orderId = "";
            if (typeof id != "undefined") {
                orderId = id;
            } else {
                orderId = obj.validateFields("#orderId");
            }


            var data = {
                'call_type': 'order_confirm',
                'orderId': orderId
            }
            data = pass_cred(data);//add credentials

            obj.getResponse(url, data, function (data) {
                //success
                if (data.result.toLowerCase() == "success") {
                    console.log("Sent confirmation auto responder emails to the customer.");
                } else {
                    alert(data.message);
                }
            })
        }

        /**************************************
        * Query Campaign Call to konnecktive api
        *************************************/
        obj.queryCampaign = function (callback) {
            var url = obj.url_apiPath();

            var data = {
                'call_type': 'campaign_query',
                'campaignId': config.campaignId
            }
            data = pass_cred(data);//add credentials

            obj.getResponse(url, data, callback)
        }

        /**************************************
       * Query Campaign Call to konnecktive api
       *************************************/
        obj.queryCampaign2 = function (callback) {
            var url = obj.url_apiPath();

            var data = {
                'call_type': 'campaign_query',
                'campaignId': config.campaignId
            }
            data = pass_cred(data);//add credentials

            return $.ajax({
                type: "POST",
                url: url + "?" + $.param(data)+"&corp_type="+config.corp_type,
                dataType: "json",
                data: data,
                contentTypeString: 'application/x-www-form-urlencoded',
                async: true
            });
        }

        /**************************************
        * Import Coupon  Call to konnecktive api for wholeOrder coupon
        *************************************/
        obj.orderCouponWholeOrder = function (couponCode, obj_add, callback) {
            var url = obj.url_apiPath();
            var data = {
                'call_type': 'order_coupon',
                'campaignId': config.campaignId,        
                'couponCode': couponCode
            }         
            //merge object being passed
            if (obj_add.length != 0) {
                for (var i in obj_add) {
                    for (var key in obj_add[i]) {
                        data[key] = obj_add[i][key];
                    }
                }
            }
           // console.log(data)
            obj.getResponse(url, data, callback);
        }


        /**************************************
        * Import Coupon  Call to konnecktive api
        *************************************/
        obj.orderCoupon = function (couponCode, product_id, callback, qty) {
            var url = obj.url_apiPath();

            var data = {
                'call_type': 'order_coupon',
                'campaignId': config.campaignId,
                'product1_id': product_id,
                'couponCode': couponCode
            }
            data = pass_cred(data);//add credentials

            if (typeof qty != "undefined") {
                data.product1_qty = qty;
            }

            obj.getResponse(url, data, callback)
        }

        /**************************************
         * Preauth   Call to konnecktive api
        *************************************/
        obj.Preauth = function (obj_add, callback) {
            if (typeof obj_add != "object" || typeof obj_add == "undefined") {
                console.error("Preauth Error function: pass {} to obj parameter if no property")
                return false;
            }

            var url = obj.url_apiPath();
            var data = {
                'call_type': 'order_preauth',
                'orderId': orderId_lead,
                'paySource': 'CREDITCARD',
                'cardNumber': $("#cc_number").val(),
                'cardExpiryDate': $("#fields_expmonth").val() + "/" + $("#fields_expyear").val(),
                'cardSecurityCode': $("#cc_cvv").val()
            }
            data = pass_cred(data);//add credentials

            //merge object being passed
            if (obj_add.length != 0) {
                for (var i in obj_add) {
                    for (var key in obj_add[i]) {
                        data[key] = obj_add[i][key];
                    }
                }
            }

            obj.getResponse(url, data, callback)
        }

        //set campaignId's default if campaignId passed as query string
        if (getQueryStringByName("corp_type") != "") {
            config.corp_type = getQueryStringByName("corp_type").trim();
        }


        //set campaignId's default if campaignId passed as query string
        if (getQueryStringByName("pixel") != "") {
            config.pixel = getQueryStringByName("pixel").trim();
        }

        //set campaignId's default if campaignId passed as query string
        if (getQueryStringByName("campaignId") != "") {
            config.campaignId = getQueryStringByName("campaignId").trim();
        }

        if (getQueryStringByName("checkoutType") != "") {
            config.checkoutType = getQueryStringByName("checkoutType").trim();
        }

        if (getQueryStringByName("offerType") != "") {
            config.offerType = getQueryStringByName("offerType").toUpperCase().trim();
        }

        if (getQueryStringByName("paypal_forceMerchantId") != "") {
            config.paypal_forceMerchantId = getQueryStringByName("paypal_forceMerchantId").trim();
        }

        if (getQueryStringByName("warranty_prod_id") != "") {
            config.warranty_prod_id = getQueryStringByName("warranty_prod_id").trim();
        }

        if (getQueryStringByName("psmr_prod_id") != "") {
            config.psmr_prod_id = getQueryStringByName("psmr_prod_id").trim();
        }

        if (getQueryStringByName("psmr_status") != "") {
            config.psmr_status = getQueryStringByName("psmr_status").trim();
        }

        if (getQueryStringByName("psmrToBoss") != "") {
            config.psmrToBoss = getQueryStringByName("psmrToBoss").trim();
        }

        if (getQueryStringByName('psmrBoss_key') != "") {
            config.psmrBoss_key = getQueryStringByName('psmrBoss_key').trim();
        }


        if (getQueryStringByName("r_trial_cc") != "") {
            config.restrict_trial_cc = getQueryStringByName("r_trial_cc").trim();
        }

        if (getQueryStringByName("psrm_keycode") != "") {
            psrm_keycode = getQueryStringByName("psrm_keycode").trim();
        }

        if (getQueryStringByName("trial_pid") != "") {
            config.trial_pid = getQueryStringByName("trial_pid").trim();
        }

        if (getQueryStringByName("ss_id") != "") {
            config.ss_id = getQueryStringByName("ss_id").trim();
        }

        if (getQueryStringByName("ss_onSuccess") != "") {
            config.ss_onSuccess = getQueryStringByName("ss_onSuccess").trim();
        }

        if (getQueryStringByName("shared_page") != "") {
            shared_page += getQueryStringByName("shared_page").trim();
        }

        if (getQueryStringByName("wAds") != "") {
            var val = getQueryStringByName("wAds").toLowerCase().trim();
            obj.withAds = (val === 'true')
        }

        if (getQueryStringByName("geoLookUp") != "") {
            var val = getQueryStringByName("geoLookUp").toLowerCase().trim();
            config.geoLookUp = (val === 'true')
        }
        //------------------------ defined aff_id for konnektive setter----------
        if (getQueryStringByName("d_aff_id") != "") {
            config.affiliate_id = getQueryStringByName("d_aff_id").trim();
        }

        if (getQueryStringByName("aff_s1") != "") {
            config.affiliate_source1 = getQueryStringByName("aff_s1").trim();
        }

        if (getQueryStringByName("aff_s2") != "") {
            config.affiliate_source2 = getQueryStringByName("aff_s2").trim();
        }

        if (getQueryStringByName("aff_s3") != "") {
            config.affiliate_source3 = getQueryStringByName("aff_s3").trim();
        }

        if (getQueryStringByName("aff_s4") != "") {
            config.affiliate_source4 = getQueryStringByName("aff_s4").trim();
        }

        if (getQueryStringByName("aff_s5") != "") {
            config.affiliate_source5 = getQueryStringByName("aff_s5").trim();
        }

        return obj;
    }

    var init = 'KonnekApiInit';
    /**
     * Make konnek object accessible globally
     */
    if (typeof window[init] !== 'function') {
        window[init] = konnek;
    }
})();
