 //validate if success or error
 function req_response(data){    
                     
    if(data.result.toLowerCase()=="success"){
        return true;
    }else{
        form_obj.hideProgress();               
        return false;
    }

}

function isNullOrEmpty(output){
    return (output=="" || output=="null" || output==null )? "" : output;
}

//compiled handlebars template
function handleBars_compile(prodDisplayTemp,context){
    var template = $("#"+prodDisplayTemp).html();
    var theTemplate = Handlebars.compile(template);
    var theCompiledHtml = theTemplate(context);
    return theCompiledHtml;              
        
}


var konneckApiCall= KonnekApiInit();
        var konnekCart= KonnekCart(jQuery, konneckApiCall);

        var konnekForm=KonnekForm(konneckApiCall);

        konnekForm.thankyouPage=function(data){
          
            if(req_response(data)){
                           
        
                var info=data.message.data[0];
                var descriptor_individual=decodeURIComponent(getQueryStringByName("desc_individual")).split(",");
           
                $(".cs-billing-name").html(isNullOrEmpty(info.firstName) + " " + isNullOrEmpty(info.lastName));
                $(".cs-shipping-name").html(isNullOrEmpty(info.shipFirstName) + " " + isNullOrEmpty(info.shipLastName));
                $(".email, .cs-email").html(isNullOrEmpty(info.emailAddress));
                $(".phone-number, .phone").html(isNullOrEmpty(info.phoneNumber));
                $(".currencySymbol").html(info.currencySymbol);
                $(".currencyCode").html(info.currencyCode);
                $(".descriptor").html(getQueryStringByName("descriptor"));
                $(".order-number").html(getQueryStringByName("orderId"))
                $(".totalAmount").html(info.totalAmount)

                var options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
                var today  = new Date(info.dateCreated);
                $(".order-date").html(today.toLocaleDateString("en-US", options))
              

                if (isNullOrEmpty(info.address1) != "") {
                    $(".shipping-address").text(isNullOrEmpty(info.address1)  + ", " + isNullOrEmpty(info.city) + ", " + isNullOrEmpty(info.state) + ", " +isNullOrEmpty(info.postalCode)+", "+isNullOrEmpty(info.country))
                } else {
                    $(".shipping-address").text(isNullOrEmpty(info.address2)  + ", " + isNullOrEmpty(info.city) + ", " + isNullOrEmpty(info.state) + ", " +isNullOrEmpty(info.postalCode)+", "+isNullOrEmpty(info.country))
                }

                if (isNullOrEmpty(info.shipAddress1) != "") {
                    $(".billing-address").text(isNullOrEmpty(info.shipAddress1)  + ", " + isNullOrEmpty(info.shipCity)  + ", " + isNullOrEmpty(info.shipState) + ", " +
                    isNullOrEmpty(info.shipPostalCode) + ", " + isNullOrEmpty(info.shipCountry))
                } else {
                    $(".billing-address").text(isNullOrEmpty(info.shipAddress2)  + ", " + isNullOrEmpty(info.shipCity)  + ", " + isNullOrEmpty(info.shipState) + ", " +
                    isNullOrEmpty(info.shipPostalCode) + ", " + isNullOrEmpty(info.shipCountry))
                }

                var context={},prods=[];

                if(konneckApiCall.getOfferType()=="CART"){
                    if ($.cookie("ty_data") != null){                                        
                        var arr = JSON.parse($.cookie("ty_data"));
                        for (var i in arr) {
                            if(typeof arr[i].coupon != "undefined"){                               
                                if(arr[i].coupon.hasOwnProperty("discounted")){
                                    var productDiscount=0;
                                    productDiscount+=parseFloat(arr[i].coupon.priceDiscount);
                                    productDiscount+=parseFloat(arr[i].coupon.shipDiscount);
                                    arr[i].productDiscount=productDiscount.toFixed(2); 
                                }
                            } 
                            if(typeof arr[i].alias!="undefined"){
                                if(arr[i].alias.toLowerCase().indexOf("subscription")!=-1){
                                    arr[i].subscription=true;
                                }else{
                                    arr[i].subscription=false;
                                }
                            }else{
                                arr[i].subscription=false; 
                            }
                            arr[i].currencySymbol=info.currencySymbol; 
                            prods.push(arr[i]);
                        }   
                    }                    
                }else{
                   // console.log(info.items)
                    for (var i in info.items) {
                        for(var key in info.items[i]){
                            if(key=="name"){
                                info.items[i].filename= info.items[i][key].toLowerCase().split(' ').join('-').replace(/([†*%?^=!:${}()|\[\]\/\\])/g, '-'); 
                            }
                            info.items[i].currencySymbol=info.currencySymbol; 
                        }
                        prods.push(info.items[i]);
                    }   
                } 
        
                context.ty_data = prods; 
                ty_data = prods;

                if($.cookie("confirmSent")!=info.orderId && getQueryStringByName("psmrOnly")==""){
                    konneckApiCall.confirmOrder();                    
                }
                $.cookie("confirmSent",info.orderId);
                if(typeof Handlebars !="undefined"){                   
                    $(".ty-summary ").html(handleBars_compile("ty-summary",context));
                   
                }  
                //paint individual descriptor here
                for(var i=0; i<descriptor_individual.length;i++){
                   $(".descriptor_"+i+",#descriptor_"+i).text(descriptor_individual[i]);
                }

                konnekForm.customCode(context);// call this function after ty summary painted in the page
                
            }else{
                alert("ERROR:"+data.message+".")
            }
          
      
            konnekForm.hideProgress();  //hide loading  
        }

            konnekForm.PageEvent=function(steps){
                konneckApiCall.importClick();//import clicks to crm.konnektive
                    switch(steps){ 
                        case "thankyou":
                            var val=getQueryStringByName("psmrOnly").toLowerCase().trim();
                          
                            if(getQueryStringByName("psmrOnly")==""){                            
                                konneckApiCall.queryOrder({},konnekForm.thankyouPage);
                            }else if($.cookie("import_data")!=null && (val === 'true')){  
                                var arr = JSON.parse($.cookie("import_data"))
                                konnekForm.thankyouPage(arr);     
                            }else{
                                window.location.href="index.html";
                            }
                            break;
                        default:
                            window.location.href="index.html";
                            break;
                    }

                    return;
            }

            konnekForm.customCode=function(context){
                var options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
                var today  = new Date();
                $(".order-date").html(today.toLocaleDateString("en-US", options))

                //merchat_setup variable can be found in setup.js
                for(var i in merchant_setup){
                       $("."+i).html(merchant_setup[i])
                }
            }     

            konnekForm.exec(); 