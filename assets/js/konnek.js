        var campaignId=$("#merchant-id").attr("campaign_id"),
            subs_keyword= $("#merchant-id").attr("sub_keyword"),
            campaign_Setup;
            var totalCart=0;

            if(typeof campaignId=="undefined"){
                campaign_Setup=campaignSetup;//from setup.js
            }else{
                campaign_Setup={"campaignId":parseInt(campaignId)};
            }


        // var konneckApiCall= KonnekApiInit();
        //     konneckApiCall.setup(campaign_Setup);
        // var konnekCart= KonnekCart(jQuery, konneckApiCall);
        //     konnekCart.prodSetup(setup);
            

        var konneckApiCall = KonnekApiInit();
            konneckApiCall.setup(setup_); 
        var konnekCart = KonnekCart(jQuery, konneckApiCall);
            konnekCart.prodSetup(setup);// merge kn setup and setup variable
        
        
        
        //compiled handlebars template
        //override function from konnek.cart.js
        function handleBars_compile(prodDisplayTemp,context){
                var template = $("#"+prodDisplayTemp).html();
                var theTemplate = Handlebars.compile(template);
                var theCompiledHtml = theTemplate(context);
                return theCompiledHtml;              
            
        }

               //this will get the coupon and add to cookie cartitem_dw once exists
               function getCoupons(data,keycode){
                console.log(data)
                if(typeof data !="undefined"){
                    if(data.hasOwnProperty("result")){
                        if(data.result.toLowerCase()=="success"){
                            var index = findWithValue(data.message.data[konneckApiCall.getCompaignId()].coupons, "campaignProductId", keycode); //keycode is the product_id
                            if(index==-1){
                                return false;
                            }
                            var target=data.message.data[konneckApiCall.getCompaignId()].coupons;
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
    

       

        //all cart events are here
        //override function from konnek.cart.js
        function cartEvents(){
                $(".cartItem .removeItem").unbind().on("click", function (e) {
                    e.preventDefault();
                    $.Topic("RemoveItem").publish($(this).attr('prodname'))               
                });
                
                //add to cart button event
                $(".productDisplay").unbind().on("click", ".addToCart", function () {
                    var parent = $(this).parents('.prod');
                    if ($(this).attr("keycode") == "") {
                        alert("Please select an option");
                        return false;
                    }   
                    var totalAmount = 0,qty=1, imgUrl,maxQty=1, shippingPrice=0;  
                    //for qty button +/-            
                    if(parent.find(".quantity").length!=0){
                        var parent_qty = parent.find(".items");      
                        var obj_qty=obj.multiple_straight_sale[parent_qty.attr("prodname")];
                        var current_obj = obj_qty[parent_qty.find(".quantity").val()];

                        qty=parseInt(parent.find(".quantity").val());              
                        totalAmount= parseFloat(current_obj.price) ;
                        keycode=current_obj.productId;
                        imgUrl=parent.find(".items").attr("imgUrl");             
                        shippingPrice=parseFloat(current_obj.shippingPrice);

                    }else{
                        totalAmount= parseFloat($(this).attr("price"));
                        keycode=$(this).attr("keycode");
                        imgUrl=$(this).attr("imgUrl");    
                        shippingPrice=parseFloat($(this).attr("shippingPrice"));               

                    }  
                
                    var data = {
                        prodPrice: totalAmount.toFixed(2),
                        prodName: $(this).attr("prodname"),
                        prodName_2: $(this).attr("prodname_2"),
                        keycode: keycode,                                        
                        pos: qty,
                        qty: qty,
                        desc:  $(this).attr("description"),
                        imgUrl: imgUrl,
                        maxQty: maxQty,
                        shippingPrice: shippingPrice,
                        alias: (($(this).attr("alias") == "") ? "" : $(this).attr("alias"))            
                    }

                    if($(this).attr("productsku")!="undefined" && $(this).attr("apikey")!="undefined"){
                        data.productSKU=$(this).attr("productsku");
                        data.apikey =   $(this).attr("apikey"); 
                    }

                    if(typeof getCoupons(konneckApiCall.getkonnecktiveSetup(), keycode)=="object"){                  
                        data.coupon=getCoupons(konneckApiCall.getkonnecktiveSetup(), keycode);
                    }else{
                        data.noCoupon=true;
                    } 

                    $('.addToCart').each(function(i, obj) {
                               $(this).html($(this).attr("text"))
                    });
                   
                    //$(this).text("added to cart");               
                    $.Topic("Addtocart").publish(data);
                    //$(this).addClass("subscribe");            
                    return false
                });

        }
        
        


        konnekCart.updateCart=function(data){
                        var date = new Date();
                        date.setTime(date.getTime() + 24 * 60 * 60 * 1000);
                        if (!!$.cookie('cartItem_dw')) {
                            var arr = JSON.parse($.cookie("cartItem_dw"));
                           
                            var count = 0;
                            var msg="Exceeds cart limit. Unable to add item to cart.";
                            for (var i in arr) {
                                if (arr[i].prodName_2 == data.prodName_2) {
                                    count++
                                }

                                if (arr[i].keycode == data.keycode) {
                                    count++
                                }
                            }
                            if (count == 0) {                           
                                arr.push(data)
                                $.cookie("cartItem_dw", JSON.stringify(arr),{expires: date});
                                var totalAfterUpdate = JSON.parse($.cookie("cartItem_dw"));
                         
                                //this will execute once cookie is not able to save the carted item
                                if(totalCart==Object.keys(totalAfterUpdate).length){
                                    alert(msg);
                                }
                                
                            } else {
                             
                                var index;
                                //if(typeof data.discounted !="undefined"){                     
                                //    index = findWithAttr(arr, "keycode", data.keycode);       
                                //}else{                        
                                index = findWithAttr(arr, "prodName_2", data.prodName_2);        
                                //} 


                                if(typeof data.prodPrice!="undefined")
                                    arr[index].prodPrice = data.prodPrice;

                                if(typeof data.productSKU!="undefined")
                                    arr[index].productSKU = data.productSKU;

                                if(typeof data.apikey!="undefined")
                                    arr[index].apikey = data.apikey;

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

                                if(typeof data.desc!="undefined")
                                    arr[index].desc = data.desc;

                                if(typeof data.prodName_2!="undefined")
                                    arr[index].prodName_2 = data.prodName_2;

                                
                                //delete if coupon exists
                                if(typeof data.coupon!="undefined") {  
                                    delete arr[index].noCoupon; 
                                }
                                if(typeof data.discounted!="undefined"){
                                    if(typeof arr[index].coupon!="undefined"){
                                        //add this to coupon
                                        arr[index].coupon.discounted = data.discounted;
                                        
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
                                               
                                }
                              
                                $.cookie("cartItem_dw", JSON.stringify(arr),{expires: date});     
                              
                            }
                            $(".cartCount").text(arr.length)

                            var totalAfterUpdate = JSON.parse($.cookie("cartItem_dw"));
                            //this will execute once cookie is not able to save the carted item
                            if(totalCart==Object.keys(totalAfterUpdate).length && index==-1){
                                alert(msg);
                            }
                    
                        } else {
                           
                            var arr = [data]
                            $.cookie("cartItem_dw", JSON.stringify(arr),{expires: date})
                            $(".cartCount").text(1)
                        }

                    
            }

            //list of cart items and set added cart even if reload
            //override function from konnek.cart.js
            konnekCart.itemOncart=function(){
     
                var total = 0;
                if (!!$.cookie('cartItem_dw')) {       
                            var arr = JSON.parse($.cookie("cartItem_dw"));
                            $(".cartCount").text(arr.length);
                            (arr.length > 0) ? $(".cartCount").show() : $(".cartCount").hide();

                            $(".cartItem").html("");
                            $(".addToCart").removeClass("subscribe");
                          
                  
                            for (var i in arr) { 
                                var selected=$(".productDisplay .addToCart[keycode='"+arr[i].keycode+"']");                                 
                                if(selected.length!=0){    
                                               
                                    selected.addClass("subscribe").text("added to cart");
                                }       
                                total++;              
                        
                            }

                           

                            $(".cartCount").text(arr.length);
                } else {
                        $(".cartCount").text(0)
                }
                if (total == 0) {
                        $(".cartItem").html("");
                        $(".cartItem").css("height", "auto");
                        $(".cartItem").html("No Item on cart")
                }

                totalCart=total;//store total carted item

            }

            //display list of products in shop and index page
            //override function from konnek.cart.js
            konnekCart.productListDisplay=function(data){
                var prods = [],context={};     
        
                for (var i in data.products) {
                    var out = data.products[i];  
                     prods[out.order]=out;                     
                }
                context.productLists = prods; 
            
                $(".productDisplay").append(handleBars_compile("productList-display",context));
                cartEvents();
                konnekCart.customCode(context);

            }   

            //override function from konnek.cart.js
            konnekCart.customCode=function(context){
                  console.log(context)
                   function populateDetails(month,detials){
                        $("div[data-index='"+month+"']").find(".price").html("$"+detials.price);
                        console.log(detials.price);
                        $("div[data-index='"+month+"']").find(".addToCart").attr("keycode",detials.campaignProductId);
                        $("div[data-index='"+month+"']").find(".addToCart").attr("price",detials.price);
                        $("div[data-index='"+month+"']").find(".addToCart").attr("shippingprice",detials.shippingPrice);
                        $("div[data-index='"+month+"']").find(".addToCart").attr("prodname",detials.productName);
                        $("div[data-index='"+month+"']").find(".addToCart").attr("prodname_2",detials.baseProductName.toLowerCase().split("-")[0].trim());
                        $("div[data-index='"+month+"']").find(".addToCart").attr("description",detials.prodDescription);
                        $("div[data-index='"+month+"']").find(".addToCart").attr("alias",detials.defaultLabel);
                        $("div[data-index='"+month+"']").find(".addToCart").attr("apiKey",detials.apiKey);
                        $("div[data-index='"+month+"']").find(".addToCart").attr("productSku",detials.productSku);
                        if(month==1){
                            $("div[data-index='"+month+"']").find(".addToCart").attr("text","Subscribe Now");
                        }else{
                            $("div[data-index='"+month+"']").find(".addToCart").attr("text","Subscribe and Save");
                        }
                   }

                   var item=context.productLists; 
                              
                   for(var i in item){                   
                     if(item[i].productName.toLowerCase().indexOf(subs_keyword)!=-1){
                            if(item[i].productName.indexOf("24")!=-1){                              
                                populateDetails(24,item[i]);
                            }else if(item[i].productName.indexOf("12")!=-1){
                                populateDetails(12,item[i]);
                            }else{
                                populateDetails(1,item[i]);
                            }
                     }
                   }
                   
                   cartEvents();

                   if(typeof merchant_detials == "function"){
                        merchant_detials();
                   }
              
            }


            //execute all override functions 
            //start here
            konnekCart.exec();