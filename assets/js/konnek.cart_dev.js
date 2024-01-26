(function () {
    var kCart = function (jQuery, api_call) {
        var obj={};
        var topics = {};
        var response={};
        var api= api_call;
        var prodSetup=[]; // can be setup with prod
        var countCouponValidated=0;
        var coountCouponValidatedSuccess=0;
        obj.totalCart=0;
        var campaignProducts={};

        obj.campaignCoupons=[];
        obj.campaignCouponsError=[];
        obj.defaultProdId=-1;
        obj.defaultProdName="";
        obj.multiple_straight_sale={};     
        obj.quantityAssignPerProd=true;//set to true as quantity Assigned per prod in the setup
    
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

       
        function numberWithCommas(x) {
            return x.toString().replace(/\B(?!\.\d*)(?=(\d{3})+(?!\d))/g, ",");
        }

        function getQueryStringByName(name) {
            name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
            var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
                results = regex.exec(location.search);
            return results == null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
        }

        // functionality for one-time purchase & monthly subscription
        function dialog() {
            var text = "You already carted this item, would like to change it?";
            if (confirm(text) == true) {
                return true;
            } else {
                return false;
            }
        }
        //get all coupons in the campaing
        obj.listAllCoupon= function (data){        
            if(typeof data !="undefined"){
                if(data.hasOwnProperty("result")){
                    if(data.result.toLowerCase()=="success"){
                        var coupons = data.message.data[api.getCompaignId()].coupons; //keycode is the product_id
                        return coupons;
                    }else{
                        return [];
                    }                   
                } 
            }
            return [];
        }

        //this will get the coupon and add to cookie cartitem_dw once exists
        function getCoupons(data,keycode){
            console.log(data)
            if(typeof data !="undefined"){
                if(data.hasOwnProperty("result")){
                    if(data.result.toLowerCase()=="success"){
                        var index = findWithValue(data.message.data[api.getCompaignId()].coupons, "campaignProductId", keycode); //keycode is the product_id
                        if(index==-1){
                            return false;
                        }
                        var target=data.message.data[api.getCompaignId()].coupons;
                        return {"couponCode":target[index].couponCode,"campaignProductId":target[index].campaignProductId} ;
                    }else{
                        return false;
                    }                   
                }else{
                    return false;
                }               
            }
            return false;

        }
        function copyQueryURLevent(){
            $(document).on('click', "a", function (e) {
               
                if(typeof $(this).attr("target") != "undefined"){
                    return true;
                } else if($(this).attr("href").indexOf("product.html")!=-1){                    
                    return true;                
                } else if($(this).attr("href").indexOf("#")!=-1){                    
                    return true;
                } else if($(this).attr("href")==""){
                    return true;
                } else if(typeof $(this).attr("href")=="undefined"){
                    return true;
                } else if($(this).attr("href")=="/"){
                    e.preventDefault();
                    window.location.href = new_url("index.html");
                    return false;
             
                } else{
                    e.preventDefault();
                    var query=location.search;
                    query = removeQuerystring(query,"campaignId");         
                    if($(this).attr("href").indexOf("?")!=-1){        
                        query="&";                  
                    }else{
                        if(query=="" || query=="?"){                      
                            query="?"                                           
                        }else{
                            query+="&";
                        }  
                    }                 
                   
                  
                    window.location.href = new_url($(this).attr('href')+query+"campaignId="+api.getCompaignId());
                    return false;
                }
               
            });
        }
       
       
        //all cart events are here
        function cartEvents(){            
            $(document).ready(function(){
                if(typeof $.fn.lightSlider!="undefined"){               
                    $('#image-gallery').lightSlider({
                        gallery: true,
                        item: 1,
                        vertical: false,
                        verticalHeight: 100,
                        vThumbWidth: 50,
                        thumbItem: 3,
                        thumbMargin: 0,
                        slideMargin: 0                   
                    });
                }
                   
            });

            function purchaseQtyBtn_autoUpdate(lolo){
                if (lolo.find(".addToCart").hasClass("toCheckout")) {
                    lolo.find(".addToCart").html('<img src="assets/images/loading btn.svg" width="30" height="30" class="img-fluid inline-block" /> ');
                    setTimeout(function () {                             
                        lolo.find(".addToCart").removeClass("toCheckout");                              
                       // lolo.find(".item.active").removeClass("active");  
                        lolo.find(".addToCart").trigger("click");
                    }, 700);                    
                }else{
                    
                }
            }

            $(".details").unbind().click(function (e) {
                e.stopPropagation();
                $(".monthly-offerdetails").slideToggle("slow");
            });

            $(".r_addToCart").unbind().on("click",  function () {
                if ($(this).hasClass('added')) {
                    return true;
                }
                var totalAmount = 0,qty=1, imgUrl,maxQty=1, shippingPrice=0;                 
                    totalAmount= parseFloat($(this).attr("price"));
                    keycode=$(this).attr("keycode");
                    imgUrl=$(this).attr("imgUrl");    
                    shippingPrice=parseFloat($(this).attr("shippingPrice")); 
            
                var data = {
                    prodPrice: totalAmount.toFixed(2),
                    prodName: $(this).attr("prodname"),
                    keycode: keycode,
                    pos: qty,
                    qty: qty,
                    imgUrl: imgUrl,
                    maxQty: maxQty,
                    shippingPrice: shippingPrice,
                    alias: (($(this).attr("alias") == "") ? "" : $(this).attr("alias"))            
                }

                if(typeof getCoupons(api.getkonnecktiveSetup(), keycode)=="object"){                  
                    data.coupon=getCoupons(api.getkonnecktiveSetup(), keycode);
                }else{
                    data.noCoupon=true;
                }

                $.Topic("Addtocart").publish(data)
                $(this).addClass("added").text("Checkout Now").attr("href", new_url("checkout.html" + location.search)).prev().show();
            
                return false
            });

            $("#continue_shopping").unbind().on("click", function () {
                location.href = new_url("index.html" + location.search);
                return false;
            })
            
            $(".cartItem .removeItem").unbind().on("click", function (e) {
                e.preventDefault();
                $.Topic("RemoveItem").publish($(this).attr('prodname'))               
            });

              
            $('#fields_coupon').unbind().on('keypress', function (e) {
               
                e.stopPropagation();
                var code = e.keyCode || e.which;
                if (code == 13) {
                    e.preventDefault();
                    $('#btnCoupon').trigger('click');
                    return false;
                }
            });

            $('.fields_coupon').unbind().on('keypress', function (e) {
                var parent_container= $(this).parents(".coupon_wrapper");
                e.stopPropagation();
                var code = e.keyCode || e.which;
                if (code == 13) {
                    e.preventDefault();
                    parent_container.find('.btnCoupon').trigger('click');
                    return false;
                }
            });
          
            function validateCoupon(coupon,productIdWithCoupon,qty) {
                return new Promise((resolve, reject) => {
                    api.orderCoupon(coupon,productIdWithCoupon,function(data){                        
                        if(obj.req_response(data)){                       
                            var _data = {
                                keycode:productIdWithCoupon,
                                priceDiscount: data.message.priceDiscount, 
                                shipDiscount: data.message.shipDiscount,
                                discounted: true,  
                                couponCode:coupon,        
                            }   
                            if(data.message.priceDiscount==0 && data.message.shipDiscount==0) {
                                if(obj.campaignCouponsError.indexOf("Invalid Coupon")){
                                    obj.campaignCouponsError.push("Invalid Coupon");
                                } 
                                reject();   
                            }else {
                                coountCouponValidatedSuccess++;
                                resolve(_data); 
                            }            
                           
                        }else{
                            if(obj.campaignCouponsError.indexOf(data.message+"/n")){
                                obj.campaignCouponsError.push(data.message+"/n");
                            }  
                            reject();        
                        }
                        countCouponValidated++;
                    },qty);
                })
            }

            //multiple promo code container in the cart summary
            $(".btnCoupon").unbind().on("click", function (e) {
                e.stopPropagation();
                var parent_container= $(this).parents(".coupon_wrapper");
                $(this).html('<img src="assets/images/loading btn.svg" width="40" height="40" class="img-fluid inline-block" />');
                var coupon=parent_container.find(".fields_coupon").val().toLowerCase();
                if(coupon!=""){
                     if (!!$.cookie('cartItem_dw')) {  
                                        validateCoupon(coupon,$(this).attr("keycode"),$(this).attr("qty")).then(function(data){  
                                            if(data!=""){
                                                $.Topic("Updatecart").publish(data); 
                                                $("#btnCoupon").html("Apply"); 
                                            }  
                                        }).catch(function(){          
                                            //this will check if number of cart match to the coupon being validated                                 
                                            if(obj.campaignCouponsError.length!=0){
                                                alert(obj.campaignCouponsError.join().replace(/,/g," "));
                                                obj.campaignCouponsError=[];
                                                parent_container.find(".fields_coupon").val(""); 
                                                parent_container.find(".btnCoupon").html("Apply"); 
                                            }
                                        });                            
                              
                              
                     }else{
                         alert("Invalid Coupon Code");
                         $(this).text("Apply");
                     }
                } else{
                     alert("Please enter coupon code");
                     $(this).text("Apply");
                } 
             });


                
            //single cart container in cart summary
            $("#btnCoupon").unbind().on("click", function (e) {
                e.stopPropagation();
                $(this).html('<img src="assets/images/loading btn.svg" width="40" height="40" class="img-fluid inline-block" />');
                var coupon=$("#fields_coupon").val().toLowerCase();
                if(coupon!=""){
                     if (!!$.cookie('cartItem_dw')) {
                                var arr = JSON.parse($.cookie("cartItem_dw")); 
                                for(var i=0; i<arr.length; i++){ 
                                    //if(arr[i].hasOwnProperty('coupon')){  
                                        validateCoupon(coupon,arr[i].keycode,arr[i].qty).then(function(data){  
                                            if(data!=""){
                                                $.Topic("Updatecart").publish(data); 
                                                $("#btnCoupon").html("Apply Coupon"); 
                                            }  
                                        }).catch(function(){          
                                            //this will check if number of cart match to the coupon being validated                                 
                                            if(obj.campaignCouponsError.length!=0 && arr.length == countCouponValidated){
                                                if(coountCouponValidatedSuccess==0){
                                                    alert(obj.campaignCouponsError.join().replace(/,/g," "));
                                                }
                                                coountCouponValidatedSuccess=0;                                               
                                                obj.campaignCouponsError=[];
                                                countCouponValidated=0;
                                                $("#fields_coupon").val(""); 
                                                $("#btnCoupon").html("Apply Coupon"); 
                                            }
                                        });
                                   // }                                
                                }

                                if(arr.length==0){
                                    alert("Invalid Coupon Code");
                                    $(this).text("Apply Coupon");
                                }
                              
                     }else{
                         alert("Invalid Coupon Code");
                         $(this).text("Apply Coupon");
                     }
                } else{
                     alert("Please enter coupon code");
                     $(this).text("Apply Coupon");
                } 
             });

             $(".dropdown.quantity").unbind().on("change",function(){ 
                var parent = $(this).parents(".item");
                  
                var obj_qty=obj.multiple_straight_sale[parent.attr("prodname")];  
                if(typeof obj_qty=="undefined"){
                    obj_qty=obj.multiple_straight_sale[parent.attr("baseprodname")];
                }

                var index=$(this).val();
                var current_obj = obj_qty[index];
               
                if (typeof current_obj != "undefined") {  
                    var curPrice = (parseFloat(current_obj.price));
                    parent.find(".default-price span").html("$"+numberWithCommas(curPrice.toFixed(2)));
                    purchaseQtyBtn_autoUpdate($(this).parents('.prod'));        
                }
               
             })

             // button for minus qty
            $(".items .qty-input .btn-minus").unbind().on("click",function () {
                var $qty = $(this).closest('.qty-input').find('.quantity-hidden');
                var $qty_prod = $(this).closest('.qty-input').find('.quantity');
                var currentVal = parseInt($qty.val());
                var parent = $(this).parents(".items");
                var lolo=$(this).parents('.prod');
                //var prodname_orig = $(this).parents(".items").attr("prodname");   
                var obj_qty=obj.multiple_straight_sale[parent.attr("prodname")];  
                if(typeof obj_qty=="undefined"){
                    obj_qty=obj.multiple_straight_sale[parent.attr("baseprodname")];
                 }
                  

                if (!isNaN(currentVal) && currentVal > 0) {
                    if(obj.quantityAssignPerProd){
                        var index=Object.keys(obj_qty)[(currentVal-1)-1]
                        var current_obj = obj_qty[index];
                        // if (typeof parent.attr("minqty")!="undefined") {
                        //     if(pos==parent.attr("minqty")){
                        //         $qty_prod.val(0);
                        //         $(this).parents(".items").fadeOut();
                        //         $(this).parents(".items").next("hr").fadeOut();
                        //         setTimeout(function () {
                        //             $.Topic("RemoveItem").publish(prodname_orig)
                        //         },700)
                        //     }
                        // }
                        if (typeof current_obj != "undefined") {              
                            $qty.val(current_obj.qty);
                            $qty_prod.val(current_obj.qty); // shown textbox for qty
                            //var curPrice = (parseFloat(current_obj.price) + parseFloat(current_obj.shippingPrice));
                            var curPrice = (parseFloat(current_obj.price));
                            parent.find(".default-price span").html("$"+numberWithCommas(curPrice.toFixed(2)));
                            purchaseQtyBtn_autoUpdate(lolo);         
                        }
                    }else{
                        var pos = currentVal - 1;
                        if (pos != 0) {              
                            $qty.val(pos);
                            $qty_prod.val(pos); // shown textbox for qty
                            //var curPrice = (parseFloat(parent.attr('price'))* parseInt(pos)) + parseFloat(parent.attr("shippingprice"));
                            var curPrice = (parseFloat(parent.attr('price'))* parseInt(pos));
                            parent.find(".default-price span").html("$"+numberWithCommas(curPrice.toFixed(2)));
                            purchaseQtyBtn_autoUpdate(lolo);
                        }
                    }
                    
                }
            });

            // button for add qty
            $(".items .qty-input .btn-add").unbind().on("click", function () {
                var $qty = $(this).closest('.qty-input').find('.quantity-hidden');
                var $qty_prod = $(this).closest('.qty-input').find('.quantity');
                var currentVal = parseInt($qty.val());
                var parent = $(this).parents(".items");
                var lolo=$(this).parents('.prod');
                var obj_qty=obj.multiple_straight_sale[parent.attr("prodname")];
         
                 if(typeof obj_qty=="undefined"){
                    obj_qty=obj.multiple_straight_sale[parent.attr("baseprodname")];
                 }
               
                if (!isNaN(currentVal)) {
                    
                    if(obj.quantityAssignPerProd){
                        if (currentVal < parseInt(Object.keys(obj_qty).pop())) {
                            var index=Object.keys(obj_qty)[(currentVal-1)+1]
                            var current_obj = obj_qty[index];
                         
                            $qty.val(current_obj.qty);     
                            $qty_prod.val(current_obj.qty); // shown textbox for qty    
                            //var curPrice = (parseFloat(current_obj.price) + parseFloat(current_obj.shippingPrice));
                            var curPrice = (parseFloat(current_obj.price));
                            parent.find(".default-price span").html("$"+numberWithCommas(curPrice.toFixed(2))); 
                            purchaseQtyBtn_autoUpdate(lolo);                       
                        }
                    }else{
               
                        if (currentVal < parseInt(parent.attr("maxqty"))) {
                            var pos = currentVal + 1;
                     
                            $qty.val(pos);     
                            $qty_prod.val(pos); // shown textbox for qty    
                            //var curPrice = (parseFloat(parent.attr('price'))* parseInt(pos)) + parseFloat(parent.attr("shippingprice"));
                            var curPrice = (parseFloat(parent.attr('price'))* parseInt(pos));
                            parent.find(".default-price span").html("$"+numberWithCommas(curPrice.toFixed(2)));
                            purchaseQtyBtn_autoUpdate(lolo);                       
                        }
                    }
                   
                }
            });

            //event for selecting buy options
            $(".item").unbind().on('click', function (e) {
                e.stopPropagation();
                var parent = $(this).parents('.prod');
                var item = $(this);
            
                if (e.which && !$(this).hasClass("active")) {
                    if ($(this).parents(".prod").find(".addToCart").hasClass("toCheckout")) {
                        if (dialog() == false) {
                            return false;
                        } else {
                            parent.find(".addToCart").html('<img src="assets/images/loading btn.svg" width="30" height="30" class="img-fluid inline-block" /> ');
                            setTimeout(function () {                             
                                parent.find(".addToCart").removeClass("toCheckout");
                                parent.find(".addToCart").attr("keycode", item.attr("data-keycode"));
                                parent.find(".addToCart").attr("alias", item.attr("alias"));
                                parent.find(".addToCart").attr("price",item.attr('price'));                
                                parent.find(".addToCart").attr("shippingPrice", item.attr('shippingPrice'));
                                parent.find(".imgUrl").attr("imgUrl", item.attr("imgUrl"));
                                parent.find(".item.active").removeClass("active");
                                item.addClass('active');  
                                parent.find(".addToCart").trigger("click");
                            }, 700);
                            return false;
                        }
                    }
                }
                
                parent.find(".item.active").removeClass("active");          
                item.addClass('active');
                parent.find(".addToCart").attr("imgUrl",item.attr('imgUrl'));

                if ($(this).attr("data-hierarchy") == "1") {
                    parent.find(".addToCart").attr("keycode",item.attr("data-keycode"));//assign keycode to addTOcart button
                    parent.find(".addToCart").attr("alias", ((typeof item.attr('alias')=="undefined") ? "" : item.attr('alias')));
                    parent.find(".addToCart").attr("price",item.attr('price'));                
                    parent.find(".addToCart").attr("shippingPrice", item.attr('shippingPrice'));
                } else {                    
                    parent.find(".addToCart").attr("keycode", item.attr("data-keycode"));//assign keycode to addTOcart button
                    parent.find(".addToCart").attr("alias", ((typeof item.attr('alias')=="undefined") ? "" : item.attr('alias')));
                    parent.find(".addToCart").attr("price", item.attr('price'));
                    parent.find(".addToCart").attr("shippingPrice", item.attr('shippingPrice'));
                }

            });
            $(".item.active").trigger('click');

            //event for see details( offer details)
            $(".readMore").unbind().on("click", function (e) {
                e.stopPropagation();
                var parent = $(this).parents(".caption");
                $(".monthly-offerdetails").fadeOut();
                if (e.which) {
                    //$(".monthly-offerdetails").fadeOut("slow");
                    $(parent).next(".monthly-offerdetails").toggle(function () {
                        if ($(parent).next(".monthly-offerdetails").is(":visible")) {
                            parent.next(".monthly-offerdetails").addClass("open")
                        } else {
                            parent.next(".monthly-offerdetails").removeClass("open");
                        }
                    });

                }
            });
            //event that close monthly offer details
            $(".monthly-offerdetails").unbind().on("click", function (e) {
                e.stopPropagation();
                var parent = $(this).parents(".prod");
                $(".monthly-offerdetails").fadeOut();
            })

            //add to cart button event
            $(".productDisplay, .quick-view").unbind().on("click", ".addToCart", function () {
                var parent = $(this).parents('.prod'),
                    item_ = parent.find(".item.active").length,
                    el = $(this);
                    


                if ($(this).attr("keycode") == "") {
                    alert("Please select an option");
                    return false;
                }   
                var totalAmount = 0,qty=1, imgUrl,maxQty=1, shippingPrice=0;  

                function qtyButtons(parent){
                    var parent_qty = parent.find(".items");  
                   
                    if(obj.quantityAssignPerProd){                    
                        var obj_qty=obj.multiple_straight_sale[parent_qty.attr("prodname")]; 

                        if(typeof obj_qty=="undefined"){
                            obj_qty=obj.multiple_straight_sale[parent_qty.attr("baseprodname")];
                         }

                        var current_obj = obj_qty[parent_qty.find(".quantity").val()];    
                        qty=parseInt(parent.find(".quantity").val());              
                        totalAmount= parseFloat(current_obj.price) ;
                        keycode=current_obj.productId;
                        imgUrl=parent.find(".items").attr("imgUrl");             
                        shippingPrice=parseFloat(current_obj.shippingPrice);
                    }else{
                        qty=parseInt(parent.find(".quantity").val());              
                        totalAmount= (parseFloat(parent.find(".items").attr("price"))*qty);
                        keycode=parent.find(".items").attr("data-keycode");
                        imgUrl=parent.find(".items").attr("imgUrl");
                        maxQty=parent.find(".items").attr("maxqty");
                        shippingPrice=parent.find(".items").attr("shippingPrice");
                    }
                }

                function NonQtyButtons(el){
                    totalAmount= parseFloat(el.attr("price"));
                    keycode=el.attr("keycode");
                    imgUrl=el.attr("imgUrl");    
                    shippingPrice=parseFloat(el.attr("shippingPrice"));          
                }

                if(item_!=0){
                    //for qty button +/-            
                    if(parent.find(".quantity").length!=0 && parent.find(".item.active").attr("data-hierarchy")==1){
                        qtyButtons(parent);      
                    }else{                    
                        NonQtyButtons(el);
                    }  
                }else{
                     //for qty button +/-            
                    if(parent.find(".quantity").length!=0){
                        qtyButtons(parent);      
                    }else{
                        NonQtyButtons(el);
                    }  
                }
               
            
                var data = {
                    prodPrice: totalAmount.toFixed(2),
                    prodName: $(this).attr("prodname"),
                    keycode: keycode,
                    pos: qty,
                    qty: qty,
                    imgUrl: imgUrl,
                    maxQty: maxQty,
                    shippingPrice: shippingPrice,
                    alias: (($(this).attr("alias") == "") ? "" : $(this).attr("alias"))            
                }              

                if(typeof getCoupons(api.getkonnecktiveSetup(), keycode)=="object"){                  
                    data.coupon=getCoupons(api.getkonnecktiveSetup(), keycode);
                }else{
                    data.noCoupon=true;
                }

              
            
                if ($(this).hasClass("toCheckout")) {     
                    $.Topic("Addtocart").publish(data);
                    location.href = $(this).attr('redirect');
                    return false;
                }
            
               // $(this).text("Checkout Now");               
                $.Topic("Addtocart").publish(data);
               // $(this).addClass("toCheckout");            
                return false
            });

        }

        obj.callEvents=function(){
            cartEvents();
        }       

        obj.totalCarted=function(){
            return obj.totalCart;
        }

        //this function validate if request result is SUCCESS or ERROR
        obj.req_response=function(data){         
            if(data.result.toLowerCase()=="success"){
                return true;
            }else{
                return false;
            }

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

        //modified query string by specific name
        function removeQuerystring(url, parameter) {
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

        //compiled handlebars template
        function handleBars_compile(prodDisplayTemp,context){
            var template = $("#"+prodDisplayTemp).html();
            var theTemplate = Handlebars.compile(template);
            var theCompiledHtml = theTemplate(context);
            return theCompiledHtml;              
            
        }
        
        //generate new path url 
        function new_url(new_url_) {
            var new_url, offername=location.pathname.split("/")[1].replace(/-/g, "");
        
            if(new_url_.indexOf("/")==-1){
                offername="";
            }
            if (new_url_.indexOf("?") == -1) {
                new_url_ = new_url_ + offername + "?";
            }
            new_url = new_url_.split('?');
            var pars = new_url[1].split(/[&;]/g);
        
            var new_params = location.search;
            var new_params_split = new_params.split('?');
            if (new_params_split.length >= 2) {
                for (var i = pars.length; i-- > 0;) {
                    new_params = removeQuerystring(new_params, pars[i].split('=')[0]);
                    new_params = removeQuerystring(new_params,"fields_step");
                    new_params = removeQuerystring(new_params,"orderId");
                    new_params = removeQuerystring(new_params,"descriptor");              
                }

                if(location.pathname.toLowerCase().indexOf("thankyou.html")!=-1){
                    new_url[1] =  "";
                }
                             
                var append_newurl = (new_params == "?") ? new_url[1] : '&' + new_url[1];               
                return new_url[0] + new_params + ((new_url[1] == "") ? "" : append_newurl);
            } else {
             
                return new_url_ ;
            }
        }

        //this function will search property from object else it return -1
        function findWithValue(array, attr, value) {
            for (var i = 0; i < array.length; i += 1) {            
                if(array[i][attr] != null){
                    if (array[i][attr].indexOf(value)!=-1 ) {
                        return i;
                    }
                }               
            }
            return -1;
        }     


        //this function will search property from object else it return -1
        function findWithAttr(array, attr, value) {
            for (var i = 0; i < array.length; i += 1) {
                if (array[i][attr] === value) {
                    return i;
                }
            }
            return -1;
        }      

        //combined same base product name
        function combinedSameBaseProduct_monthly(response){   
           
   
            //this will add to related products to response
            for (var key in prodSetup) {
                var index = findWithAttr(response, "baseProductName", prodSetup[key]['prod']);
                if( (typeof response[index]=="undefined")){
                    index= findWithAttr(response, "productName", prodSetup[key]['prod']);
                }
                var res = response[index];
               
            
                if (typeof res != "undefined") {
                    if (typeof res.related == "undefined") {
                        res.related = [];
                    }
                    if (typeof res.defaultLabel == "undefined") {
                        res.defaultLabel = prodSetup[key]['defaultLabel'];//added default label to response
                    }

                    if (typeof res.selectionOption == "undefined") {
                        res.selectionOption = prodSetup[key]['selectionOption'];//added default label to response
                    }

                    if (typeof res.prodDescription == "undefined") {
                        res.prodDescription = prodSetup[key]['prodDescription'];//added product discriptions
                    }

                    if (typeof res.monthlyOfferDetails == "undefined") {
                        res.monthlyOfferDetails = prodSetup[key]['monthlyOfferDetails'];//added monthly offerdetails
                    }

                    if (typeof res.OfferDetails == "undefined") {
                        res.OfferDetails = prodSetup[key]['OfferDetails'];//added monthly offerdetails
                    }

                    if(typeof res.related!="undefined"){                    
                         res.related = prodSetup[key]['related'];//added related
                    }

                    if(typeof res.order=="undefined"){
                        res.order=prodSetup[key]['order']
                    }

                    if(typeof res.tags=="undefined"){
                        res.tags=prodSetup[key]['tags']
                    }

                    if(typeof res.apiKey=="undefined"){
                        res.apiKey=prodSetup[key]['apiKey']
                    }


                }        
            }

            //loop to add property monthly and straight sale to response 
            for (var i in response) {
                var out = response[i]; 
                var max_quantity =out.maxOrderQty;
                
                if(out.maxOrderQty==null || out.maxOrderQty==""){
                    max_quantity=1;
                }
                var prodNameSelect = out.productName.toLowerCase();                
                var price_=parseFloat(out.price)* parseInt(max_quantity);
                var shipping_price_=parseFloat(out.shippingPrice)* parseInt(max_quantity);

                // get straight sale product/ not monthly
                if (out.billingCycleType =="ONE_TIME") {                 
                    var ssIndex = findWithAttr(response, "baseProductName", out.baseProductName );
                    var ss_prop = response[ssIndex]; 
                    
                    var quantity_slice2 = prodNameSelect.slice(-2);//this will get the quantity thru product name ex: sleep x2
                    var quantity_slice1 = prodNameSelect.slice(-1);//this will get the quantity thru product name ex: sleep x2
                    var quantity=1;

                    if(!isNaN(quantity_slice2)){
                        quantity=quantity_slice2;
                    }else if(!isNaN(quantity_slice1)){
                        quantity=quantity_slice1;
                    } 

                    if (typeof ss_prop.straight_sale == "undefined") {
                        ss_prop.straight_sale = {};
                    }

                    if (typeof ss_prop.ss_productIds == "undefined") {
                        ss_prop.ss_productIds = [];
                    }

                    if (typeof ss_prop.straight_sale_per_prod == "undefined") {
                        ss_prop.straight_sale_per_prod = {};
                    }
                    
                    ss_prop.straight_sale[quantity]={};
                    ss_prop.straight_sale[quantity].productId = out.campaignProductId;
                    ss_prop.straight_sale[quantity].price = price_.toFixed(2);
                    ss_prop.straight_sale[quantity].shippingPrice = shipping_price_;
                    ss_prop.straight_sale[quantity].actual_price = parseFloat(out.price).toFixed(2);
                    ss_prop.straight_sale[quantity].actual_shippingPrice = parseFloat(out.shippingPrice).toFixed(2);
                    ss_prop.straight_sale[quantity].qty = max_quantity;
                    ss_prop.straight_sale[quantity].productDescription = out.productDescription;
                    ss_prop.straight_sale[quantity].productName = out.baseProductName;
                    ss_prop.straight_sale[quantity].name = out.productName;
                    ss_prop.straight_sale[quantity].alias="*"+out.defaultLabel;
                    ss_prop.straight_sale[quantity].label="One-Time Purchase";
                    ss_prop.ss_productIds[quantity] = out.campaignProductId;

                    ss_prop.straight_sale_per_prod[quantity]={};
                    ss_prop.straight_sale_per_prod[quantity].productId = out.campaignProductId;
                    ss_prop.straight_sale_per_prod[quantity].price = price_.toFixed(2);
                    ss_prop.straight_sale_per_prod[quantity].shippingPrice = shipping_price_;
                    ss_prop.straight_sale_per_prod[quantity].actual_price = parseFloat(out.price).toFixed(2);
                    ss_prop.straight_sale_per_prod[quantity].actual_shippingPrice = parseFloat(out.shippingPrice).toFixed(2);
                    ss_prop.straight_sale_per_prod[quantity].qty = max_quantity;
                    ss_prop.straight_sale_per_prod[quantity].productDescription = out.productDescription;
                    ss_prop.straight_sale_per_prod[quantity].productName = out.baseProductName;
                    ss_prop.straight_sale_per_prod[quantity].name = out.productName;
                    ss_prop.straight_sale_per_prod[quantity].alias="*"+out.defaultLabel;
                    ss_prop.straight_sale_per_prod[quantity].label="One-Time Purchase";
               
                }
               
                //get monthly subscription product
                if (out.billingCycleType =="RECURRING") { 
                    var addIndex = findWithAttr(response, "baseProductName", out.baseProductName );
                    var add_prop = response[addIndex];                   

                    if (typeof add_prop.monthly == "undefined") {
                        add_prop.monthly = {};
                    }
                    add_prop.monthly.productId = out.campaignProductId;
                    add_prop.monthly.price = price_.toFixed(2);
                    add_prop.monthly.shippingPrice = shipping_price_;
                    add_prop.monthly.productDescription = out.productDescription;
                    add_prop.monthly.productName=out.baseProductName;
                    add_prop.monthly.alias="*Subscription";
                    add_prop.monthly.label="Subscription";
       
                }
                
                if (out.productType.indexOf("OFFER") == -1) { 
                    delete response[i];// removed not to display (if productType is OFFER all offer prod will be displayed)
                }
            }
        }

        //get the rebill price from konnektive
         obj.monthly_offer_details= function(out) {
            
            var offerDetails = out.monthlyOfferDetails;
                if(typeof offerDetails!="undefined"){
                    offerDetails=offerDetails.split("{{shippingPrice}}").join("$"+parseFloat(out.monthly.shippingPrice).toFixed(2));
                    offerDetails=offerDetails.split("{{price}}").join("$"+parseFloat(out.monthly.price).toFixed(2));
                    offerDetails=offerDetails.split("{{rebill-price}}").join("$"+parseFloat(out.monthly.price).toFixed(2));
                    offerDetails=offerDetails.split("{{prodName}}").join(out.monthly.productName);
                    offerDetails=offerDetails.split("{{cycle1_price}}").join("$"+out.cycle1_price);
                    offerDetails=offerDetails.split("{{cycle1_shipPrice}}").join("$"+out.cycle1_shipPrice);
                    offerDetails=offerDetails.split("{{cycle2_price}}").join("$"+out.cycle2_price);
                    offerDetails=offerDetails.split("{{cycle2_shipPrice}}").join("$"+out.cycle2_shipPrice);

                    return offerDetails;
                }               
         
             
       
        }

        //handlebars js functions
        obj.initHandlebarsFuntions=function(){ 
            //use {{incremented @index}}
            Handlebars.registerHelper('incremented', function (index) {
                index++;
                return index;
            });

            Handlebars.registerHelper("xif", function (expression, options) {
                return Handlebars.helpers["x"].apply(this, [expression, options]) ? options.fn(this) : options.inverse(this);
            });

            Handlebars.registerHelper("len", function(json) {
                return Object.keys(json).length;
            });

            Handlebars.registerHelper("addDash", function(str) {
                return str.toLocaleLowerCase().split(' ').join('-').replace(/([†*%?^=!:${}()|\[\]\/\\])/g, '-');
            });

            Handlebars.registerHelper("toFixed", function(val) {
                return parseFloat(val).toFixed(2);
            });

            Handlebars.registerHelper("lowerCase", function(str) {
                return str.toLowerCase();
            });

            Handlebars.registerHelper("math", function(lvalue, operator, rvalue, options) {
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

            Handlebars.registerHelper("x", function(expression, options) {
                var result;
              
                // you can change the context, or merge it with options.data, options.hash
                var context = this;
              
                // yup, i use 'with' here to expose the context's properties as block variables
                // you don't need to do {{x 'this.age + 2'}}
                // but you can also do {{x 'age + 2'}}
                // HOWEVER including an UNINITIALIZED var in a expression will return undefined as the result.
                with(context) {
                  result = (function() {
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
        
        //display list of products in shop and index page
        obj.productListDisplay=function(data){
            var prods = [],context={};      
            //console.log(data.products)
            for (var i in data.products) {
                var out = data.products[i];     
                if (typeof out.straight_sale != "undefined") {
                   
                    var imgName = out.baseProductName.split(' ').join('-').replace(/([†*%?^=!:${}()|\[\]\/\\])/g, '-');
                    var imgName2 = out.productName.split(' ').join('-').replace(/([†*%?^=!:${}()|\[\]\/\\])/g, '-');
                    out.straight_sale_count=Object.keys(out.straight_sale).length;
                    for (var key in out ) { 
                        switch(key){                                                     
                            case 'campaignProductId':  
                                var query=location.search;
                                if(query!=""){                          
                                    query = removeQuerystring(query,"campaignId");                                 
                                    query="&"+query.substr(1);
                                }                             
                                out.redirectBaseProdName = new_url('product.html?campaignProductId='+out[key]+"&prodName=" + imgName.toLocaleLowerCase()+"&campaignId="+api.getCompaignId()); 
                                out.redirect = new_url('product.html?campaignProductId='+out[key]+"&prodName=" + imgName2.toLocaleLowerCase()+"&campaignId="+api.getCompaignId());      
                                out.checkout = new_url('checkout.html?campaignId='+api.getCompaignId()+query);
                                break;
                            case 'monthlyOfferDetails': 
                                if(typeof out.monthly!="undefined"){
                                    out.monthlyOfferDetails=  obj.monthly_offer_details(out);
                                }    
                             
                                break;
                        }              
                    } 
                    if(Object.keys(out.straight_sale).length>1){                   
                        obj.multiple_straight_sale[out.baseProductName]={};
                        obj.multiple_straight_sale[out.baseProductName]= out.straight_sale; 

                        out.ss_productIds.push("_qty_");  //gi add _qty_ timailhan nga sya with qty nga button                    
                        out.straight_sale_prodIds=out.ss_productIds.join(" ");

                        out.default_straightsale=out.straight_sale[Object.keys(out.straight_sale)[0]];
                        out.quantity_type =true;
                        prods[out.order]=out;
                    }else{
                        out.ss_productIds.push("_qty_"); //gi add _qty_ timailhan nga sya with qty nga button  
                        out.straight_sale_prodIds=out.ss_productIds.join(" ");  
                        out.default_straightsale=out.straight_sale[Object.keys(out.straight_sale)[0]];
                        out.straight_sale=out.straight_sale[Object.keys(out.straight_sale)[0]];
                                       
                        out.quantity_type =false;
                        prods[out.order]=out;
                    }
                   
                }else{
                        //for subscription products only
                        var imgName = out.baseProductName.split(' ').join('-').replace(/([†*%?^=!:${}()|\[\]\/\\])/g, '-');
                        var imgName2 = out.productName.split(' ').join('-').replace(/([†*%?^=!:${}()|\[\]\/\\])/g, '-');
                        for (var key in out ) { 
                        switch(key){                                                     
                            case 'campaignProductId':  
                                var query=location.search;
                                if(query!=""){                          
                                    query = removeQuerystring(query,"campaignId");                                 
                                    query="&"+query.substr(1);
                                }                             
                                out.redirectBaseProdName = new_url('product.html?campaignProductId='+out[key]+"&prodName=" + imgName.toLocaleLowerCase()+"&campaignId="+api.getCompaignId()); 
                                out.redirect = new_url('product.html?campaignProductId='+out[key]+"&prodName=" + imgName2.toLocaleLowerCase()+"&campaignId="+api.getCompaignId());      
                                out.checkout = new_url('checkout.html?campaignId='+api.getCompaignId()+query);
                                break;
                            case 'monthlyOfferDetails': 
                                if(typeof out.monthly!="undefined"){
                                    out.monthlyOfferDetails=  obj.monthly_offer_details(out);
                                }    
                             
                                break;
                        } 
                    }
                        
                        prods[out.order]=out;
            
                }
            }
           
           
        
            context.productLists = prods; 
            if(getQueryStringByName("category")!="")  {
                $(".productDisplay").html("");//remove productDisplay content
            }  
           
            $(".productDisplay").append(handleBars_compile("productList-display",context));
            $(".loader_").fadeOut().remove();
            $(".loadContent").fadeIn();

            cartEvents();
            console.log(context)
            obj.customCode(context);
        }   
        
        //list of cart items and set added cart even if reload
        obj.itemOncart=function(){
         
            var total = 0;
            if (!!$.cookie('cartItem_dw')) {       
                var arr = JSON.parse($.cookie("cartItem_dw"));
                $(".cartCount").text(arr.length);
                (arr.length > 0) ? $(".cartCount").show() : $(".cartCount").hide();

                $(".cartItem").html("");
                $(".added-cart,.added-continue").remove();
                for (var i in arr) {
                    if ($(".addToCart[prodname='" + arr[i].prodName + "'] .added-cart").length == 0) {
                        $("<p class='text-center mt-2 added-cart'>Added to Cart</p>").insertBefore(".addToCart[prodname='" + arr[i].prodName + "']");                        
                    }
                    $(".prod[data-prodname='" + arr[i].prodName + "'] .addToCart").addClass("toCheckout").text("Checkout Now");
                    var selectedProds=$(".prod[data-prodname='" + arr[i].prodName + "'] .items");
                    
                    //sa current update ni nga giadd ang qty button uban sa subscription
                    if(selectedProds.hasClass(arr[i].keycode) && selectedProds.hasClass("_qty_")){
                        $(".prod[data-prodname='" + arr[i].prodName + "'] .items."+arr[i].keycode+" .qty-input .quantity").val(arr[i].qty);
                        $(".prod[data-prodname='" + arr[i].prodName + "'] .items."+arr[i].keycode+" .qty-input .quantity-hidden").val(arr[i].qty);
                        $(".prod[data-prodname='" + arr[i].prodName + "'] .items."+arr[i].keycode+"  .default-price span").text("$"+numberWithCommas(parseFloat(arr[i].prodPrice).toFixed(2)));

                    //else if ni sa qty nga walay subscription
                    } else if(!selectedProds.hasClass("_qty_")){
                        $(".prod[data-prodname='" + arr[i].prodName + "'] .qty-input .quantity").val(arr[i].qty);
                        $(".prod[data-prodname='" + arr[i].prodName + "'] .qty-input .quantity-hidden").val(arr[i].qty);
                        $(".prod[data-prodname='" + arr[i].prodName + "'] .items .default-price span").text("$"+numberWithCommas(parseFloat(arr[i].prodPrice).toFixed(2)));
                    }  
                    
                    if ($(".item[data-keycode='" + arr[i].keycode + "']").length != 0) {
                        $(".item[data-keycode='" + arr[i].keycode + "']").trigger("click");
                    }
                    
                    if ($(".item[prodname='"+ arr[i].prodName+"'] .dropdown.quantity").length != 0) {
                        $(".item[prodname='"+ arr[i].prodName+"'] .dropdown.quantity option[value='"+arr[i].qty+"']").attr("selected","selected");
                    }

                    if ($(".r_addToCart[prodname='" + arr[i].prodName + "']").length != 0) {
                        if(typeof arr[i].alias!="undefined"){
                            $(".prod[prodname='" + arr[i].prodName + "']").find(".label").html(arr[i].alias.replace("*",""));
                        }
                      
                        $(".prod[prodname='" + arr[i].prodName + "']").find(".price").html("$" + arr[i].prodPrice);
                        $(".r_addToCart[prodname='" + arr[i].prodName + "']").addClass("added").text("Checkout Now").attr("href", new_url("checkout.html" + location.search)).prev().show();
                    }
                    total++;

                }
                
                $(".cartCount").text(arr.length);
              
            } else {
                $(".cartCount").text(0);
             
            }
            if (total == 0) {
                $(".cartItem").html("");
                $(".cartItem").css("height", "auto");
                $(".cartItem").html("No Item on cart")
            }
         
            obj.totalCart=total;//store total carted item
            
        }

       

        //update cart items in the cookie
        obj.updateCart=function(data){
            var date = new Date();
                date.setTime(date.getTime() + 24 * 60 * 60 * 1000);
           
            if (!!$.cookie('cartItem_dw')) {
                var arr = JSON.parse($.cookie("cartItem_dw"))
                var count = 0;
                var msg="Exceeds cart limit. Unable to add item to cart.";
                for (var i in arr) {
                    if (arr[i].prodName == data.prodName) {
                        count++
                    }else if (arr[i].keycode == data.keycode) {
                        count++
                    }
                }
                if (count == 0) {
                    arr.push(data)
                    $.cookie("cartItem_dw", JSON.stringify(arr),{expires: date});

                    var totalAfterUpdate = JSON.parse($.cookie("cartItem_dw"));
                    //this will execute once cookie is not able to save the carted item
                    if( obj.totalCart==Object.keys(totalAfterUpdate).length){
                        alert(msg);
                    }
                } else {
             
                    var index;
                    if(typeof data.discounted !="undefined"){                     
                        index = findWithAttr(arr, "keycode", data.keycode);       
                    }else{                        
                        index = findWithAttr(arr, "prodName", data.prodName);        
                    } 

                    if(typeof data.prodPrice!="undefined")
                         arr[index].prodPrice = data.prodPrice;

                    if(typeof data.prodName!="undefined")
                         arr[index].prodName = data.prodName;

                    if(typeof data.qty!="undefined")
                         arr[index].qty = data.qty;

                    if(typeof data.keycode!="undefined")
                         arr[index].keycode = data.keycode;

                    if(typeof data.pos!="undefined")
                        arr[index].pos = data.pos;   
                    
                    if(typeof data.imgUrl!="undefined")
                         arr[index].imgUrl= data.imgUrl;

                    if(typeof data.maxQty!="undefined")
                         arr[index].maxQty= data.maxQty;

                    if(typeof data.shippingPrice!="undefined")
                        arr[index].shippingPrice= data.shippingPrice;
                    
                    if(typeof data.alias!="undefined")
                        arr[index].alias = data.alias;

                    if(typeof data.coupon!="undefined")
                        arr[index].coupon = data.coupon;

                    
                    //delete if coupon exists
                    if(typeof data.coupon!="undefined") {  
                        delete arr[index].noCoupon; 
                    }
                    if(typeof data.discounted!="undefined"){
                        if(typeof arr[index].coupon!="undefined"){
                             //add this to coupon
                            arr[index].coupon.discounted = data.discounted;

                            //add this to coupon
                            if(typeof data.couponCode!="undefined")
                                arr[index].coupon.couponCode = data.couponCode;
                            
                            //add this to coupon
                            if(typeof data.priceDiscount!="undefined")
                                arr[index].coupon.priceDiscount = data.priceDiscount;
                            
                            //add this to coupon
                            if(typeof data.shipDiscount!="undefined")
                                arr[index].coupon.shipDiscount = data.shipDiscount;   
                            
                         }
                       
                    }

                    if(typeof data.noCoupon!="undefined"){
                        delete arr[index].coupon; 
                        // if(typeof data.priceDiscount!="undefined"){ 
                        //     delete arr[index].coupon.priceDiscount;
                        //     delete arr[index].coupon.shipDiscount; 
                        //     delete arr[index].coupon.discounted; 
                        // }                  
                    }
                    $.cookie("cartItem_dw", JSON.stringify(arr),{expires: date}); 
                    var totalAfterUpdate = JSON.parse($.cookie("cartItem_dw"));
                    //this will execute once cookie is not able to save the carted item
                    if( obj.totalCart==Object.keys(totalAfterUpdate).length && index==-1){
                        alert(msg);
                    }
                    
                }
                $(".cartCount").text(arr.length)
        
            } else {
                var arr = [data]
                $.cookie("cartItem_dw", JSON.stringify(arr),{expires: date})
                $(".cartCount").text(1)
            }

          
        }

 
        //this function is use to add related product or selection option like dropdown or checkbox
        obj.prodSetup=function(obj_){      
            var hitErrorOrder= 0;  
            if(getQueryStringByName("category")!="")  {
                prodSetup=[];//empty prodSetup every prodSetup function call;     
            } 

            if (typeof obj_ === "object"){
                for (var i in obj_) {
                    var obj_structure={};
                    if(!obj_[i].hasOwnProperty("order")){
                        console.error("Error at index "+i+" "+JSON. stringify(obj_[i])+" : order property is required to this setup")
                        hitErrorOrder++;
                    }else if(obj_[i].hasOwnProperty("prod")){
                        for (var key in obj_[i] ) {              
                            switch(key){
                                case "order":
                                    obj_structure[key]=obj_[i][key];
                                    break;
                                case "tags":
                                    obj_structure[key]=obj_[i][key];
                                    break;
                                case "prod":
                                    obj_structure[key]=obj_[i][key];
                                    break;
                                case "related":
                                    obj_structure[key]=obj_[i][key];
                                    break;
                                case "selectionOption":
                                    obj_structure[key]=obj_[i][key];
                                    break;
                                case "defaultLabel":
                                    obj_structure[key]=obj_[i][key];
                                    break;
                                case "prodDescription":
                                        obj_structure[key]=obj_[i][key];
                                    break;
                                case "monthlyOfferDetails":
                                        obj_structure[key]=obj_[i][key];
                                    break;
                                case "OfferDetails":
                                        obj_structure[key]=obj_[i][key];
                                    break;
                                case "apiKey":
                                        obj_structure[key]=obj_[i][key];
                                    break;
                               
                            }
                         }
                        prodSetup.push(obj_structure);
                        
                    } else{
                        console.error("Error at index "+i+" "+JSON. stringify(obj_[i])+" : prod property is required to this setup")
                    } 
                }
                if(hitErrorOrder!=0){
                    prodSetup=[];
                }
                return obj;
            } 
        }
        //get product info directly using this function just pass productname and quanityAssignPerProd(Default is true) - true kun ang setup prod x1 , prod x2 
        obj.getProductDetails=function(prodName, qtyButtonType){
            var product={};
            if(typeof qtyButtonType=="boolean"){
                obj.quantityAssignPerProd=qtyButtonType;
            }
            for (var key in campaignProducts) {
                if (campaignProducts[key].productName===prodName) {
                   product= campaignProducts[key]
                }
            }

            return product;//return search product
        }
        
        //callback function for campaign query
        obj.loadCampaign=function(data){          
            if(obj.req_response(data)){
                response=data.message.data[api.getCompaignId()].products;
                response=combinedSameBaseProduct_monthly(response);//get monthly and combine  
                campaignProducts = data.message.data[api.getCompaignId()].products;
               
                $.Topic("FirstPageLoaded").publish(data.message.data[api.getCompaignId()]);
            }else{
                alert("ERROR: "+data.message+".")
            }  
        } 

        //remove cart items in the cookie thru prod name
        obj.removeItemFromcart=function(prodname){
            var date = new Date();
            date.setTime(date.getTime() + 24 * 60 * 60 * 1000);
            var arr = JSON.parse($.cookie("cartItem_dw"))
            for (var i in arr) {
                if (arr[i].prodName == prodname) {
                    arr.splice(i, 1)
                }
            }
            obj.totalCart=arr.length;
            $.cookie("cartItem_dw", JSON.stringify(arr),{expires: date})

        }

        obj.listCartProducts=function(data){
            if(obj.req_response(data)){
                response=data.message.data[api.getCompaignId()].products;
                response=combinedSameBaseProduct_monthly(response);//get monthly and combine 
                var res=data.message.data[api.getCompaignId()].products;      
                         
                obj.cartItemsCheckout(res); 
            }else{
                alert("ERROR: "+data.message);
           
            }
        }

   
        //added this function to display carted product even not in checkout page (like shop, landing page and etc.)
        obj.cartListDisplay=function(){
            var one_time_items = [];// unset items one time
            var subscription_items=[];
            var coupons=[];//list of coupons
            var context={}, shipping=0, total=0, discountedPrice=0;
            var res=response;

                if (!!$.cookie('cartItem_dw')) {
                    var arr = JSON.parse($.cookie("cartItem_dw"));
                    $(".cartItem").html("");
                    for (var i in arr) {
                        if (typeof arr[i].alias != "undefined") {
                            if (arr[i].alias != "" && arr[i].alias.toLowerCase().indexOf("subscription") != -1) {
                                if(typeof arr[i].coupon != "undefined"){
                                    coupons.push(arr[i].coupon);
                                    if(arr[i].coupon.hasOwnProperty("discounted")){
                                        var productDiscount=0;
                                        productDiscount+=parseFloat(arr[i].coupon.priceDiscount);
                                        productDiscount+=parseFloat(arr[i].coupon.shipDiscount);
                                        arr[i].productDiscount=productDiscount.toFixed(2);
                                        discountedPrice+=productDiscount;
                                    }
                                }  
                                
                                
                                var index = findWithAttr(res, "productName", arr[i].prodName);                                                         
                                if(index!=-1 && res[index].hasOwnProperty('monthlyOfferDetails')){      
                                    arr[i].monthlyOfferDetails=obj.monthly_offer_details(res[index]);
                                }
                               
                                subscription_items.push(arr[i])
                            } else {                               
                                if(typeof arr[i].coupon != "undefined"){
                                    coupons.push(arr[i].coupon);
                                    if(arr[i].coupon.hasOwnProperty("discounted")){
                                        var productDiscount=0;
                                        productDiscount+=parseFloat(arr[i].coupon.priceDiscount);
                                        productDiscount+=parseFloat(arr[i].coupon.shipDiscount);
                                        arr[i].productDiscount=productDiscount.toFixed(2);
                                        discountedPrice+=productDiscount;
                                    }
                                }  
                                one_time_items.push(arr[i]);                          
                            }
                        }else{
                            if(typeof arr[i].coupon != "undefined"){
                                coupons.push(arr[i].coupon);
                                if(arr[i].coupon.hasOwnProperty("discounted")){
                                    var productDiscount=0;
                                    productDiscount+=parseFloat(arr[i].coupon.priceDiscount);
                                    productDiscount+=parseFloat(arr[i].coupon.shipDiscount);
                                    arr[i].productDiscount=productDiscount.toFixed(2);
                                    discountedPrice+=productDiscount;
                                }
                            }  
                            one_time_items.push(arr[i]);
                        }                      

                        shipping+=parseFloat(arr[i].shippingPrice);
                        total+=parseFloat(arr[i].prodPrice)
                    }

                    context.one_time = one_time_items;  
                    context.subscriptions = subscription_items; 
                    context.shipping_total=shipping.toFixed(2);
                    context.totalPrice=(total-parseFloat(discountedPrice)).toFixed(2);            
                    context.coupon=obj.listAllCoupon(api.getkonnecktiveSetup()).length;
       
                    if(discountedPrice!=0){
                        context.discountedPrice=parseFloat(discountedPrice).toFixed(2);
                    }else{
                        context.discountedPrice=0;
                    }  
                }
        
                if (subscription_items.length == 0 && one_time_items.length==0) {
                    $(".cartItem").html("")
                    $(".cartItem").html("No Item on cart");     
                    $(".totalcart-container").hide();         
                } else {
                    $(".totalCartAmount").html(context.totalPrice);
                    $(".totalcart-container").show();   
                    $(".cartItem").append(handleBars_compile("cartList-display",context));            
                }
                cartEvents();

        }

        

        //list cart items in the checkout page
        obj.cartItemsCheckout = function(data){
            var one_time_items = [];// unset items one time
            var subscription_items=[];
            var coupons=[];//list of coupons
            var context={}, shipping=0, total=0, discountedPrice=0;
            var res=data;

                if (!!$.cookie('cartItem_dw')) {
                    var arr = JSON.parse($.cookie("cartItem_dw"));
                    $(".cartItem").html("");
                    for (var i in arr) {
                        if (typeof arr[i].alias != "undefined") {
                            if (arr[i].alias != "" && arr[i].alias.toLowerCase().indexOf("subscription") != -1) {
                                if(typeof arr[i].coupon != "undefined"){
                                    coupons.push(arr[i].coupon);
                                    if(arr[i].coupon.hasOwnProperty("discounted")){
                                        var productDiscount=0;
                                        productDiscount+=parseFloat(arr[i].coupon.priceDiscount);
                                        productDiscount+=parseFloat(arr[i].coupon.shipDiscount);
                                        arr[i].productDiscount=productDiscount.toFixed(2);
                                        discountedPrice+=productDiscount;
                                    }
                                }  
                                
                                
                                var index = findWithAttr(res, "productName", arr[i].prodName);                                                         
                                if(index!=-1 && res[index].hasOwnProperty('monthlyOfferDetails')){      
                                    arr[i].monthlyOfferDetails=obj.monthly_offer_details(res[index]);
                                }
                               
                                subscription_items.push(arr[i])
                            } else {                               
                                if(typeof arr[i].coupon != "undefined"){
                                    coupons.push(arr[i].coupon);
                                    if(arr[i].coupon.hasOwnProperty("discounted")){
                                        var productDiscount=0;
                                        productDiscount+=parseFloat(arr[i].coupon.priceDiscount);
                                        productDiscount+=parseFloat(arr[i].coupon.shipDiscount);
                                        arr[i].productDiscount=productDiscount.toFixed(2);
                                        discountedPrice+=productDiscount;
                                    }
                                }  
                                one_time_items.push(arr[i]);                          
                            }
                        }else{
                            if(typeof arr[i].coupon != "undefined"){
                                coupons.push(arr[i].coupon);
                                if(arr[i].coupon.hasOwnProperty("discounted")){
                                    var productDiscount=0;
                                    productDiscount+=parseFloat(arr[i].coupon.priceDiscount);
                                    productDiscount+=parseFloat(arr[i].coupon.shipDiscount);
                                    arr[i].productDiscount=productDiscount.toFixed(2);
                                    discountedPrice+=productDiscount;
                                }
                            }  
                            one_time_items.push(arr[i]);
                        }                      

                        shipping+=parseFloat(arr[i].shippingPrice);
                        total+=parseFloat(arr[i].prodPrice)
                    }

                    context.one_time = one_time_items;  
                    context.subscriptions = subscription_items;                    
                    context.shipping_total=shipping.toFixed(2);
                                   
                    context.totalPrice=((total+shipping)-parseFloat(discountedPrice)).toFixed(2);            
                    context.coupon=obj.listAllCoupon(api.getkonnecktiveSetup()).length;
       
                    if(discountedPrice!=0){
                        context.discountedPrice=parseFloat(discountedPrice).toFixed(2);
                    }else{
                        context.discountedPrice=0;
                    }                   
                
                  
                }
        
                if (subscription_items.length == 0 && one_time_items.length==0) {
                    $(".cartItem").html("")
                    $(".cartItem").html("No Item on cart");
                    $("#billed").hide();
                } else {
                    $(".cartItem").append(handleBars_compile("cartList-display",context));
                    $("#billed").show();
                }

                $("#productOption-container, #pay_source").remove();//remove if exists
              
                if ($('#pay_source').length == 0 && (getQueryStringByName("fields_step")=="" || getQueryStringByName("fields_step")=="second")) {
                      $('body').prepend('<input type="hidden" id="pay_source" name="pay_source" value="creditcard"/>');
                } 
                      

                cartEvents();

                obj.customCode(context);//custom code;
            
        }

        //add custom code here
        obj.customCode=function(context){

        }

        obj.specificProd_gallery=function(){
            var context={};
            context.gallery={"image":getQueryStringByName("prodName")};
            $(".prod-gallery").append(handleBars_compile("ProductGallery",context));
        }

        obj.specificProd_Option =function(data){          
            var prods = [],context={}, prodDescription="",productSKU, prodName="", baseProdName=""; 
            for (var i in data) {
                var out = data[i];                

                var baseName=out.baseProductName.split(' ').join('-').replace(/([†*%?^=!:${}()|\[\]\/\\])/g, '-'),
                    pName=out.productName.split(' ').join('-').replace(/([†*%?^=!:${}()|\[\]\/\\])/g, '-')

                 
                if(typeof out.monthly!="undefined"){
                    out.monthlyOfferDetails= obj.monthly_offer_details(out);  
                }

                if(typeof out.straight_sale!="undefined"){
                    obj.multiple_straight_sale[out.baseProductName]={};
                    obj.multiple_straight_sale[out.baseProductName]= out.straight_sale; 
                }

                if(out.campaignProductId==obj.defaultProdId){
                    prodDescription=out.prodDescription;  
                    productSKU=out.productSku;    
                    baseProdName=out.baseProductName; 
                    prodName=out.productName; 

                    var query=location.search;
                    query = updateQueryStringParameter(query,"campaignId", api.getCompaignId());
                    out.checkout=new_url('checkout.html'+query);
                    out.default_straightsale=out.straight_sale[Object.keys(out.straight_sale)[0]];
                    out.straight_sale=out.straight_sale[Object.keys(out.straight_sale)[0]];

                    out.ss_productIds.push("_qty_");  //gi add _qty_ timailhan nga sya with qty nga button                    
                    out.straight_sale_prodIds=out.ss_productIds.join(" ");
                    
                    prods.push(out);
                }else if (out.campaignProductId==getQueryStringByName("campaignProductId")) { 
                    prodDescription=out.prodDescription;  
                    productSKU=out.productSku;    
                    baseProdName=out.baseProductName; 
                    prodName=out.productName; 

                    var query=location.search;
                    query = updateQueryStringParameter(query,"campaignId", api.getCompaignId());
                    out.checkout=new_url('checkout.html'+query);

                    if(typeof out.straight_sale !="undefined" ){
                          out.default_straightsale=out.straight_sale[Object.keys(out.straight_sale)[0]];
                          out.straight_sale=out.straight_sale[Object.keys(out.straight_sale)[0]];
                          out.ss_productIds.push("_qty_");  //gi add _qty_ timailhan nga sya with qty nga button                    
                          out.straight_sale_prodIds=out.ss_productIds.join(" ");
                    }

                   
            
                    prods.push(out);
                }
            }
            context.chooseOption = prods; 
            console.log(context)
            $(".prodQuantity").append(handleBars_compile("product-choice",context));
            // cartEvents();
            if(prods.length==0){
                $("#notFoundContainer").html("").removeClass("row");
                $("#description,.loadContent").html("");               
                $("#notFoundContainer").append(handleBars_compile("not-found",context));               
            }else{
                $(".base-prod-name,.base-product-name").html(baseProdName)
                $(".prod-name,.product-name").html(prodName)
                $(".sku").html(productSKU);
                $("body").append("<div class='tempdiv' id='tempdiv' style='display:none'>" +prodDescription + "</div")
                $("#product-description,.product-description").html($(".ProductDescription").html()); //product description
                $("#information, .information").html($(".ProductInformation").html()) //
                $("#shippingreturn, .shippingreturn").html($(".ShippingReturn").html()) //
                $(".short-desc").html($(".ProductDescriptionExcerpt").html());
              
                if(typeof $(".ProductInformation").html()=="undefined"){
                    $(".nav-information").hide();
                    $("#header2, .nav-information-mobile").hide();
                }
                $("#tempdiv").remove();

                if($("#ProductGallery").length!=0){
                    obj.specificProd_gallery();
                }
                if($("#related_Prods").length!=0){
                    obj.relatedProds(data);
                }
            }
          
        }

        //list related prod
        obj.relatedProds = function(res){ 
                    var prods = [],context={};  
                    var res= res.filter (function (x){return x});
                    for (var i in res ) { 
                        if(res[i].hasOwnProperty('related') && res[i].campaignProductId==getQueryStringByName("campaignProductId")){
                            var related=res[i].related;
                            for(var key in related){
                                var index = findWithAttr(res, "baseProductName", related[key]); 
                                if( (typeof res[index]=="undefined")){
                                    index= findWithAttr(res, "productName",  related[key]);
                                }
                                var item = res[index];
                                if (index!=-1){
                                    for (var o in item ) { 
                                        var imgName = item.baseProductName.split(' ').join('-').replace(/([†*%?^=!:${}()|\[\]\/\\])/g, '-');
                                        var imgName2 = item.productName.split(' ').join('-').replace(/([†*%?^=!:${}()|\[\]\/\\])/g, '-');
                                        switch(o){                                                     
                                            case 'campaignProductId':
                                                item.redirect = new_url('product.html?campaignProductId='+ item[o]+"&prodName=" + imgName.toLocaleLowerCase()+"&campaignId="+api.getCompaignId());   
                                                item.redirectProdName = new_url('product.html?campaignProductId='+ item[o]+"&prodName=" + imgName2.toLocaleLowerCase()+"&campaignId="+api.getCompaignId());   
                                                break;    
                                                
                                            case 'straight_sale':
                                                if(typeof item.straight_sale[Object.keys(item.straight_sale)[0]] == "object"){
                                                    item.straight_sale=item.straight_sale[Object.keys(item.straight_sale)[0]];
                                                }
                                                break;
                                        } 
                                    } 
                                    prods.push(item)
                                }
                            
                            }
                        }      
                    } 
                    context.relatedProds = prods;  
               
                    $(".relatedProdDisplay").attr("style","");
                    $(".relatedProdDisplay").append(handleBars_compile("related_Prods",context));
        }

        obj.specific_prod=function(data){
            if(obj.req_response(data)){
                response=data.message.data[api.getCompaignId()].products;
                response=combinedSameBaseProduct_monthly(response);//get monthly and combine 
                var res=data.message.data[api.getCompaignId()].products;          
              
                obj.specificProd_Option(res); 
                cartEvents();
                obj.customCode(); //custom code
                $("#continue").attr("href", new_url("index.html")); //update continue link                    
                $(".loadContent,.showcase, .related-product").fadeIn();  
                $.Topic("CartItems").publish(data);
             
            }else{
                alert("ERROR: "+data.message);
           
            }
        }

        
        obj.pageSelection=function(){
    
            if(obj.defaultProdId!=-1){
  
                api.importClick();   
                api.importLead();
                api.queryCampaign(obj.specific_prod); 
                return false;
            }
       
            switch(location.pathname.split(".html")[0].split("/").slice(-1).toString().toLowerCase()){ 
                case "product":
                 
                    api.importClick();   
                    //api.importLead();
                    api.queryCampaign(obj.specific_prod); 
                    break;
                case "payment":             
                case "checkout":
                        // if(getQueryStringByName("campaignId")=="" && getQueryStringByName("token")==""){
                        //     window.location.href="index.html";
                        // }
                    
                        api.importClick();   
                        //api.importLead();        
                        api.queryCampaign(obj.listCartProducts);         
            
                        
                    break;              
                default:
                        api.importClick(); 
                        //api.importLead(); 
                        api.queryCampaign(obj.loadCampaign);
                        
                    break;

            }
        }

       

        //this will set default prod for product page as landing page
        obj.setDefaultProd=function(prod_default){
         
            if(typeof prod_default=="object"){
                if (typeof prod_default['Default_prodId'] === "number")
                    obj.defaultProdId = prod_default['Default_prodId'];
            
                if (typeof prod_default['Default_prodName'] === "string")
                    obj.defaultProdName = prod_default['Default_prodName'].split(' ').join('-').replace(/([†*%?^=!:${}()|\[\]\/\\])/g, '-').toLowerCase();
            }
           
            return obj;
        }

        //execution start here upon call the function 
        obj.exec=function(){          
        
            $.Topic("FirstPageLoaded")
            $.Topic("Addtocart")
            $.Topic("RemoveItem")
           
            $.Topic("FirstPageLoaded").subscribe(obj.productListDisplay)
            $.Topic("FirstPageLoaded").subscribe(obj.itemOncart)          
   

            $.Topic("CartItems").subscribe(obj.itemOncart)

            $.Topic("Addtocart").subscribe(obj.updateCart)
            $.Topic("Addtocart").subscribe(obj.itemOncart)

            $.Topic("Updatecart").subscribe(obj.updateCart)
            $.Topic("Updatecart").subscribe(obj.cartItemsCheckout);  

            $.Topic("RemoveItem").subscribe(obj.removeItemFromcart)
            $.Topic("RemoveItem").subscribe(obj.cartItemsCheckout);    

            if(typeof Handlebars !="undefined"){
                obj.initHandlebarsFuntions();
            }else{
                alert("Error: This page is powered by handlebarsjs please add it.")
                return false;
            }
            if(typeof api =="undefined"){
                alert("Error: Please pass object variable from KonnekApiInit() function.");
                return false;
            }else{
                
                obj.pageSelection();
            }
        }

        copyQueryURLevent();//exec when object called
        return obj;
    }

    var init = 'KonnekCart';
    /**
     * Make konnek object accessible globally
     */
    if (typeof window[init] !== 'function') {
        window[init] = kCart;
    }
})();






