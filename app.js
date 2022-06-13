//Getting required packages
const express = require('express');
const cheerio = require('cheerio');
const axios = require('axios');
const https = require('https');

//Starting express app
const app = express();

//Defining port, if default isn't declared use 3000
const PORT = process.env.PORT || 3000;

//Stand-in website for scraping
const website = 'https://www.barnesandnoble.com/s/Sasaki%20and%20Miyano';

try {

  //Axios to pull website information
  axios(website).then((res) => {

    //Take into Cheerio
    const data = res.data;
    const $ = cheerio.load(data);

    const check = $('meta[property="og:description"]').attr('content');

    if(check == "Receive free shipping with your Barnes & Noble Membership."){

      let idList = [];
      let pageList = [];
      let stockList = [];

      //get list of ISBN ids to plug into new search format
      const elements = $(".product-shelf-favorite label").each(function(index, element){
        idList.push($(element).attr('id'));
      });

      //For loop to clean each id for ISBN-13
      for(i = 0; i < idList.length; i++){

        let intThing = idList[i].indexOf('score-')+6;
        idList[i] = idList[i].slice(intThing, intThing+13);

      }

      //Get all imagelink elements that contain the href
      const refElements = $(".pImageLink").each(function(index,element) {
        pageList.push($(element).attr('href'));
      })

      //For loop to clean page list and prep for next stage of scraping
      for(i = 0; i < pageList.length; i++){

        let midSection = pageList[i].slice(0,pageList[i].indexOf(";jsession")) + "?ean=";
        pageList[i] = "https://barnesandnoble.com" + midSection + idList[i];

      }

      console.log(pageList);

      //Returned promise that creates cleaned ouptut that can be formatted and used
      stockPromise = getStockList(pageList).then(function(res) {

        for(i = 0; i < res.length; i++){
          stockList[i] = res[i].concat(pageList[i]);
        }

        stockList.sort(stockListSort);
        console.log(stockList);
      })

    } else{
      console.log("Hit first try");
    }

  });


} catch (error) {
  console.log(error, error.message);
}

//End of Try Catch Main Loop




app.listen(PORT, () => {
  console.log(`server is running on PORT:${PORT}`);
});

//Custom sorting function for array
function stockListSort(a,b){

  let x = a[0].toLowerCase();
  let y = b[0].toLowerCase();

  if(x < y) {return -1};
  if(y > x) {return 1};

  return 0;
}

//Get list of all results on page and their stock availability, needs updating to pair title name with stock availablity
async function getStockList(list){

  //List to return to use
  let retList = [];

  try{
    let element;

    //Instance that ignores some weird DNS rules and stuff
    const instance = axios.create({

      httpsAgent: new https.Agent({
        rejectUnauthorized: false
      })

    });

    //For loop that spawns async function to check availabity of each title in list
    for(i = 0; i< list.length; i++){

      element = await instance.get(list[i]);
      retList[i] = await getStockAvailability(element.data);
    }

    return retList;

  } catch(e){
    console.log(e);
    return 0;
  }

  return retList;
}

//Currently checking single variable for stock, if present then out of stock temporarily or pre-order
async function getStockAvailability(data){

  const $ = cheerio.load(data);

  let title = $('.pdp-header-title').text();
  let check = $('.notice').text();
  let imageURL = $('.pdp-product-image noscript').text();

  imageURL = imageURL.slice(imageURL.indexOf('//')+2,imageURL.indexOf('.jpg')+4);

  if(check == "Temporarily out of stock online." || check == "Available for Pre-Order."){

    let date = $('.shipping-message-text span:nth-child(2) span').text();
    return [title, date, check, imageURL];

  } else{

    let shippingDate = $('.shipping-message-text span').text();
    return [title, shippingDate, "In Stock", imageURL];

  }
}

/*
  TODO

  - Load each page into Cheerio and scrub for shipping information
    - If not there, Not in stock and no restock date/OOP
  - User interface for searching
    -Search cleaning to input into B&N
*/
