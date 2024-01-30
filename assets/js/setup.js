var setup_ = {
    "campaignId": 3,
    // 'paypal_sandbox_id': 3, 
    // 'paypal_production_id':2, 
    "offerType": "cart",
    "corp_type": "garnet"
};

var setup=[  
    { 
        "order":1,
        "prod": "Smart Retailing", "related": [], "defaultLabel": "Garnet Discount Shopping Subscription",
        "monthlyOfferDetails": `*Sign up and pay $32.99 each month for Garnet Discount Shopping to the card provided today. Cancel anytime by emailing support@garnetdiscountshopping.com or calling 833-420-6247.`,
        "prodDescription":` x1 Month`,
        "apiKey":"fae362a8e3b0443bbfd6838cc776e723e29ed5515eaf47b0a5ab758a26869a59"
    }
            
];

var merchant_setup={
    "cs-phone": "833-520-4512",
    "site-name": "Garnet Discount Shopping",
    "cs-email": "support@garnetdiscountshopping.com",
    "company-address": "576 N Birdneck Rd PMB#223, Virginia Beach, VA 23451"
}
function merchant_detials(){
    //merchat_setup variable can be found in setup.js
    for(var i in merchant_setup){
          $("."+i).html(merchant_setup[i])
    }
}

merchant_detials();





  